const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const cards=require('../card-design.js');

test('Organizador preserva texto original e referência sem inventar explicações',()=>{
  const text='Art. 5º assegura a participação do interessado. O prazo indicado é de 15 dias. Salvo previsão legal específica, a regra será observada.';
  const card=cards.build({title:'Teste',text,source:'Apostila.pdf · pág. 2',note:'Conferir texto original.'});
  assert.equal([card.lead,...card.sections.map(s=>s.text)].join(' '),text);
  assert.equal(card.fullText,text);
  assert.equal(card.source,'Apostila.pdf · pág. 2');
  assert.equal(card.note,'Conferir texto original.');
  assert.equal(card.subject.label,'EXCEÇÃO');
  assert.ok(card.anchors.includes('Art. 5º'));
  assert.ok(card.anchors.includes('15 dias'));
});

test('Não separa Art. do número em uma frase',()=>{
  const text='Art. 5º estabelece um princípio constitucional. O prazo é de 5 dias.';
  const parts=cards.splitText(text);
  assert.equal(parts[0],'Art. 5º estabelece um princípio constitucional.');
  assert.equal(parts.join(' '),text);
});

test('Textos longos não são descartados ou limitados por caracteres',()=>{
  const input=Array.from({length:45},(_,i)=>'O requisito '+i+' deve ser identificado no documento.').join(' ');
  const parts=cards.splitText(input);
  assert.equal(parts.join(' '),input);
  assert.ok(parts.length<=4);
});

test('Tipo do conteúdo reflete apenas palavras existentes no trecho',()=>{
  assert.equal(cards.classify('O prazo estabelecido é de 10 dias.').id,'time');
  assert.equal(cards.classify('É vedado determinado procedimento.').id,'prohibition');
  assert.equal(cards.classify('Texto introdutório sem regra normativa explícita.').id,'concept');
});

test('Página e publicação incluem o novo motor visual',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const flow=fs.readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(html,/script src="\.\/card-design\.js"/);
  assert.match(flow,/cp card-design\.js site\/card-design\.js/);
  assert.match(html,/premium-card/);
});
