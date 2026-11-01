const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

test('Criação simples mostra apenas upload, estilo e geração',()=>{
  assert.match(html, /id="pdf-input"/);
  assert.match(html, /id="visual-style"/);
  assert.match(html, /id="generate"/);
  assert.match(html, /id="demo"/);
  assert.match(html, /assuntos são selecionados automaticamente do PDF/i);
});

test('Não há importação de CSV, banca, cargo ou resultados históricos',()=>{
  for(const marker of [
    'id="question-stats"',
    'id="csv-model"',
    'id="exam-board"',
    'id="exam-role"',
    'id="incidence-results"',
    'id="incidence-status"',
    'script src="./incidence.js"',
    'VisuIncidence',
    'rankingAtual()',
    'renderIncidencia()',
    'state.stats'
  ]){
    assert.equal(html.includes(marker),false,'Referência antiga encontrada: '+marker);
  }
  assert.doesNotMatch(html,/accept="\.csv/);
  assert.doesNotMatch(workflow,/cp incidence\.js/);
});

test('Geração é automática e não depende de dados de questões',()=>{
  assert.match(html,/function preparedCandidates\(\)/);
  assert.match(html,/const candidates=preparedCandidates\(\)/);
  assert.match(html,/VisuSelection\.nextBatch\(candidates,state\.generationCursor/);
  assert.match(html,/VisuPDFIntelligence\.headline\(p\.text\)/);
  assert.match(html,/Seleção automática por pistas didáticas do texto/);
  assert.match(html,/não representa frequência comprovada em provas/);
  assert.match(html,/CARDS DO PDF · SELEÇÃO AUTOMÁTICA/);
});

test('Dados antigos sem CSV continuam aceitos sem perder biblioteca e revisão',()=>{
  assert.match(html,/const STORE='visucards_demo_v1'/);
  assert.match(html,/cards:Array\.isArray\(stored\.cards\)\?stored\.cards:\[\]/);
  assert.match(html,/reviews:stored\.reviews/);
  assert.match(html,/cards:state\.cards,parsed:state\.parsed,reviews:state\.reviews/);
  assert.match(html,/state\.generationCursor=batch\.nextCursor/);
});

test('Padrão ilustrado fixado e três estilos permanecem',()=>{
  assert.match(html,/id="premium-card-style"/);
  assert.match(html,/function cardMarkup\(c\)/);
  for(const name of ['caderno','quadrinhos','minimalista']){
    assert.ok(html.includes('<option value="'+name+'">'));
  }
  assert.match(html,/script src="\.\/card-design\.js"/);
  assert.match(html,/script src="\.\/pdf-intelligence\.js"/);
});
