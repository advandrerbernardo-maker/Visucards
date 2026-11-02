/* VISUCARDS AI v0.8: cliente seguro e infográficos SVG guiados por estrutura.
 * Nenhuma chave secreta ou PDF inteiro é transmitido pelo navegador.
 */
(function(root){
  'use strict';
  const kinds=new Set(['flow','steps','compare','timeline']);
  const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
  const folded=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const config=()=>root.VISUCARDS_AI_CONFIG||{};
  const configured=()=>{
    const c=config();
    return c.enabled===true && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(String(c.url||'')) &&
      /^(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]+)$/.test(String(c.publishableKey||''));
  };
  let clientPromise;
  async function client(){
    if(!configured())return null;
    if(!clientPromise)clientPromise=import('https://esm.sh/@supabase/supabase-js@2.95.0').then(({createClient})=>
      createClient(config().url,config().publishableKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      }));
    return clientPromise;
  }
  async function signedIn(){
    const supabase=await client();
    if(!supabase)return false;
    const {data,error}=await supabase.auth.getSession();
    return !error&&!!data?.session?.access_token;
  }
  async function emailLogin(email){
    const supabase=await client();
    if(!supabase)throw Error('IA não configurada.');
    const address=clean(email);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)||address.length>200)throw Error('Informe um e-mail válido.');
    const {error}=await supabase.auth.signInWithOtp({
      email:address,
      options:{emailRedirectTo:root.location?.origin+root.location?.pathname}
    });
    if(error)throw Error('Não foi possível enviar o acesso por e-mail.');
    return true;
  }
  async function logout(){
    const supabase=await client();
    if(supabase)await supabase.auth.signOut();
  }
  function localPlan(text){
    const source=clean(text),labels=[];
    const patterns=[
      /(?:^|\s)art(?:igo)?\.?\s*\d+[º°]?(?:\s*,\s*[IVXLCDM]+)?/gi,
      /§\s*\d+[º°]?/g,
      /\b\d+\s*(?:dias?|meses?|anos?|horas?)\b/gi,
      /\b(?:salvo|exceto|ressalvada|ressalvado|vedado|vedada|proibido|proibida|requisitos?|competência|prazo|somente)\b/gi
    ];
    for(const pattern of patterns){
      for(const match of source.matchAll(pattern)){
        const label=clean(match[0]);
        if(label.length>=3&&label.length<=42&&source.includes(label)&&!labels.includes(label))labels.push(label);
        if(labels.length>=3)break;
      }
      if(labels.length>=3)break;
    }
    if(labels.length<2)return null;
    const foldedText=folded(source);
    const kind=/\b(salvo|exceto|ressalvad)/.test(foldedText)?'compare'
      :/\b(prazo|dias|meses|anos|horas)\b/.test(foldedText)?'timeline'
      :/\b(requisitos|condicoes|hipoteses)\b/.test(foldedText)?'steps':'flow';
    return validatePlan({kind,labels},source);
  }
  function decorateLocal(cards){
    return (Array.isArray(cards)?cards:[]).map(card=>{
      if(card.visualPlan)return card;
      const visualPlan=localPlan(card.text);
      return visualPlan?{...card,visualPlan}:card;
    });
  }
  function validatePlan(visual,text){
    if(!visual||!kinds.has(visual.kind)||!Array.isArray(visual.labels))return null;
    const source=clean(text);
    const labels=[];
    for(const raw of visual.labels){
      const label=clean(raw);
      if(label.length<3||label.length>42||!source.includes(label)||labels.includes(label))continue;
      labels.push(label);
      if(labels.length===3)break;
    }
    return labels.length>=2?{kind:visual.kind,labels}:null;
  }
  function validateOutput(input,received){
    const outputs=Array.isArray(received?.cards)?received.cards:[];
    if(outputs.length!==input.length)throw Error('A resposta da IA veio incompleta.');
    const used=new Set();
    return input.map((source)=>{
      const entry=outputs.find(x=>x&&x.id===source.id&&!used.has(x.id));
      if(!entry)throw Error('Resposta da IA sem identificação confiável.');
      used.add(entry.id);
      const plan=validatePlan(entry.visual,source.text);
      if(!plan)throw Error('A IA não produziu uma ilustração verificável.');
      const proposedTitle=clean(entry.title);
      const title=proposedTitle.length>=6&&proposedTitle.length<=75&&source.text.includes(proposedTitle)
        ?proposedTitle:source.title;
      // Texto completo, fonte e número da página sempre vêm do PDF, nunca da IA.
      return {...source,title,visualPlan:plan,aiVerified:true};
    });
  }
  async function enhance(cards){
    if(!configured())return {cards,usedAI:false,reason:'not_configured'};
    const supabase=await client();
    const {data:{session},error}=await supabase.auth.getSession();
    if(error||!session?.access_token)return {cards,usedAI:false,reason:'login_required'};
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),18000);
    try{
      const response=await fetch(config().url+'/functions/v1/visucards-ai',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'apikey':config().publishableKey,
          'Authorization':'Bearer '+session.access_token
        },
        body:JSON.stringify({cards:cards.map(c=>({
          id:c.id,title:c.title,text:c.text,page:Number(String(c.source).match(/pág\.\s*(\d+)/)?.[1])||1
        }))}),
        signal:controller.signal
      });
      if(!response.ok)throw Error('O serviço de IA não conseguiu gerar os cards.');
      const result=await response.json();
      return {cards:validateOutput(cards,result),usedAI:true,reason:null};
    }catch(_err){
      return {cards,usedAI:false,reason:'service_error'};
    }finally{clearTimeout(timeout)}
  }
  function svgDiagram(plan){
    const safe=validatePlan(plan,plan?.labels?.join(' ')||'');
    if(!safe)return '';
    const {kind,labels}=safe;
    const base=(inner)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 184" role="img" aria-label="Diagrama do conteúdo do PDF"><rect width="340" height="184" rx="20" fill="#f2ebfc"/>'+inner+'</svg>';
    const color=['#fff','#e2f9f3','#fff4dc'];
    const lines=value=>{
      const words=clean(value).split(' '),arr=[''];
      for(const word of words){
        const last=arr.length-1;
        if((arr[last]+' '+word).trim().length>18&&arr.length<2)arr.push(word);
        else arr[last]=(arr[last]+' '+word).trim();
      }
      return arr.map(escape).slice(0,2);
    };
    const text=(label,x,y,width=96)=>{
      const ls=lines(label);
      return '<text x="'+x+'" y="'+(y-(ls.length-1)*7)+'" text-anchor="middle" fill="#302446" font-size="11" font-family="Arial,sans-serif" font-weight="700">'+ls.map((line,i)=>'<tspan x="'+x+'" dy="'+(i===0?0:14)+'">'+line+'</tspan>').join('')+'</text>';
    };
    const rect=(x,y,w,h,i)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="13" stroke="#71548f" stroke-width="2.5" fill="'+color[i%3]+'"/>';
    if(kind==='compare'){
      return base(rect(14,42,147,100,0)+rect(179,42,147,100,1)+text(labels[0],87,96)+text(labels[1],252,96)+
        '<circle cx="170" cy="92" r="16" fill="#71548f"/><path d="M163 89h14m-4-6 5 6-5 6" stroke="#fff" stroke-width="2.5" fill="none"/>');
    }
    if(kind==='timeline'){
      const n=labels.length,positions=n===2?[92,248]:[58,170,282];
      let shape='<path d="M36 86h268" stroke="#71548f" stroke-width="5" stroke-linecap="round"/>';
      labels.forEach((label,i)=>{
        shape+='<circle cx="'+positions[i]+'" cy="86" r="18" fill="'+['#fae1b2','#b7ecdf','#ddc6f7'][i]+'" stroke="#71548f" stroke-width="3"/>'+
          '<text x="'+positions[i]+'" y="91" text-anchor="middle" font-size="13" font-weight="800" fill="#45325b">'+(i+1)+'</text>'+
          rect(positions[i]-51,115,102,52,i)+text(label,positions[i],145);
      });
      return base(shape);
    }
    if(kind==='steps'){
      let shape='';
      labels.forEach((label,i)=>{
        const y=12+i*58;
        shape+=rect(25,y,290,51,i)+'<circle cx="51" cy="'+(y+25)+'" r="15" fill="#71548f"/>'+
          '<text x="51" y="'+(y+30)+'" font-family="Arial" font-size="13" text-anchor="middle" font-weight="800" fill="#fff">'+(i+1)+'</text>'+
          text(label,185,y+30);
      });
      return base(shape);
    }
    const n=labels.length,positions=n===2?[81,259]:[57,170,283];
    let shape='';
    labels.forEach((label,i)=>{
      shape+=rect(positions[i]-53,56,106,75,i)+text(label,positions[i],97);
      if(i<n-1)shape+='<path d="M'+(positions[i]+54)+' 94h'+(positions[i+1]-positions[i]-110)+'" stroke="#71548f" stroke-width="3" fill="none"/>';
    });
    return base(shape);
  }
  const registry=new Map();
  const key=card=>folded(card.title+' '+card.text);
  function register(cards){
    for(const card of (Array.isArray(cards)?cards:[])){
      const plan=validatePlan(card.visualPlan,card.text);
      if(plan)registry.set(key(card),svgDiagram(plan));
    }
  }
  function installArtHook(){
    const previous=root.VisuArt;
    if(!previous||previous.__visuAIHooked)return;
    const originalKind=previous.kindOf,originalSvg=previous.svg;
    const visuals=new Map();
    let count=0;
    root.VisuArt={
      ...previous,
      __visuAIHooked:true,
      kindOf(titleAndText){
        const svg=registry.get(folded(titleAndText));
        if(!svg)return originalKind(titleAndText);
        const token='ai-diagram-'+(++count);
        visuals.set(token,svg);
        if(visuals.size>200)visuals.delete(visuals.keys().next().value);
        return token;
      },
      svg(kind){return visuals.get(kind)||originalSvg(kind);}
    };
  }
  const api={configured,signedIn,emailLogin,logout,enhance,localPlan,decorateLocal,validatePlan,validateOutput,svgDiagram,register,installArtHook};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.VisuAI=api;
})(typeof window!=='undefined'?window:globalThis);
