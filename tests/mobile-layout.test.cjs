const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const html = readFileSync('index.html', 'utf8');

test('Cards ocupam uma coluna em celulares e tablets pequenos', () => {
  assert.match(html, /@media\s*\(max-width:900px\)\s*\{[\s\S]*?\.showcase\{grid-template-columns:minmax\(0,1fr\)/);
});

test('Altura do card acompanha conteúdo sem cortar os parágrafos', () => {
  assert.match(html, /\.showcase \.card-visual\{\s*aspect-ratio:auto;/);
  assert.match(html, /\.showcase \.card-visual h3\{\s*flex:0 0 auto;[\s\S]*?max-height:none;/);
  assert.match(html, /\.showcase \.card-visual \.bubble\{\s*flex:0 0 auto;/);
});

test('Rodapé e marca não ficam por cima dos textos', () => {
  assert.match(html, /\.showcase \.card-visual \.visulabel\{\s*position:static;/);
  assert.match(html, /\.showcase \.card-visual \.source\{\s*display:block;/);
});

test('Menu cabe também nas telas de 320px', () => {
  assert.match(html, /@media\s*\(max-width:360px\)/);
  assert.match(html, /\.sidebar \.nav button\{padding-left:3px;padding-right:3px\}/);
});
