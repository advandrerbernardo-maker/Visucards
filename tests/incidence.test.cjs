const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const inc=require('../incidence.js');

test('CSV aceita colunas oficiais e não inventa frequência',()=>{
  const rows=inc.parseCSV('assunto;questoes;banca;cargo;ano\nAmpla defesa;27;FGV;Analista Judiciário;2025\nSegurança jurídica;14;FGV;Analista Judiciário;2024\n');
  assert.equal(rows.length,2);
  assert.equal(rows[0].questions,27);
  assert.equal(rows[1].topic,'Segurança jurídica');
});
test('CSV com vírgula, aspas e acentos',()=>{
  const rows=inc.parseCSV('assunto,questões,banca,cargo\n"Responsabilidade civil, Estado",8,Cebraspe,Analista');
  assert.equal(rows[0].topic,'Responsabilidade civil, Estado');
  assert.equal(rows[0].questions,8);
});
test('Arquivo não aceita ausência de dados nem números falsos',()=>{
  assert.throws(()=>inc.parseCSV('assunto;questoes\nPrazo;mais de vinte'),/inválida/);
  assert.throws(()=>inc.parseCSV('assunto;questoes\nPrazo;0'),/não contém/);
  assert.throws(()=>inc.parseCSV('assunto;ano\nDireito;2020'),/colunas/);
});
test('Priorização usa frequência da banca e cargo escolhidos',()=>{
  const rows=inc.parseCSV('assunto;questoes;banca;cargo;ano\nAmpla defesa;27;FGV;Analista;2025\nSegurança jurídica;14;FGV;Analista;2024\nAmpla defesa;88;CESPE;Outro;2023');
  const chunks=[
    {page:1,text:'A segurança jurídica protege a confiança legítima e a estabilidade das relações jurídicas no Direito Administrativo.'},
    {page:2,text:'O princípio da ampla defesa assegura que a pessoa apresente provas para se defender em processo administrativo.'}
  ];
  const result=inc.rank(chunks,rows,{banca:'FGV',cargo:'Analista'});
  assert.equal(result.sampleRows,2);
  assert.equal(result.sampleQuestions,41);
  assert.equal(result.ranked[0].page,2);
  assert.equal(result.ranked[0].questions,27);
  assert.equal(result.ranked[1].questions,14);
});
test('Sem histórico ou sem combinação não há evidência de cobrança',()=>{
  const chunks=[{page:1,text:'Princípio da ampla defesa e direito de defesa.'}];
  assert.equal(inc.rank(chunks,[],{}).evidence,false);
  const sample=inc.parseCSV('assunto;questoes;banca\nAmpla defesa;70;FGV');
  assert.equal(inc.rank(chunks,sample,{banca:'Vunesp'}).evidence,false);
  assert.equal(inc.rank([{page:1,text:'assuntos diferentes sobre tributos'}],sample).evidence,false);
});
test('HTML tem controles de ranking e não atribui incidência sem dados',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/id="question-stats"/);
  assert.match(html,/id="exam-board"/);
  assert.match(html,/id="exam-role"/);
  assert.match(html,/id="incidence-results"/);
  assert.match(html,/script src="\.\/incidence\.js"/);
  assert.match(html,/não há comprovação de incidência/);
});
test('A publicação inclui o arquivo independente de ranking',()=>{
  const flow=fs.readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(flow,/cp incidence\.js site\/incidence\.js/);
});
