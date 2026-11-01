/* Triagem didática local. Não representa incidência estatística em concursos.
 * VISUCARDS 0.7: diversidade e controle de repetição sem mudar o layout 0.5.
 */
(function(root){
  "use strict";
  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const canonical=value=>normalize(value).replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim();

  function score(text){
    const s=normalize(text);
    if(!s.trim())return -100;
    let value=Math.min(s.length,550)/140;
    if(/(?:^|\s)art(?:igo)?\.?\s*\d+[º°]?(?=\s|[.,;:]|$)|§\s*\d+[º°]?/.test(s))value+=6;
    if(/\b(exceto|salvo|vedad[oa]|ressalvad[oa]|nao se aplica|somente se)\b/.test(s))value+=6;
    if(/\b(prazo|dias|meses|anos|prescricao|decadencia)\b/.test(s))value+=4;
    if(/\b(compete|competencia|requisitos?|hipoteses?|devera|obrigatorio|proibido)\b/.test(s))value+=4;
    if(/\b(consiste|define.se|considera.se|significa|caracteriza.se)\b/.test(s))value+=3;
    if(/\b(sumario|bibliografia|referencias bibliograficas|indice remissivo|direitos reservados|clique aqui|www\.)\b/.test(s))value-=12;
    if(s.length<100)value-=4;
    return value;
  }
  function prioritize(chunks){
    return (Array.isArray(chunks)?chunks:[])
      .map((chunk,index)=>({...chunk,qualityScore:score(chunk.text),originalIndex:index}))
      .sort((a,b)=>b.qualityScore-a.qualityScore || a.originalIndex-b.originalIndex);
  }
  function signal(text){
    const s=normalize(text);
    if(/\b(exceto|salvo|ressalvad[oa]|excecao)\b/.test(s))return "excecao";
    if(/\b(prazo|dias|meses|anos|prescricao|decadencia)\b/.test(s))return "prazo";
    if(/\b(vedad[oa]|proibid[oa])\b/.test(s))return "vedacao";
    if(/\b(requisitos?|hipoteses?|condicoes)\b/.test(s))return "requisito";
    if(/\b(compete|competencia)\b/.test(s))return "competencia";
    if(/(?:^|\s)art(?:igo)?\.?\s*\d+/.test(s))return "artigo";
    return "conceito";
  }
  function studyPrompt(text){
    const prompts={
      excecao:'Pergunta de revisão: qual é a exceção descrita no trecho e quando se aplica?',
      prazo:'Pergunta de revisão: qual é o prazo informado e para qual situação?',
      vedacao:'Pergunta de revisão: o que o trecho proíbe e em quais condições?',
      requisito:'Pergunta de revisão: quais requisitos são exigidos no texto?',
      competencia:'Pergunta de revisão: a quem é atribuída a competência mencionada?',
      artigo:'Pergunta de revisão: o que estabelece o artigo citado?',
      conceito:'Pergunta de revisão: qual é a ideia central do trecho?'
    };
    return prompts[signal(text)];
  }
  function articleRef(text){
    const found=normalize(text).match(/\bart(?:igo)?\.?\s*(\d+[a-z]?)\b/);
    return found?found[1]:"";
  }
  function negations(text){
    const s=normalize(text);
    return ["nao","exceto","salvo","vedado","vedada","proibido","proibida"].filter(x=>new RegExp("\\b"+x+"\\b").test(s)).join("|");
  }
  function shingles(value){
    const words=canonical(value).split(" ").filter(Boolean), out=new Set();
    for(let i=0;i+3<words.length;i++)out.add(words.slice(i,i+4).join(" "));
    return out;
  }
  // Deduplicação conservadora: jamais ignora diferenças de artigo ou negação.
  function nearDuplicate(a,b){
    const first=canonical(a),second=canonical(b);
    if(!first||!second)return false;
    if(first===second)return true;
    const artA=articleRef(a),artB=articleRef(b);
    if(artA&&artB&&artA!==artB)return false;
    if(negations(a)!==negations(b))return false;
    const ratio=Math.min(first.length,second.length)/Math.max(first.length,second.length);
    if(ratio<.88||Math.min(first.length,second.length)<100)return false;
    if(first.includes(second)||second.includes(first))return ratio>=.96;
    const firstSet=shingles(a),secondSet=shingles(b);
    if(!firstSet.size||!secondSet.size)return false;
    let common=0;
    for(const word of firstSet)if(secondSet.has(word))common++;
    const similarity=common/(firstSet.size+secondSet.size-common);
    return similarity>=.93;
  }
  function buildQueue(chunks){
    const available=prioritize(chunks).filter(c=>typeof c.text==="string"&&c.text.trim());
    const unique=[];
    for(const item of available){
      if(!unique.some(previous=>nearDuplicate(previous.text,item.text)))unique.push(item);
    }
    const result=[];
    while(unique.length){
      let bestIndex=0,bestValue=-Infinity;
      for(let i=0;i<unique.length;i++){
        const item=unique[i],recent=result.slice(-2);
        let value=item.qualityScore;
        if(recent.some(previous=>previous.page===item.page))value-=6;
        if(recent.some(previous=>signal(previous.text)===signal(item.text)))value-=2.5;
        // Pequeno desempate por ordem de relevância original.
        if(value>bestValue){bestValue=value;bestIndex=i;}
      }
      result.push(unique.splice(bestIndex,1)[0]);
    }
    return result.map(({text,page})=>({text,page}));
  }
  // Não repete um trecho enquanto houver material ainda não gerado.
  // Ao chegar ao fim, o próprio usuário decide se deseja recomeçar.
  function nextBatch(chunks,cursor=0,batchSize=2){
    const pool=Array.isArray(chunks)?chunks:[];
    const start=Math.min(Number.isSafeInteger(cursor)&&cursor>=0?cursor:0,pool.length);
    const size=Math.max(1,Math.min(2,Number.isInteger(batchSize)?batchSize:2));
    const selected=pool.slice(start,start+size);
    const nextCursor=start+selected.length;
    return {selected,nextCursor,recycled:false,exhausted:nextCursor>=pool.length,remaining:pool.length-nextCursor,total:pool.length};
  }
  const api={score,prioritize,signal,studyPrompt,canonical,nearDuplicate,buildQueue,nextBatch};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.VisuSelection=api;
})(typeof window!=="undefined"?window:globalThis);
