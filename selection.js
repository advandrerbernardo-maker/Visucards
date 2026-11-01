/* Triagem didática local. Não representa incidência estatística em concursos. */
(function(root){
  "use strict";
  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  function score(text){
    const s=normalize(text);
    if(!s.trim())return -100;
    let value=Math.min(s.length,550)/140;
    if(/\bart(?:igo)?\.?\s*\d+[º°]?\b/.test(s))value+=6;
    if(/\b(exceto|salvo|vedad[oa]|ressalvad[oa]|nao se aplica|somente se)\b/.test(s))value+=6;
    if(/\b(prazo|dias|meses|anos|prescricao|decadencia)\b/.test(s))value+=4;
    if(/\b(compete|competencia|requisitos?|hipoteses?|devera|obrigatorio|proibido)\b/.test(s))value+=4;
    if(/\b(consiste|define.se|considera.se|significa|caracteriza.se)\b/.test(s))value+=3;
    if(/\b(sumario|bibliografia|referencias bibliograficas|indice remissivo)\b/.test(s))value-=12;
    if(s.length<100)value-=4;
    return value;
  }
  function prioritize(chunks){
    return (Array.isArray(chunks)?chunks:[])
      .map((chunk,index)=>({...chunk,qualityScore:score(chunk.text),originalIndex:index}))
      .sort((a,b)=>b.qualityScore-a.qualityScore || a.originalIndex-b.originalIndex);
  }
  // Cada clique usa até dois novos trechos; após percorrer o PDF, volta ao início
  // para permitir testar estilos sem impor uma cota mensal.
  function nextBatch(chunks,cursor=0,batchSize=2){
    const pool=Array.isArray(chunks)?chunks:[];
    if(!pool.length)return {selected:[],nextCursor:0,recycled:false};
    const start=Number.isSafeInteger(cursor)&&cursor>=0?cursor:0;
    const size=Math.min(pool.length,Math.max(1,Math.min(2,Number.isInteger(batchSize)?batchSize:2)));
    const selected=Array.from({length:size},(_,i)=>pool[(start+i)%pool.length]);
    return {selected,nextCursor:start+size,recycled:start+size>pool.length || start>=pool.length};
  }
  const api={score,prioritize,nextBatch};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.VisuSelection=api;
})(typeof window!=="undefined"?window:globalThis);
