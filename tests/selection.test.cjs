const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const selection=require('../selection.js');

test('Regras, exceções e prazos são relevantes para triagem didática',()=>{
  const generic='Este é um parágrafo de introdução sobre a disciplina, apresentando os assuntos de maneira geral sem aprofundar regras de estudo.';
  const normative='O art. 5º estabelece que é vedado agir fora da competência, salvo na hipótese prevista em lei. O prazo é de quinze dias.';
  assert.ok(selection.score(normative)>selection.score(generic));
});

test('Seleção didática não é divulgada como frequência de questões',()=>{
  const s=fs.readFileSync('selection.js','utf8');
  assert.match(s,/Não representa incidência estatística/);
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/não representa frequência comprovada em provas/i);
  assert.match(html,/selection\.js/);
});

test('Ordem didática é estável em empates e preserva os textos originais',()=>{
  const chunks=[{page:1,text:'Texto neutro de consulta.'},{page:2,text:'Texto neutro de consulta.'}];
  const ranked=selection.prioritize(chunks);
  assert.deepEqual(ranked.map(c=>c.page),[1,2]);
  assert.deepEqual(ranked.map(c=>c.text),chunks.map(c=>c.text));
});

test('Geração não reduz trechos a 48 palavras arbitrárias',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.doesNotMatch(html,/text:words\(p\.text,48\)/);
  assert.match(html,/text:clean\(p\.text\)/);
});

test('Geração usa somente os trechos extraídos do PDF',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.ok(html.includes('VisuSelection.nextBatch(candidates,state.generationCursor'));
  assert.ok(!html.includes('rankingAtual()'));
  assert.ok(!html.includes('VisuIncidence'));
});

test('Lotes sucessivos percorrem trechos do PDF antes de recomeçar',()=>{
  const chunks=[
    {page:1,text:'Regra A'},
    {page:2,text:'Regra B'},
    {page:3,text:'Regra C'},
    {page:4,text:'Regra D'}
  ];
  const first=selection.nextBatch(chunks,0,2);
  const second=selection.nextBatch(chunks,first.nextCursor,2);
  const third=selection.nextBatch(chunks,second.nextCursor,2);
  assert.deepEqual(first.selected.map(x=>x.page),[1,2]);
  assert.deepEqual(second.selected.map(x=>x.page),[3,4]);
  assert.deepEqual(third.selected.map(x=>x.page),[1,2]);
  assert.equal(second.recycled,false);
  assert.equal(third.recycled,true);
  assert.deepEqual(selection.nextBatch([],500,2).selected,[]);
});
test('Geração pode continuar indefinidamente sem bloquear por quantidade',()=>{
  const list=[{text:'A'},{text:'B'},{text:'C'}];
  let cursor=0;
  for(let i=0;i<1100;i++){
    const batch=selection.nextBatch(list,cursor,2);
    assert.equal(batch.selected.length,2);
    cursor=batch.nextCursor;
  }
  assert.ok(cursor>2000);
});

test('Pontuação reconhece Art. 5º e parágrafos com ordinal',()=>{
  assert.ok(selection.score('Art. 5º assegura direitos.')>selection.score('Texto neutro de consulta.'));
  assert.ok(selection.score('§ 1º A competência será exercida conforme a lei.')>selection.score('Texto neutro de consulta.'));
});
