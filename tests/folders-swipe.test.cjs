const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const F=require('../folders.js');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');

const a='pabc',b='pdef';
test('Pastas padrão e normalização preservam cards anteriores',()=>{
  assert.deepEqual(F.normalizeFolders(undefined),[{id:'geral',name:'Meus cards'}]);
  const list=F.normalizeFolders([{id:'geral',name:'Substituir'}, {id:a,name:'Direito Penal'},{id:b,name:'direito penal'},{id:'x<script>',name:'Insegura'}]);
  assert.equal(list.length,2);
  assert.equal(F.folderForCard({title:'antigo'},list),'geral');
  assert.equal(F.folderForCard({folderId:'não-existe'},list),'geral');
});
test('Criar e renomear pastas permite nome escolhido sem duplicar nomes',()=>{
  const start=F.normalizeFolders([]);
  const folders=F.create(start,'  Direito Constitucional  ',a);
  assert.equal(folders[1].name,'Direito Constitucional');
  assert.equal(start.length,1,'Operação não deve alterar pastas originais');
  assert.throws(()=>F.create(folders,'DIREITO CONSTITUCIONAL',b),/Já existe/);
  assert.throws(()=>F.create(folders,'  ',b),/nome/);
  assert.throws(()=>F.create(folders,'Outra','geral'),/inválido/);
  const renamed=F.rename(folders,a,'Processo Civil');
  assert.equal(renamed[1].name,'Processo Civil');
  assert.equal(folders[1].name,'Direito Constitucional');
  assert.throws(()=>F.rename(folders,'geral','Novo'),/não pode/);
  assert.throws(()=>F.rename(folders,'inexistente','Novo'),/não encontrada/);
});
test('Mover cards e excluir pasta preserva dados do card',()=>{
  const folders=F.create(F.normalizeFolders([]),'Direito Penal',a);
  const cards=[{id:'c1',title:'Artigo',text:'Conteúdo',folderId:a},{id:'c2',title:'Prazo',folderId:'geral'}];
  const moved=F.moveCard(cards,'c2',a,folders);
  assert.equal(moved.filter(c=>c.folderId===a).length,2);
  assert.equal(cards[1].folderId,'geral');
  assert.throws(()=>F.moveCard(cards,'c3',a,folders),/não encontrado/);
  const removed=F.remove(folders,moved,a);
  assert.equal(removed.folders.length,1);
  assert.equal(removed.cards[0].title,'Artigo');
  assert.equal(removed.cards[0].text,'Conteúdo');
  assert.ok(removed.cards.every(c=>c.folderId==='geral'));
  assert.throws(()=>F.remove(folders,moved,'geral'),/não pode/);
});
test('Nome sugerido pelo PDF pode ser personalizado e não colide',()=>{
  const folders=F.create(F.normalizeFolders([]),'Direito Civil',a);
  assert.equal(F.suggestedName('Direito Civil.pdf',folders),'Direito Civil (2)');
  assert.equal(F.suggestedName('Constitucional.pdf',folders),'Constitucional');
  assert.ok(F.cleanName('  Direito \n Penal\t').length>0);
  assert.equal(F.cleanName('    '),'');
});
test('Interface contém biblioteca de pastas, mover card e gestos de leitura',()=>{
  for(const id of ['folder-name-input','create-folder','folder-grid','target-folder','swipe-reader',
    'swipe-stage','swipe-card','swipe-prev','swipe-next','swipe-close','swipe-counter','read-folder',
    'folder-back','rename-folder','delete-folder','read-all']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/window\.VisuFolders\.normalizeFolders\(stored\.folders\)/);
  assert.match(html,/folderId:state\.documentFolders\[state\.parsed\.hash\]/);
  assert.match(html,/folders:state\.folders,cards:state\.cards/);
  assert.match(html,/F\.moveCard\(state\.cards,select\.dataset\.libmove,select\.value,state\.folders\)/);
  assert.match(html,/F\.cardsIn\(state\.cards,state\.folders,openFolderId\)/);
  assert.match(html,/const dx=event\.clientX-start\.x,dy=event\.clientY-start\.y/);
  assert.match(html,/Math\.abs\(dx\)>=65&&Math\.abs\(dx\)>Math\.abs\(dy\)\*1\.5/);
  assert.match(html,/navigateReader\(dx<0\?1:-1\)/);
  assert.match(html,/event\.key==='ArrowRight'/);
  assert.match(html,/event\.key==='Escape'/);
  assert.match(html,/document\.body\.classList\.add\('swipe-open'\)/);
  assert.match(html,/touch-action:pan-y/);
  assert.match(workflow,/cp folders\.js site\/folders\.js/);
});
test('Estilo visual dos cards continua protegido e o backup inclui as pastas',()=>{
  assert.match(html,/id="premium-card-style"/);
  assert.match(html,/function cardMarkup\(c\)/);
  assert.match(html,/cardMarkup\(card\)/);
  assert.match(html,/folderMap\[c\.folderId\]\|\|F\.DEFAULT_ID/);
  assert.match(html,/window\.VisuAI\.register\(\[card\]\)/);
  assert.match(html,/VISUCARDS · VERSÃO 1\.2 DE TESTE/);
  assert.match(fs.readFileSync('DESIGN_LOCK.md','utf8'),/design-locked-v0\.5/);
});
test('Scripts inline continuam sintaticamente válidos',()=>{
  const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for(const part of scripts)assert.doesNotThrow(()=>new vm.Script(part[1]));
});

test('Pasta automática por PDF e escolha manual persistem no navegador',()=>{
  assert.match(html,/folderPreference:stored\.folderPreference==='manual'\?'manual':'auto'/);
  assert.match(html,/value="__auto__"/);
  assert.match(html,/state\.folderPreference==='auto'/);
  assert.match(html,/state\.folderPreference='manual'/);
  assert.match(html,/state\.documentFolders=\{\.\.\.state\.documentFolders,\[hash\]:state\.selectedFolderId\}/);
  assert.match(html,/F\.suggestedName\(file\.name,state\.folders\)/);
  assert.match(html,/state\.documentFolders\[state\.parsed\.hash\]\|\|state\.selectedFolderId/);
  assert.match(html,/folderPreference:state\.folderPreference/);
});

test('Backups incluem nomes das pastas e restauram sem perder cards antigos',()=>{
  assert.match(html,/folders:state\.folders,cards:state\.cards,reviews:state\.reviews/);
  assert.match(html,/F\.normalizeFolders\(data\.folders\)/);
  assert.match(html,/state\.folders=mergedFolders/);
  assert.match(html,/if\(!persist\(\)\)\{state\.cards=previous;state\.folders=previousFolders/);
  assert.match(html,/folderId:folderMap\[c\.folderId\]\|\|F\.DEFAULT_ID/);
  assert.match(html,/documentHash:typeof c\.documentHash/);
});

test('Leitura rápida mantém o card completo e acessibilidade no celular',()=>{
  assert.match(html,/role="dialog" aria-modal="true"/);
  assert.match(html,/aria-label="Deslize para a esquerda/);
  assert.match(html,/swipeStage\.addEventListener\('pointerdown'/);
  assert.match(html,/swipeStage\.addEventListener\('pointerup'/);
  assert.match(html,/swipeStage\.addEventListener\('pointercancel'/);
  assert.match(html,/if\(index<0\|\|index>=swipe\.cards\.length\)return/);
  assert.match(html,/document\.body\.classList\.remove\('swipe-open'\)/);
  assert.match(html,/if\(swipe\.returnFocus\?\.isConnected\)swipe\.returnFocus\.focus\(\)/);
});
