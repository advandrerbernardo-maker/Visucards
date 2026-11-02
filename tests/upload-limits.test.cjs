const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

test('Upload não rejeita PDF por quantidade de páginas; usa até 50 MB',()=>{
  assert.match(html,/unlimitedPDFs:\s*true/);
  assert.match(html,/pdfPages:\s*Number\.POSITIVE_INFINITY/);
  assert.match(html,/batchPages:\s*15/);
  assert.match(html,/maxFileBytes:\s*50\s*\*\s*1024\s*\*\s*1024/);
  assert.match(html,/window\.VisuPolicy\.canUploadPDF\(state\.pdfCount,pdf\.numPages,file\.size\)/);
  assert.doesNotMatch(html,/pdf\.numPages>window\.VisuPolicy\.FREE\.pages/);
  assert.match(html,/state\.pdfCount\+=1/);
});

test('Importar um novo PDF não elimina cards ou revisões anteriores',()=>{
  const begin=html.indexOf('function saveProgress(');
  const end=html.indexOf("$('#generate').onclick",begin);
  const section=html.slice(begin,end);
  assert.match(section,/state\.parsed=parsed/);
  assert.match(section,/state\.generationCursor=cursor/);
  assert.doesNotMatch(section,/state\.cards\s*=\s*\[\]/);
  assert.doesNotMatch(section,/state\.reviews\s*=\s*\{\}/);
  assert.match(html,/cards:state\.cards,parsed:state\.parsed,reviews:state\.reviews,documents:state\.documents/);
});

test('PDFs são retomados sem repetir páginas e o progresso sobrevive a reinícios',()=>{
  assert.match(html,/c\.page>=1&&c\.page<=\(p\.totalPages\|\|15\)/);
  assert.match(html,/if\(!window\.VisuPolicy\.TEST_MODE\.unlimitedPDFs\)\{state\.generationCursor=0;state\.parsed=null\}/);
  assert.match(html,/existing\?\.pending\?\.parsed/);
  assert.match(html,/VisuPDFBatches\.cacheFile\(hash,file\)/);
  assert.match(html,/VisuPDFBatches\.cachedFile\(doc\.hash\)/);
});

test('Leitor libera o PDF, acompanha cada bloco e preserva posição na falha',()=>{
  assert.match(html,/if\(pdf\)try\{await pdf\.destroy\(\)\}/);
  assert.match(html,/Lendo páginas/);
  assert.match(html,/VisuPDFBatches\.range\(doc\.totalPages,doc\.nextPage\)/);
  assert.match(html,/isEvalSupported:false/);
  assert.match(html,/O progresso anterior foi mantido/);
});

test('Modo de testes mostra 15 páginas por etapa e publica o leitor',()=>{
  assert.match(html,/PDF de qualquer quantidade de páginas/);
  assert.match(html,/15 páginas por etapa/);
  assert.match(html,/VISUCARDS · VERSÃO 1\.2 DE TESTE/);
  assert.match(workflow,/node --test tests\/\*\.test\.cjs/);
  assert.match(workflow,/cp pdf-batches\.js site\/pdf-batches\.js/);
});
