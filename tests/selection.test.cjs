const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const selection=require('../selection.js');

test('Regras, exceções e prazos são relevantes para triagem didática',()=>{
  const generic='Este é um parágrafo de introdução sobre a disciplina, apresentando os assuntos de maneira geral sem aprofundar regras de estudo.';
  const normative='O art. 5º estabelece que é vedado agir fora da competência, salvo na hipótese prevista em lei. O prazo é de quinze dias.';
  assert.ok(selection.score(normative)>selection.score(generic));
});

test('Texto sem pistas não é apresentado como incidência histórica',()=>{
  const s=fs.readFileSync('selection.js','utf8');
  assert.match(s,/Não representa incidência estatística/);
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/Sem histórico de questões, não há comprovação de incidência/);
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

test('Ranking com dados históricos mantém prioridade sobre triagem textual',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/const chosenPool=ranking\.evidence\?ranking\.ranked\.filter\(c=>c\.questions>0\):candidates/);
});
