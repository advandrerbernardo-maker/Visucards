/* VISUCARDS | Pastas locais da biblioteca (v1.2).
 * Dados existentes permanecem na pasta geral. Operações são puras e testáveis.
 */
(function(root){
  'use strict';
  const DEFAULT_ID='geral';
  const DEFAULT_NAME='Meus cards';
  const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(id);
  const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function cleanName(value){
    return String(value??'').replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').trim().slice(0,65).trim();
  }
  function basic(){return {id:DEFAULT_ID,name:DEFAULT_NAME}}
  function normalizeFolders(raw){
    const result=[basic()],ids=new Set([DEFAULT_ID]),names=new Set([fold(DEFAULT_NAME)]);
    if(!Array.isArray(raw))return result;
    for(const value of raw.slice(0,1000)){
      if(!value||typeof value!=='object'||!validId(value.id)||ids.has(value.id))continue;
      const name=cleanName(value.name);
      if(!name||names.has(fold(name)))continue;
      result.push({id:value.id,name});
      ids.add(value.id);names.add(fold(name));
    }
    return result;
  }
  function folderName(folders,id){
    return folders.find(f=>f.id===id)?.name||DEFAULT_NAME;
  }
  function create(folders,name,id){
    const clean=cleanName(name);
    if(!clean)throw Error('Digite um nome para a pasta.');
    if(!validId(id)||id===DEFAULT_ID||folders.some(f=>f.id===id))throw Error('Identificador de pasta inválido.');
    if(folders.some(f=>fold(f.name)===fold(clean)))throw Error('Já existe uma pasta com esse nome.');
    return [...folders,{id,name:clean}];
  }
  function rename(folders,id,name){
    if(id===DEFAULT_ID)throw Error('A pasta Meus cards não pode ser renomeada.');
    if(!folders.some(f=>f.id===id))throw Error('Pasta não encontrada.');
    const clean=cleanName(name);
    if(!clean)throw Error('Digite um nome para a pasta.');
    if(folders.some(f=>f.id!==id&&fold(f.name)===fold(clean)))throw Error('Já existe uma pasta com esse nome.');
    return folders.map(f=>f.id===id?{...f,name:clean}:f);
  }
  function remove(folders,cards,id){
    if(id===DEFAULT_ID)throw Error('A pasta Meus cards não pode ser excluída.');
    if(!folders.some(f=>f.id===id))throw Error('Pasta não encontrada.');
    return {
      folders:folders.filter(f=>f.id!==id),
      cards:cards.map(c=>c.folderId===id?{...c,folderId:DEFAULT_ID}:c)
    };
  }
  function folderForCard(card,folders){
    return folders.some(f=>f.id===card?.folderId)?card.folderId:DEFAULT_ID;
  }
  function moveCard(cards,cardId,folderId,folders){
    if(!folders.some(f=>f.id===folderId))throw Error('Pasta de destino não encontrada.');
    if(!cards.some(c=>c.id===cardId))throw Error('Card não encontrado.');
    return cards.map(c=>c.id===cardId?{...c,folderId}:c);
  }
  function cardsIn(cards,folders,id){
    return cards.filter(c=>folderForCard(c,folders)===id);
  }
  function suggestedName(file,folders){
    const initial=cleanName(String(file??'').replace(/\.pdf$/i,'')||'Material de estudo')||'Material de estudo';
    if(!folders.some(f=>fold(f.name)===fold(initial)))return initial;
    for(let suffix=2;suffix<10000;suffix++){
      const ext=' ('+suffix+')';
      const candidate=initial.slice(0,65-ext.length).trim()+ext;
      if(!folders.some(f=>fold(f.name)===fold(candidate)))return candidate;
    }
    throw Error('Quantidade de pastas excedida.');
  }
  const api={DEFAULT_ID,DEFAULT_NAME,validId,cleanName,normalizeFolders,folderName,create,rename,remove,folderForCard,moveCard,cardsIn,suggestedName};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VisuFolders=api;
})(typeof window!=='undefined'?window:globalThis);
