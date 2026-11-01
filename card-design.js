/* VISUCARDS: organizador visual fiel ao texto extraído, sem IA e sem inferir normas. */
(function(root){
  'use strict';
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  function classify(text){
    const s=clean(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(/\b(exceto|salvo|ressalvad[oa]|exceca?o|nao se aplica)\b/.test(s))return {id:'exception',label:'EXCEÇÃO',symbol:'!'};
    if(/\b(prazo|\d+\s*(dias?|meses?|anos?|horas?))\b/.test(s))return {id:'time',label:'PRAZO',symbol:'⌛'};
    if(/\b(vedad[oa]|proibid[oa]|impedid[oa])\b/.test(s))return {id:'prohibition',label:'VEDAÇÃO',symbol:'×'};
    if(/\b(requisitos?|condicoes|hipoteses|pressupostos)\b/.test(s))return {id:'requirements',label:'REQUISITOS',symbol:'✓'};
    if(/\b(compete|competencia|devera|obrigatori[oa]|somente)\b/.test(s))return {id:'rule',label:'REGRA',symbol:'§'};
    if(/\b(art(?:igo)?\.?\s*\d+)\b/.test(s))return {id:'law',label:'NORMA',symbol:'§'};
    return {id:'concept',label:'CONCEITO',symbol:'✦'};
  }
  function splitText(value){
    const text=clean(value);
    if(!text)return [];
    // Segmentação somente tipográfica: não altera nem resume o conteúdo.
    const sentences=text.split(/(?<=[.!?;])\s+(?=[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9])/u);
    const pieces=[];
    for(const sentence of sentences){
      let rest=sentence;
      while(rest.length>255){
        let at=rest.lastIndexOf(' ',230);
        if(at<130)at=rest.indexOf(' ',230);
        if(at<0)break;
        pieces.push(rest.slice(0,at).trim());
        rest=rest.slice(at).trim();
      }
      if(rest)pieces.push(rest);
    }
    if(pieces.length<=4)return pieces;
    return [...pieces.slice(0,3),pieces.slice(3).join(' ')];
  }
  function anchors(value){
    const text=clean(value), found=[];
    const patterns=[
      /\bart(?:igo)?\.?\s*\d+[º°]?(?:\s*,\s*[IVXLCDM]+)?/gi,
      /\b\d+\s*(?:dias?|meses?|anos?|horas?)\b/gi,
      /§\s*\d+[º°]?/g,
      /\b(?:salvo|exceto|vedado|obrigatório|competência|requisitos?)\b/gi
    ];
    for(const p of patterns){
      for(const m of text.matchAll(p)){
        const hit=m[0].trim(),norm=hit.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
        if(!found.some(x=>x.norm===norm))found.push({norm,text:hit});
        if(found.length>=4)break;
      }
      if(found.length>=4)break;
    }
    return found.map(x=>x.text);
  }
  function build(card){
    const text=clean(card?.text);
    const parts=splitText(text);
    return {
      title:clean(card?.title)||'REVISÃO VISUAL',
      subject:classify(text),
      lead:parts[0]||'',
      sections:parts.slice(1).map((part,i)=>({
        label:classify(part).id==='concept'?'COMPLEMENTO '+(i+1):classify(part).label,
        text:part
      })),
      anchors:anchors(text),
      source:clean(card?.source)||'Fonte não informada',
      note:clean(card?.note),
      fullText:text
    };
  }
  const api={clean,classify,splitText,anchors,build};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VisuCardDesign=api;
})(typeof window!=='undefined'?window:globalThis);
