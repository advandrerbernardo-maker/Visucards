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
  const api={score,prioritize};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.VisuSelection=api;
})(typeof window!=="undefined"?window:globalThis);
