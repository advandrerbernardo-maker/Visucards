const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');

test('VISUCARDS: página tem estrutura e funções principais', () => {
  assert.match(html, /<html lang="pt-BR">/);
  for (const marker of ['id="pdf-input"', 'id="generate"', 'id="library-list"', 'id="tab-combos"', 'id="tab-planos"']) {
    assert.ok(html.includes(marker), 'Ausente: ' + marker);
  }
});

test('Scripts internos compilam sem erros', () => {
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length >= 3);
  for (const match of scripts) assert.doesNotThrow(() => new vm.Script(match[1]));
});

test('Modo de testes: PDFs ilimitados e leitura sequencial de 15 páginas até o fim', () => {
  assert.match(html, /PDF de qualquer quantidade de páginas, até 50 MB/);
  assert.match(html, /PDFs sem limite mensal/);
  assert.match(html, /Cards ilimitados durante os testes/);
  const begin=html.indexOf('/* Fonte original: policy.js */');
  const finish=html.indexOf('</script>',begin);
  const policy=html.slice(begin,finish);
  assert.ok(policy, 'Não encontrou a configuração de testes');
  const sandbox={module:{exports:{}}};
  vm.runInNewContext(policy,sandbox);
  const cfg=sandbox.module.exports;
  assert.equal(cfg.TEST_MODE.unlimitedCards,true);
  assert.equal(cfg.TEST_MODE.unlimitedPDFs,true);
  assert.equal(cfg.TEST_MODE.pdfPages,Infinity);
  assert.equal(cfg.TEST_MODE.batchPages,15);
  assert.equal(cfg.TEST_MODE.maxFileBytes,50*1024*1024);
  assert.equal(cfg.FREE.pdf,1,'Proposta comercial ainda preservada');
  assert.equal(cfg.FREE.pages,5,'Proposta comercial ainda preservada');
  assert.equal(cfg.remainingCards(0),Infinity);
  assert.equal(cfg.remainingCards(999999),Infinity);
  assert.equal(cfg.canUploadPDF(0,15,50*1024*1024),true);
  assert.equal(cfg.canUploadPDF(25,15,50*1024*1024),true);
  assert.equal(cfg.canUploadPDF(0,16,1024),true);
  assert.equal(cfg.canUploadPDF(25,10000,1024),true);
  assert.equal(cfg.canUploadPDF(0,15,50*1024*1024+1),false);
  assert.equal(cfg.canUploadPDF(0,0,1024),false);
  assert.equal(cfg.canUploadPDF(0,10,0),false);
});
test('Geração continua livre por lotes e oferece recomeço após usar todo o conteúdo',()=>{
  assert.ok(html.includes('state.generationCursor=batch.nextCursor'));
  assert.ok(html.includes('window.VisuPolicy.remainingCards(state.cardCount)>0'));
  assert.ok(html.includes('Gerar mais 2 cards'));
  assert.ok(html.includes("$('#restart-generation').onclick"));
});

test('Uploads e compras não são apresentados como serviço ativo', () => {
  assert.match(html, /nenhuma compra será realizada/);
  assert.match(html, /Assinaturas ainda não estão habilitadas/);
  assert.match(html, /Sem IA conectada, os trechos não são enviados a servidores/);
});

test('Leitor PDF possui proteção extra contra execução de scripts', () => {
  assert.match(html, /PDFJS_VERSION='6\.4\.299'/);
  assert.match(html, /isEvalSupported:false/);
  assert.doesNotMatch(html, /3\.11\.174/);
});

test('Mobile: o cabeçalho não pode cobrir o conteúdo ao rolar a página', () => {
  assert.match(html, /@media\(max-width:680px\)[\s\S]*?\.sidebar\{height:67px;position:relative;z-index:10;top:auto/);
  assert.doesNotMatch(html, /\.sidebar\{height:67px;position:sticky/);
  assert.match(html, /\.nav button\{padding:10px 6px;font-size:0\}/);
});
