const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

test('Upload de PDFs no teste respeita 15 páginas e 50 MB sem cota mensal',()=>{
  assert.match(html,/unlimitedPDFs:\s*true/);
  assert.match(html,/pdfPages:\s*15/);
  assert.match(html,/maxFileBytes:\s*50\s*\*\s*1024\s*\*\s*1024/);
  assert.match(html,/window\.VisuPolicy\.canUploadPDF\(state\.pdfCount,pdf\.numPages,file\.size\)/);
  assert.doesNotMatch(html,/state\.pdfCount>=window\.VisuPolicy\.FREE\.pdf/);
  assert.doesNotMatch(html,/pdf\.numPages>window\.VisuPolicy\.FREE\.pages/);
  assert.match(html,/state\.pdfCount\+=1/);
});

test('Arquivo novo não apaga cards antigos ou revisões',()=>{
  const section=html.slice(html.indexOf('async function readFile(file)'),html.indexOf("$('#generate').onclick"));
  assert.match(section,/state\.parsed=parsed/);
  assert.match(section,/state\.generationCursor=0/);
  assert.doesNotMatch(section,/state\.cards\s*=\s*\[\]/);
  assert.doesNotMatch(section,/state\.reviews\s*=\s*\{\}/);
  assert.match(html,/cards:state\.cards,parsed:state\.parsed,reviews:state\.reviews/);
});

test('PDF salvo continua recuperável e troca de mês não apaga material de testes',()=>{
  assert.match(html,/c\.page>=1&&c\.page<=window\.VisuPolicy\.uploadLimits\(\)\.pages/);
  assert.match(html,/if\(!window\.VisuPolicy\.TEST_MODE\.unlimitedPDFs\)\{state\.generationCursor=0;state\.parsed=null\}/);
  assert.match(html,/Seu último PDF foi recuperado/);
});

test('Leitor libera os recursos do documento ao finalizar e acompanha o progresso',()=>{
  assert.match(html,/if\(pdf\)try\{await pdf\.destroy\(\)\}/);
  assert.match(html,/Lendo página \$\{p\} de \$\{pdf\.numPages\}/);
  assert.match(html,/isEvalSupported:false/);
});

test('A interface informa os limites reais do modo de testes e a publicação continua segura',()=>{
  assert.match(html,/PDFs sem limite mensal/);
  assert.match(html,/Até 15 páginas e 50 MB por arquivo/);
  assert.match(html,/VISUCARDS · VERSÃO 0\.9 DE TESTE/);
  assert.match(workflow,/node --test tests\/\*\.test\.cjs/);
  assert.match(workflow,/cp index\.html site\/index\.html/);
});
