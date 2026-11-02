const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const selection=require('../selection.js');
const intelligence=require('../pdf-intelligence.js');
const html=fs.readFileSync('index.html','utf8');
const visual=fs.readFileSync('DESIGN_LOCK.md','utf8');

test('Geração de bloco inteiro é opcional e continua local, sem chamar IA a cada lote',()=>{
  assert.match(html,/id="generate-block"/);
  assert.match(html,/id="batch-progress"/);
  assert.match(html,/\$\('#generate-block'\)\.onclick=async\(\)=>/);
  assert.match(html,/if\(!autoGenerating\)try\{aiResult=await window\.VisuAI\.enhance\(cards\)/);
  assert.match(html,/await \$\('#generate'\)\.onclick\(\)/);
  assert.match(html,/setTimeout\(resolve,20\)/);
  assert.match(html,/if\(state\.generationCursor<=before\)break/);
});

test('Parar geração preserva o checkpoint já persistido e permite continuar',()=>{
  assert.match(html,/autoStop=true/);
  assert.match(html,/if\(!autoGenerating\)show\(cards\.length/);
  assert.match(html,/state\.generationCursor=batch\.nextCursor/);
  assert.match(html,/state\.cards\.push\(\.\.\.cards\)/);
  assert.match(html,/if\(!persist\(\)\)\{/);
  assert.match(html,/Geração pausada/);
  assert.match(html,/lastCards,'ÚLTIMOS CARDS · LOTE LOCAL'/);
});

test('PDFs não repetem cards idênticos nos blocos seguintes',()=>{
  const article='Art. 33 A administração deverá observar os requisitos do procedimento administrativo, os prazos previstos em lei e o princípio da legalidade.';
  const oldCards=[{text:article,documentHash:'a'.repeat(64)}];
  const nextBlock=[
    {page:16,text:article},
    {page:17,text:article.replace('33','34')}
  ];
  const filtered=nextBlock.filter(chunk=>!oldCards.some(card=>selection.nearDuplicate(card.text,chunk.text)));
  assert.equal(filtered.length,1);
  assert.equal(filtered[0].page,17);
  assert.match(html,/const previousCards=state\.cards\.filter\(card=>card\.documentHash===doc\.hash\)/);
  assert.match(html,/VisuSelection\.nearDuplicate\(card\.text,chunk\.text\)/);
  assert.match(html,/documentHash:state\.parsed\.hash\|\|null/);
  assert.match(html,/documentHash:typeof c\.documentHash/);
});

test('A posição original da página é mantida após 15 páginas',()=>{
  const source='Art. 41 O processo observará os requisitos e o prazo previsto na norma, com as garantias e ressalvas aplicáveis à competência administrativa.';
  const r=intelligence.extract([source],selection.prioritize,31);
  assert.equal(r.chunks.length,1);
  assert.equal(r.chunks[0].page,31);
});

test('Versão 1.1 mantém design oficial 0.5 e limite de 50 MB por PDF',()=>{
  assert.match(html,/VISUCARDS · VERSÃO 1\.1 DE TESTE/);
  assert.match(visual,/design-locked-v0\.5/);
  assert.match(html,/maxFileBytes: 50 \* 1024 \* 1024/);
  assert.match(html,/function cardMarkup\(c\)/);
});
