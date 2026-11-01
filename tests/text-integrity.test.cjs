const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');

test('Novo card editorial tem hierarquia legível e mantém textos completos',()=>{
  for(const selector of ['premium-title','premium-lead','premium-steps','premium-anchor-area','premium-note','premium-source','premium-card-style']){
    assert.ok(html.includes(selector),'Componente ausente: '+selector);
  }
  assert.match(html,/\.card-visual\.premium-card\{[\s\S]*?height:auto/);
  assert.match(html,/\.premium-head \.premium-title\{[\s\S]*?max-height:none/);
  assert.match(html,/overflow-wrap:break-word/);
  assert.match(html,/escapeHTML\(d\.lead\)/);
  assert.match(html,/escapeHTML\(part\.text\)/);
});

test('Editor preserva textos em vez de truncar silenciosamente',()=>{
  assert.doesNotMatch(html,/clean\(el\.value\)\.slice\(0,400\)/);
  assert.match(html,/const limits=\{title:240,text:5000,note:3000\}/);
  assert.match(html,/const tooLong=edited\.find/);
});

test('Exportação PNG usa modelo editorial e altura adaptável',()=>{
  assert.match(html,/async function exportPNG\(card\)/);
  assert.match(html,/window\.VisuCardDesign\.build\(card\)/);
  assert.match(html,/const canvasHeight=Math\.max\(1200/);
  assert.match(html,/const leadLines=split\(d\.lead/);
  assert.match(html,/steps=d\.sections\.map/);
  assert.match(html,/sourceLines=split\('FONTE: '\+d\.source/);
  assert.doesNotMatch(html,/if\(lines\.length===maxLines-1\)break/);
});

test('Impressão PDF mantém o layout e não limita o card a uma página',()=>{
  assert.match(html,/getElementById\('premium-card-style'\)\.textContent/);
  assert.match(html,/\.card-visual\.premium-card\{break-inside:auto!important/);
  assert.match(html,/@page\{size:A4 portrait;margin:12mm\}/);
});
