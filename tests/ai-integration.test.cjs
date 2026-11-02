const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ai=require('../ai-cards.js');
const html=fs.readFileSync('index.html','utf8');
const server=fs.readFileSync('supabase/functions/visucards-ai/index.ts','utf8');
const quota=fs.readFileSync('backend/ai_usage.sql','utf8');
const config=fs.readFileSync('ai-config.js','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

const source={
  id:'c10001', title:'Art. 5º O direito à manifestação',
  text:'Art. 5º O direito à manifestação será exercido no prazo de 15 dias, salvo disposição expressa em sentido contrário.',
  source:'material.pdf · pág. 2',color:0,layout:'caderno'
};

test('Configuração vazia desliga chamadas de IA e preserva funcionamento local',async()=>{
  assert.equal(ai.configured(),false);
  assert.match(config,/enabled:\s*false/);
  assert.match(config,/cuzqfjmjfozfngrahkzz\.supabase\.co/);
  assert.match(config,/sb_publishable_/);
  assert.match(fs.readFileSync('ai-cards.js','utf8'),/c\.enabled===true/);
  const answer=await ai.enhance([source]);
  assert.equal(answer.usedAI,false);
  assert.equal(answer.reason,'not_configured');
  assert.equal(answer.cards[0],source);
  assert.doesNotMatch(config,/GROQ_API_KEY\s*=\s*["'][A-Za-z0-9]/);
  assert.doesNotMatch(config,/^\s*serviceRoleKey\s*:/m);
});

test('IA só propõe diagramas com labels literais do PDF',()=>{
  const visual={kind:'timeline',labels:['Art. 5º','15 dias','salvo disposição expressa']};
  assert.deepEqual(ai.validatePlan(visual,source.text),visual);
  assert.equal(ai.validatePlan({kind:'timeline',labels:['15 dias','99 dias']},source.text),null);
  assert.equal(ai.validatePlan({kind:'javascript',labels:['Art. 5º','15 dias']},source.text),null);
  assert.equal(ai.validatePlan({kind:'flow',labels:['<script>alert(1)</script>','15 dias']},source.text),null);
});

test('Texto, referência e números só podem vir do PDF, não da IA',()=>{
  const result=ai.validateOutput([source],{cards:[{
    id:source.id,
    title:'Texto inventado sobre artigo 999',
    text:'Esta regra não existe',
    page:999,
    visual:{kind:'timeline',labels:['Art. 5º','15 dias']}
  }]});
  assert.equal(result.length,1);
  assert.equal(result[0].text,source.text);
  assert.equal(result[0].source,source.source);
  assert.equal(result[0].title,source.title);
  assert.equal(result[0].aiVerified,true);
  assert.equal(result[0].visualPlan.kind,'timeline');
  assert.throws(()=>ai.validateOutput([source],{cards:[{id:'id-errado'}]}));
});

test('Diagrama não aceita SVG, scripts ou texto HTML arbitrário',()=>{
  const safe=ai.svgDiagram({kind:'compare',labels:['15 dias','Art. 5º']});
  assert.match(safe,/^<svg xmlns=/);
  assert.match(safe,/15 dias/);
  assert.doesNotMatch(safe,/<script|onload=|https:\/\//);
  assert.equal(ai.svgDiagram({kind:'malicious',labels:['15 dias','Art. 5º']}),'');
});

test('Nova integração preserva seleção, biblioteca e layout aprovado',()=>{
  assert.match(html,/src="\.\/ai-config\.js"/);
  assert.match(html,/src="\.\/ai-cards\.js"/);
  assert.match(html,/VisuAI\.installArtHook\(\)/);
  assert.match(html,/VisuAI\.register\(state\.cards\)/);
  assert.match(html,/await window\.VisuAI\.enhance\(cards\)/);
  assert.match(html,/aiResult\.usedAI\?'CARDS COM IA/);
  assert.match(html,/id="ai-setup" class="hidden"/);
  assert.match(html,/id="visual-style"/);
  assert.match(html,/function cardMarkup\(c\)/);
  assert.match(workflow,/cp ai-cards\.js site\/ai-cards\.js/);
  assert.match(workflow,/cp ai-config\.js site\/ai-config\.js/);
});

test('Backend exige usuário confirmado, reserva cota e mantém segredo só no servidor',()=>{
  assert.match(server,/auth\.getUser\(token\)/);
  assert.match(server,/user\.is_anonymous/);
  assert.match(server,/user\.email_confirmed_at/);
  assert.match(server,/admin\.rpc\("visu_ai_reserve"/);
  assert.match(server,/Deno\.env\.get\("GROQ_API_KEY"\)/);
  assert.match(server,/response_format:\{type:"json_object"\}/);
  assert.match(server,/groundedPlan\(entry\.visual,input\.text\)/);
  assert.match(server,/origin!==ALLOWED_ORIGIN/);
  assert.match(quota,/enable row level security/);
  assert.match(quota,/revoke all on function public\.visu_ai_reserve\(uuid\) from public,anon,authenticated/);
  assert.match(quota,/grant execute on function public\.visu_ai_reserve\(uuid\) to service_role/);
  assert.doesNotMatch(workflow,/cp .*functions.*index\.ts/);
});

test('Modo local cria diagramas específicos a partir das palavras do PDF',()=>{
  const plan=ai.localPlan(source.text);
  assert.ok(plan);
  assert.equal(plan.kind,'compare');
  assert.ok(plan.labels.some(x=>x.includes('15 dias')));
  assert.ok(plan.labels.every(x=>source.text.includes(x)));
  const original=JSON.stringify(source);
  const local=ai.decorateLocal([source]);
  assert.equal(local.length,1);
  assert.deepEqual(local[0].visualPlan,plan);
  assert.equal(JSON.stringify(source),original,'Não deve alterar o PDF ou card original');
  assert.equal(local[0].aiVerified,undefined);
});

test('Diagramas locais podem ser renderizados no cartão sem modificar cardMarkup',()=>{
  const before=globalThis.VisuArt;
  globalThis.VisuArt={kindOf:()=> 'book',svg:()=>'<svg/>'};
  try{
    ai.installArtHook();
    const local=ai.decorateLocal([source]);
    ai.register(local);
    const visualId=globalThis.VisuArt.kindOf(local[0].title+' '+local[0].text);
    assert.match(visualId,/^ai-diagram-\d+$/);
    const graphic=globalThis.VisuArt.svg(visualId);
    assert.match(graphic,/15 dias/);
    assert.match(graphic,/Art. 5º/);
    assert.match(graphic,/^<svg xmlns=/);
  }finally{globalThis.VisuArt=before}
});
