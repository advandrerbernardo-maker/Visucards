/* VISUCARDS 0.6 | Extração didática local de PDFs.
 * Não interpreta normas, não usa IA e não presume incidência em concursos.
 * Preserva página de origem; os fragmentos são integrais dentro de cada bloco.
 */
(function(root){
  'use strict';
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const fold=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const MAX_CHARS=650;
  const PAGE_LIMIT=10;
  const MAX_CHUNKS=50;
  const LEGAL_CUE=/\b(art(?:igo)?\.?\s*\d+|§\s*\d+|prazo|exceto|salvo|ressalvad[oa]|vedad[oa]|proibid[oa]|compet[eê]ncia|requisitos?)\b/i;

  // PDF.js oferece hasEOL e posição vertical; preservar a separação textual
  // reduz frases coladas entre tópicos de diferentes linhas.
  function pageText(items){
    if(!Array.isArray(items))return '';
    const lines=[];
    let line='',lastY=null;
    function flush(){if(clean(line))lines.push(clean(line));line=''}
    for(const item of items){
      if(!item || typeof item!=='object')continue;
      const str=String(item.str??'');
      const nextY=Array.isArray(item.transform)&&Number.isFinite(item.transform[5])?item.transform[5]:null;
      const height=Number.isFinite(item.height)?Math.abs(item.height):10;
      if(line && nextY!==null && lastY!==null && Math.abs(nextY-lastY)>Math.max(3,height*.48))flush();
      if(str){
        if(line && !/\s$/.test(line) && !/^\s/.test(str))line+=' ';
        line+=str;
      }
      if(item.hasEOL)flush();
      if(nextY!==null)lastY=nextY;
    }
    flush();
    return lines.join('\n');
  }

  // Apenas cabeçalhos/rodapés iguais, repetidos nos extremos de páginas,
  // são ignorados. Nunca excluir dispositivos legais nem parágrafos.
  function withoutRepeatedMargins(pages){
    const lists=pages.map(p=>String(p??'').split(/\r?\n/).map(clean).filter(Boolean));
    if(lists.length<2)return lists;
    const seen=new Map();
    for(const lines of lists){
      const positions=[...lines.slice(0,2),...lines.slice(-2)];
      const candidates=new Set(positions.map(fold).filter(x=>x.length>=6&&x.length<=100));
      for(const key of candidates)seen.set(key,(seen.get(key)||0)+1);
    }
    return lists.map(lines=>lines.filter((line,i)=>{
      const boundary=i<2||i>=lines.length-2;
      const norm=fold(line);
      return !(boundary && (seen.get(norm)||0)>=2 && !LEGAL_CUE.test(line) && norm.length<=100);
    }));
  }

  function isHeader(line){
    const s=clean(line);
    if(s.length<7||s.length>100 || LEGAL_CUE.test(s))return false;
    const letters=(s.match(/[A-Za-zÀ-ÿ]/g)||[]).length;
    const capitals=(s.match(/[A-ZÀ-Ý]/g)||[]).length;
    return letters>=7 && capitals/letters>=.72 && !/[.!?;]$/.test(s);
  }
  function beginsProvision(line){
    return /^(?:art(?:igo)?\.?\s*\d+[º°]?|§\s*\d+[º°]?|parágrafo único\b|capítulo\s+[IVXLCDM]+\b|seção\s+[IVXLCDM]+\b)/i.test(clean(line));
  }

  function cutLong(text){
    let rest=clean(text), out=[];
    while(rest.length>MAX_CHARS){
      let cut=-1;
      const min=Math.floor(MAX_CHARS*.62);
      for(const char of ['; ','. ',': ', ', ']){
        const at=rest.lastIndexOf(char,MAX_CHARS);
        if(at>=min && at+char.length<=MAX_CHARS){cut=at+char.length;break}
      }
      if(cut<min){
        const space=rest.lastIndexOf(' ',MAX_CHARS);
        cut=space>0?space+1:MAX_CHARS;
      }
      const head=rest.slice(0,cut).trim();
      if(head)out.push(head);
      rest=rest.slice(cut).trim();
    }
    if(rest)out.push(rest);
    return out;
  }

  function segments(lines){
    const paragraphs=[];
    let current='';
    function flush(){if(current){paragraphs.push(current);current=''}}
    for(const line of lines){
      const s=clean(line);
      if(!s)continue;
      if(current && (beginsProvision(s) || isHeader(s) || (/[.!?;]$/.test(current) && /^[A-ZÀ-Ý]/.test(s))))flush();
      current+=(current?' ':'')+s;
      // Um novo artigo ou cabeçalho tem prioridade sobre comprimento.
      // Parágrafos longos só são quebrados em fronteiras de frase ou palavra.
      if(current.length>1150)flush();
    }
    flush();
    const chunks=[];
    for(const paragraph of paragraphs){
      const sentences=paragraph.split(/(?<=[!?;.] )(?=[A-ZÀ-Ý])/u);
      // O regex acima mantém o espaço da separação; também aceitamos
      // um único parágrafo quando o PDF não preserva pontuação.
      let running='';
      function output(){if(!running)return;chunks.push(...cutLong(running));running=''}
      for(let sentence of sentences){
        sentence=clean(sentence);
        if(!sentence)continue;
        if(running && running.length+sentence.length+1>MAX_CHARS)output();
        if(sentence.length>MAX_CHARS){output();chunks.push(...cutLong(sentence))}
        else running+=(running?' ':'')+sentence;
      }
      output();
    }
    // Une pequenos fragmentos adjacentes sem misturar páginas.
    const merged=[];
    for(const piece of chunks){
      if(piece.length<85 && merged.length && merged[merged.length-1].length+piece.length+1<=MAX_CHARS)
        merged[merged.length-1]+=' '+piece;
      else merged.push(piece);
    }
    return merged.filter(x=>x.length<=MAX_CHARS && (x.length>=70 || (x.length>=35 && (beginsProvision(x) || LEGAL_CUE.test(x)))));
  }

  function fingerprint(text){return fold(text).replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' ').trim()}
  function isDuplicate(text,chosen){
    const key=fingerprint(text);
    return chosen.some(existing=>{
      const prev=fingerprint(existing.text);
      if(key===prev)return true;
      const ratio=Math.min(key.length,prev.length)/Math.max(key.length,prev.length);
      return ratio>.9 && key.length>140 && key.slice(0,150)===prev.slice(0,150);
    });
  }

  function extract(pages,prioritize){
    if(!Array.isArray(pages))return {chunks:[],diagnostics:{pages:0,candidates:0,duplicates:0,selected:0}};
    const processed=withoutRepeatedMargins(pages);
    let candidates=0,duplicates=0;
    const result=[];
    processed.forEach((lines,index)=>{
      const candidatesOnPage=segments(lines).map(text=>({text,page:index+1}));
      candidates+=candidatesOnPage.length;
      const sorted=typeof prioritize==='function'?prioritize(candidatesOnPage):candidatesOnPage;
      let accepted=0;
      for(const entry of sorted){
        if(accepted>=PAGE_LIMIT)break;
        if(isDuplicate(entry.text,result)){duplicates++;continue}
        result.push({text:entry.text,page:entry.page});
        accepted++;
      }
    });
    const ranked=typeof prioritize==='function'?prioritize(result):result;
    return {
      chunks:ranked.slice(0,MAX_CHUNKS).map(({text,page})=>({text,page})),
      diagnostics:{pages:pages.length,candidates,duplicates,selected:Math.min(ranked.length,MAX_CHUNKS)}
    };
  }

  // Resumo gerado apenas por recorte literal do próprio texto.
  function headline(text){
    const s=clean(text);
    if(!s)return 'REVISÃO DO PDF';
    const article=s.match(/^(Art(?:igo)?\.?\s*\d+[º°]?(?:\s*,\s*[IVXLCDM]+)?)[.\s:-]*(.*)/i);
    let result;
    if(article){
      const lead=article[2].split(/[.;!?]/)[0].trim();
      result=article[1].trim()+(lead?': '+lead:'');
    }else result=s.split(/[;!?]/)[0];
    result=result.split(/\s+/).slice(0,12).join(' ').replace(/[,:;.!?]+$/,'');
    return result||'REVISÃO DO PDF';
  }

  const api={pageText,withoutRepeatedMargins,segments,cutLong,extract,headline,fingerprint};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VisuPDFIntelligence=api;
})(typeof window!=='undefined'?window:globalThis);
