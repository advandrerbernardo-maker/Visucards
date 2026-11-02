const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const demo=require('../ranking-demo.js');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const today=new Date(2026,10,2,12); // Segunda-feira, 02/11/2026

test('Nomes do ranking permanecem os escolhidos, sem identidades reais inventadas',()=>{
  assert.deepEqual(demo.EXAMPLE_PARTICIPANTS.map(x=>x.name),[
    'Estudante Aurora','Concurseiro AM','Lex 2027','Foco Jurídico'
  ]);
  assert.ok(demo.EXAMPLE_PARTICIPANTS.every(x=>x.weekly>0&&x.monthly>0&&x.all>0));
  const board=demo.standings(demo.normalize(null),'weekly',today);
  assert.equal(board.length,5);
  assert.ok(board.some(x=>x.name==='Você'&&!x.example&&x.points===0));
  assert.equal(board.find(x=>x.id==='you').place,5);
});
test('Pontos só entram ao concluir card, não ao deslizar',()=>{
  const previous=demo.normalize(null);
  const first=demo.award(previous,'game-example-1',today);
  assert.equal(first.awarded,true);
  assert.equal(demo.score(first.state,'weekly',today),10);
  assert.equal(demo.score(first.state,'monthly',today),10);
  assert.equal(demo.score(first.state,'all',today),10);
  const repeat=demo.award(first.state,'game-example-1',today);
  assert.equal(repeat.awarded,false);
  assert.equal(repeat.state.awards.length,1);
  assert.equal(previous.awards.length,0,'Não altera pontuação original');
  assert.equal(demo.award(first.state,'invalid id',today).awarded,false);
});
test('Colocação de Você sobe quando acumula XP na missão de exemplo',()=>{
  let state=demo.normalize(null);
  for(const example of demo.demoCards()){
    const r=demo.award(state,example.id,today);
    assert.equal(r.awarded,true);
    state=r.state;
  }
  assert.equal(demo.score(state,'weekly',today),50);
  assert.equal(demo.standings(state,'weekly',today).find(x=>x.id==='you').place,3);
  assert.equal(demo.demoCards().length,5);
  assert.deepEqual(demo.demoCards().map(c=>c.id),demo.demoCards().map(c=>c.id));
  assert.ok(demo.demoCards().every(c=>c.title&&c.text&&c.source));
});
test('Semanal e mensal filtram corretamente virada de períodos',()=>{
  const yesterday=new Date(2026,10,1,12);
  const lastMonth=new Date(2026,9,31,12);
  let state=demo.award(null,'old',lastMonth).state;
  state=demo.award(state,'november-1',yesterday).state;
  state=demo.award(state,'november-2',today).state;
  assert.equal(demo.score(state,'weekly',today),10);
  assert.equal(demo.score(state,'monthly',today),20);
  assert.equal(demo.score(state,'all',today),30);
  assert.equal(demo.mondayKey('2026-11-02'),'2026-11-02');
  assert.equal(demo.mondayKey('2026-11-08'),'2026-11-02');
  assert.equal(demo.mondayKey('2026-11-09'),'2026-11-09');
});
test('Dados alterados e duplicados não criam XP infinito',()=>{
  const raw={awards:[
    {id:'example-1',date:'2026-11-02'},
    {id:'example-1',date:'2026-11-02'},
    {id:'<script>',date:'2026-11-02'},
    {id:'example-2',date:'nao-é-data'},
    {id:'example-3',date:'2026-11-32'},
    {id:'example-4',date:'2026-10-31'}
  ]};
  const safe=demo.normalize(raw);
  assert.equal(safe.awards.length,2);
  assert.equal(demo.score(safe,'all',today),20);
  assert.equal(demo.score(safe,'weekly',today),10);
});
test('Interface do ranking é interativa e explicitamente demonstrativa',()=>{
  for(const id of ['tab-ranking','ranking-title','ranking-test','ranking-reset','ranking-list','ranking-your-points','ranking-my-position','swipe-learn','swipe-review-later','swipe-xp-message']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/data-ranking-period="weekly"/);
  assert.match(html,/data-ranking-period="monthly"/);
  assert.match(html,/data-ranking-period="all"/);
  assert.match(html,/classificação real de usuários/);
  assert.match(html,/exemplos fictícios/);
  assert.match(html,/window\.VisuRankingDemo\.normalize\(stored\.gameDemo\)/);
  assert.match(html,/gameDemo:state\.gameDemo/);
  assert.match(html,/game\.standings\(state\.gameDemo,rankingPeriod\)/);
  assert.match(html,/game\.demoCards\(\)/);
  assert.match(html,/VisuRankingDemo\.award\(previous,current\.id\)/);
  assert.match(html,/const completed=state\.gameDemo\.awards\.some\(a=>a\.id===card\.id\)/);
  assert.match(html,/if\(!persist\(\)\)\{\s*state\.gameDemo=previous/);
  assert.match(html,/if\(name==='ranking'\)renderRanking\(\)/);
  assert.match(workflow,/cp ranking-demo\.js site\/ranking-demo\.js/);
  assert.match(html,/VISUCARDS · VERSÃO 1\.3 DE TESTE/);
  for(const script of [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]){
    assert.doesNotThrow(()=>new vm.Script(script[1]));
  }
});
