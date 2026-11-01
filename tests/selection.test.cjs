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

test('Lotes sucessivos não repetem o PDF antes do recomeço manual',()=>{
  const chunks=[
    {page:1,text:'Regra A'},
    {page:2,text:'Regra B'},
    {page:3,text:'Regra C'},
    {page:4,text:'Regra D'},
    {page:5,text:'Regra E'}
  ];
  const first=selection.nextBatch(chunks,0,2);
  const second=selection.nextBatch(chunks,first.nextCursor,2);
  const third=selection.nextBatch(chunks,second.nextCursor,2);
  const finished=selection.nextBatch(chunks,third.nextCursor,2);
  assert.deepEqual(first.selected.map(x=>x.page),[1,2]);
  assert.deepEqual(second.selected.map(x=>x.page),[3,4]);
  assert.deepEqual(third.selected.map(x=>x.page),[5]);
  assert.equal(third.remaining,0);
  assert.equal(third.exhausted,true);
  assert.deepEqual(finished.selected,[]);
  assert.equal(finished.recycled,false);
  assert.deepEqual(selection.nextBatch([],500,2).selected,[]);
  assert.deepEqual(selection.nextBatch(chunks,0,2).selected.map(x=>x.page),[1,2]);
});

test('Geração continua ilimitada por recomeço voluntário, sem repetir durante um ciclo',()=>{
  const list=[{text:'A'},{text:'B'},{text:'C'}];
  let cursor=0;
  let generated=0;
  for(let i=0;i<1100;i++){
    const batch=selection.nextBatch(list,cursor,2);
    generated+=batch.selected.length;
    assert.ok(batch.selected.length>=1&&batch.selected.length<=2);
    cursor=batch.exhausted?0:batch.nextCursor;
  }
  assert.ok(generated>1600);
});

test('Textos repetidos são eliminados sem misturar artigos ou inverter negações',()=>{
  const base='O art. 5º determina que os requisitos definidos na lei serão observados pela administração para garantir a validade do procedimento.';
  assert.equal(selection.nearDuplicate(base,base.toUpperCase()),true);
  assert.equal(selection.nearDuplicate(base,base.replace('5º','6º')),false);
  const allowed='É permitido realizar o procedimento indicado na norma conforme as condições legais aplicáveis. O ato deve ser conferido e registrado.';
  const forbidden='Não é permitido realizar o procedimento indicado na norma conforme as condições legais aplicáveis. O ato deve ser conferido e registrado.';
  assert.equal(selection.nearDuplicate(allowed,forbidden),false);
  const queue=selection.buildQueue([
    {page:1,text:base},
    {page:2,text:base.toUpperCase()},
    {page:3,text:base.replace('5º','6º')}
  ]);
  assert.equal(queue.length,2);
  assert.ok(queue.some(x=>x.text.includes('5º')));
  assert.ok(queue.some(x=>x.text.includes('6º')));
});

test('Seleção diversifica páginas quando os trechos são igualmente relevantes',()=>{
  const text=n=>'Art. '+n+'º A competência será exercida conforme os requisitos previstos na norma. A aplicação deverá observar o devido procedimento administrativo.';
  const queue=selection.buildQueue([
    {page:1,text:text(5)},
    {page:1,text:text(6)},
    {page:2,text:text(7)},
    {page:3,text:text(8)}
  ]);
  assert.equal(queue.length,4);
  assert.notEqual(queue[0].page,queue[1].page);
  assert.equal(new Set(queue.map(x=>x.text)).size,4);
});

test('Pontuação reconhece Art. 5º e parágrafos com ordinal',()=>{
  assert.ok(selection.score('Art. 5º assegura direitos.')>selection.score('Texto neutro de consulta.'));
  assert.ok(selection.score('§ 1º A competência será exercida conforme a lei.')>selection.score('Texto neutro de consulta.'));
});
