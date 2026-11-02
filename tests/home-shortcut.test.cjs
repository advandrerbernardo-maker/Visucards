const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');

test('Tela inicial oferece ícone Meus Cards com acesso em um toque',()=>{
  const initial=html.indexOf('<section id="tab-criar"');
  const shortcut=html.indexOf('id="home-my-cards"');
  const upload=html.indexOf('id="dropzone"');
  assert.ok(initial>=0&&shortcut>initial&&shortcut<upload,'Atalho deve estar na parte superior da tela inicial, antes do PDF');
  assert.match(html,/<button type="button" id="home-my-cards" class="home-card-shortcut"/);
  assert.match(html,/home-card-shortcut-icon" aria-hidden="true">📚/);
  assert.match(html,/<strong>Meus Cards<\/strong>/);
  assert.match(html,/id="home-card-count"/);
});
test('O atalho abre diretamente o leitor com cards salvos, sem passar pela biblioteca',()=>{
  assert.match(html,/\$\('#home-my-cards'\)\.onclick=\(\)=>\{/);
  assert.match(html,/if\(!state\.cards\.length\)\{/);
  assert.match(html,/openReader\(state\.cards\.slice\(\)\.reverse\(\),null,'Meus Cards'\)/);
  assert.match(html,/Você ainda não tem cards salvos/);
  assert.match(html,/\$\('#home-card-count'\)\.textContent=state\.cards\.length\+' '\+\(state\.cards\.length===1\?'card':'cards'\)/);
  assert.match(html,/id="home-shortcut-message" class="hint hidden" role="status" aria-live="polite"/);
});
test('Atalho respeita mobile, leitores de tela e design fixado dos cards',()=>{
  assert.match(html,/\.home-card-shortcut\{width:100%;display:flex/);
  assert.match(html,/\.home-card-shortcut-copy\{flex:1 1 auto;min-width:0/);
  assert.match(html,/@media\(max-width:680px\)\{\.home-card-shortcut/);
  assert.match(html,/@media\(max-width:360px\)\{\.home-card-shortcut/);
  assert.match(html,/id="home-my-cards"[^>]*aria-label="Meus Cards:/);
  assert.match(html,/data-tab="ranking"[^>]*><span>🏆<\/span> Ranking<\/button>/);
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for(const script of scripts)assert.doesNotThrow(()=>new vm.Script(script[1]));
  assert.match(fs.readFileSync('DESIGN_LOCK.md','utf8'),/design-locked-v0\.5/);
});
