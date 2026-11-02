const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const selection=require('../selection.js');
const html=fs.readFileSync('index.html','utf8');

test('Cards usam perguntas específicas sem inventar resposta legal',()=>{
  const cases=[
    ['A lei prevê a exceção, salvo quando houver outra disposição.','qual é a exceção'],
    ['O prazo de apresentação é de 15 dias para manifestação.','qual é o prazo'],
    ['Fica vedada a prática do ato.','o que o trecho proíbe'],
    ['Os requisitos do pedido deverão ser atendidos.','quais requisitos'],
    ['Compete à autoridade analisar o pedido.','a quem é atribuída'],
    ['Art. 5º São asseguradas as garantias indicadas.','o que estabelece o artigo'],
    ['A educação promove o desenvolvimento e a cidadania.','qual é a ideia central']
  ];
  for(const [content,expected] of cases){
    const note=selection.studyPrompt(content);
    assert.ok(note.includes(expected),note+' | '+content);
    assert.ok(note.startsWith('Pergunta de revisão: '));
    assert.ok(!note.includes('15 dias'),'A pergunta não deve inventar ou copiar números sem contexto');
  }
});

test('Uma fila preserva conteúdo original e não repete trecho idêntico',()=>{
  const text='Art. 5º As garantias serão observadas no procedimento administrativo, desde que sejam satisfeitas as condições previstas na norma aplicável.';
  const input=[{page:1,text},{page:2,text},{page:3,text:text.replace('5º','6º')}];
  const original=JSON.stringify(input);
  const queue=selection.buildQueue(input);
  assert.equal(queue.length,2);
  assert.equal(JSON.stringify(input),original);
  assert.equal(new Set(queue.map(c=>c.text)).size,2);
});

test('Resto de um único trecho vira um card sem repetir o início do PDF',()=>{
  const pool=[{text:'A'},{text:'B'},{text:'C'}];
  const first=selection.nextBatch(pool,0,2);
  const next=selection.nextBatch(pool,first.nextCursor,2);
  assert.equal(next.selected.length,1);
  assert.equal(next.selected[0].text,'C');
  assert.equal(next.exhausted,true);
  assert.equal(next.remaining,0);
  assert.equal(selection.nextBatch(pool,next.nextCursor,2).selected.length,0);
});

test('Fluxo simplificado mostra progresso por bloco e próximas páginas',()=>{
  assert.match(html,/id="coverage-hint"/);
  assert.match(html,/id="restart-generation"/);
  assert.match(html,/function preparedCandidates\(\)/);
  assert.match(html,/window\.VisuSelection\.buildQueue\(state\.parsed\.chunks\)/);
  assert.match(html,/\$\{used\} de \$\{candidates\.length\} trechos deste bloco utilizados/);
  assert.match(html,/window\.VisuSelection\.studyPrompt\(p\.text\)/);
  assert.match(html,/state\.generationCursor=0;/);
  assert.match(html,/if\(!persist\(\)\)\{state\.generationCursor=previousCursor/);
});

test('Layout fixado 0.5 permanece independente da fila didática',()=>{
  const design=fs.readFileSync('DESIGN_LOCK.md','utf8');
  assert.match(design,/design-locked-v0\.5/);
  assert.match(html,/premium-card-style/);
  assert.match(html,/function cardMarkup\(c\)/);
  assert.match(html,/VISUCARDS · VERSÃO 1\.2 DE TESTE/);
});
