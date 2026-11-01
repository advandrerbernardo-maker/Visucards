const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('index.html','utf8');
const design=fs.readFileSync('card-design.js','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const lock=fs.readFileSync('DESIGN_LOCK.md','utf8');

function signature(value){
  let hash=0x811c9dc5;
  for(let i=0;i<value.length;i++){
    hash=Math.imul(hash^value.charCodeAt(i),0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

test('Design oficial 0.5: CSS premium não deve mudar sem autorização',()=>{
  const css=html.match(/<style id="premium-card-style">[\s\S]*?<\/style>/)?.[0];
  assert.ok(css,'CSS premium não encontrado');
  // Comparar com a versão aprovada. Atualizar esta assinatura só após aprovação visual.
  assert.equal(signature(css),'d2d9d5f7','O padrão editorial aprovado foi modificado');
});

test('Design oficial 0.5: estrutura dos cartões não pode ser simplificada',()=>{
  const markup=html.match(/    function cardMarkup\(c\)\{[\s\S]*?    function drawCards\(/)?.[0];
  assert.ok(markup,'Renderização editorial não encontrada');
  assert.equal(signature(markup),'0b001385','A estrutura visual do card foi alterada');
});

test('Mantém três acabamentos e componentes do modelo aprovado',()=>{
  for(const style of ['caderno','quadrinhos','minimalista']){
    assert.ok(html.includes('<option value="'+style+'">'),'Estilo ausente: '+style);
    if(style!=='caderno') assert.ok(html.includes('premium-card.layout-'+style),'Identidade visual ausente: '+style);
    else assert.ok(html.includes('.card-visual.premium-card{'),'Estilo base de caderno ausente');
  }
  for(const part of ['premium-head','premium-hero','premium-illustration','premium-lead','premium-steps','premium-anchor-area','premium-note','premium-foot']){
    assert.ok(html.includes(part),'Elemento visual obrigatório ausente: '+part);
  }
  assert.match(html,/<select id="visual-style"><option value="caderno">/);
  assert.match(html,/max-height:none!important/);
  assert.match(html,/height:auto/);
});

test('Mantém integração de dados, PNG e impressão com o mesmo estilo',()=>{
  assert.match(html,/window\.VisuCardDesign\.build\(c\)/);
  assert.match(html,/window\.VisuCardDesign\.build\(card\)/);
  assert.match(html,/getElementById\('premium-card-style'\)\.textContent/);
  assert.match(html,/async function exportPNG\(card\)/);
  assert.match(html,/function printCard\(c\)/);
  assert.match(workflow,/cp card-design\.js site\/card-design\.js/);
  assert.match(design,/function build\(card\)/);
  assert.match(lock,/design-locked-v0\.5/);
});
