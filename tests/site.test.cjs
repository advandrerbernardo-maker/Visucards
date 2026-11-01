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

test('Plano gratuito: 1 PDF de 5 páginas e 2 cards por mês', () => {
  assert.match(html, /PDF de até 5 páginas/);
  assert.match(html, /2 cards ilustrados\/mês/);
  assert.match(html, /pdf:\s*1/);
  assert.match(html, /pages:\s*5/);
  assert.match(html, /cards:\s*2/);
});

test('Uploads e compras não são apresentados como serviço ativo', () => {
  assert.match(html, /nenhuma compra será realizada/);
  assert.match(html, /Assinaturas ainda não estão habilitadas/);
  assert.match(html, /Não há envio a servidor/);
});

test('Leitor PDF possui proteção extra contra execução de scripts', () => {
  assert.match(html, /PDFJS_VERSION='6\.4\.299'/);
  assert.match(html, /isEvalSupported:false/);
  assert.doesNotMatch(html, /3\.11\.174/);
});
