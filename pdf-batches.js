/* VISUCARDS 1.0 | Progresso de PDFs em blocos consecutivos de 15 páginas.
 * Sem limite de páginas por documento: cada página é visitada uma única vez.
 * O histórico fica no navegador; PDF binário usa IndexedDB opcionalmente.
 */
(function(root){
  'use strict';
  const PAGE_BATCH=15;
  const isPage=n=>Number.isSafeInteger(n)&&n>=1;
  function range(totalPages,nextPage=1){
    if(!isPage(totalPages)||!isPage(nextPage)||nextPage>totalPages)return null;
    return {start:nextPage,end:Math.min(totalPages,nextPage+PAGE_BATCH-1),total:totalPages};
  }
  function create(hash,file,totalPages,size){
    if(!/^[a-f0-9]{64}$/.test(String(hash))||!isPage(totalPages))throw Error('Documento inválido');
    return {
      hash,file:String(file).slice(0,180),totalPages,size,
      nextPage:1,pending:null,completed:false
    };
  }
  function batch(doc,selected){
    const expected=range(doc.totalPages,doc.nextPage);
    if(!expected||!selected||selected.pageStart!==expected.start||
       selected.pageEnd!==expected.end||!Array.isArray(selected.chunks))
      throw Error('Intervalo repetido ou fora da sequência');
    return {...doc,nextPage:expected.end+1,pending:{parsed:selected,cursor:0},completed:false};
  }
  function moveCursor(doc,cursor,totalCards){
    if(!doc.pending||!Number.isSafeInteger(cursor)||cursor<0||
       !Number.isSafeInteger(totalCards)||totalCards<0||cursor>totalCards)
      throw Error('Progresso inválido');
    const pending={...doc.pending,cursor};
    return {...doc,pending,completed:doc.nextPage>doc.totalPages&&cursor>=totalCards};
  }
  function withoutContent(doc,rangeDone){
    const expected=range(doc.totalPages,doc.nextPage);
    if(!expected||expected.start!==rangeDone.start||expected.end!==rangeDone.end)
      throw Error('Intervalo fora de ordem');
    const nextPage=expected.end+1;
    return {...doc,nextPage,pending:null,completed:nextPage>doc.totalPages};
  }
  function normalizeDoc(raw){
    if(!raw||typeof raw!=='object'||!/^[a-f0-9]{64}$/.test(raw.hash)||
       !isPage(raw.totalPages)||!isPage(raw.nextPage)||raw.nextPage>raw.totalPages+1)
      return null;
    const pending=raw.pending;
    const safePending=pending&&typeof pending==='object'&&
      Number.isSafeInteger(pending.cursor)&&pending.cursor>=0&&
      pending.parsed&&pending.parsed.hash===raw.hash&&
      pending.parsed.pageStart>=1&&pending.parsed.pageEnd<=raw.totalPages&&
      pending.parsed.pageStart<=pending.parsed.pageEnd&&
      Array.isArray(pending.parsed.chunks)&&pending.parsed.chunks.length<=50&&
      pending.parsed.chunks.every(c=>typeof c.text==='string'&&c.text.length<=650&&
        isPage(c.page)&&c.page>=pending.parsed.pageStart&&c.page<=pending.parsed.pageEnd);
    return {
      hash:raw.hash,file:String(raw.file||'').slice(0,180),
      size:Number.isFinite(raw.size)?raw.size:0,
      totalPages:raw.totalPages,nextPage:raw.nextPage,
      pending:safePending?pending:null,
      completed:raw.completed===true&&raw.nextPage>raw.totalPages
    };
  }
  async function fingerprint(buffer){
    if(!root.crypto?.subtle)throw Error('Este navegador não permite identificar PDFs com segurança.');
    const digest=await root.crypto.subtle.digest('SHA-256',buffer);
    return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
  }
  const DB='visucards-pdf-cache-v1';
  function indexedDBAvailable(){return !!root.indexedDB}
  function openDB(){
    return new Promise((resolve,reject)=>{
      if(!indexedDBAvailable()){reject(Error('Armazenamento de arquivos indisponível'));return}
      const req=root.indexedDB.open(DB,1);
      req.onupgradeneeded=()=>req.result.createObjectStore('files',{keyPath:'slot'});
      req.onerror=()=>reject(req.error||Error('Não foi possível abrir armazenamento'));
      req.onsuccess=()=>resolve(req.result);
    });
  }
  async function cacheFile(hash,blob){
    const db=await openDB();
    try{
      await new Promise((resolve,reject)=>{
        const tx=db.transaction('files','readwrite');
        tx.objectStore('files').put({slot:'current',hash,blob});
        tx.oncomplete=()=>resolve();
        tx.onerror=()=>reject(tx.error||Error('Espaço insuficiente para guardar PDF'));
        tx.onabort=()=>reject(tx.error||Error('Arquivo não foi salvo'));
      });
      return true;
    }finally{db.close()}
  }
  async function cachedFile(hash){
    const db=await openDB();
    try{
      const entry=await new Promise((resolve,reject)=>{
        const tx=db.transaction('files','readonly'),req=tx.objectStore('files').get('current');
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error||Error('Falha ao recuperar PDF'));
      });
      return entry?.hash===hash?entry.blob:null;
    }finally{db.close()}
  }
  const api={PAGE_BATCH,range,create,batch,moveCursor,withoutContent,normalizeDoc,fingerprint,cacheFile,cachedFile};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VisuPDFBatches=api;
})(typeof window!=='undefined'?window:globalThis);
