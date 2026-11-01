const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('index.html','utf8');

test('Títulos e blocos de texto não têm corte visual no card',()=>{
  assert.match(html, /Correção tipográfica mobile/);
  assert.match(html, /\.showcase \.card-visual h3 \{[\s\S]*?overflow:visible;/);
  assert.match(html, /\.showcase \.card-visual \.bubble \{[\s\S]*?overflow:visible;/);
  assert.match(html, /\.showcase \.card-visual \{[\s\S]*?overflow:visible;/);
});

test('Editar card não corta caracteres silenciosamente',()=>{
  assert.doesNotMatch(html, /clean\(el\.value\)\.slice\(0,400\)/);
  assert.match(html, /const limits=\{title:240,text:5000,note:3000\}/);
  assert.match(html, /const tooLong=edited\.find/);
});

test('Exportação PNG preserva todas as linhas e adapta altura',()=>{
  assert.match(html, /function wrap\(ctx,str,maxWidth\)\{/);
  assert.doesNotMatch(html, /if\(lines\.length===maxLines-1\)break/);
  assert.match(html, /const canvasHeight=Math\.max\(1200/);
  assert.match(html, /sourceLines\.forEach/);
});

test('Impressão PDF não limita o card a uma altura fixa',()=>{
  assert.match(html, /\.card-visual\{width:190mm;min-height:253mm;height:auto;/);
  assert.match(html, /\.visulabel\{position:static;align-self:flex-end/);
});
