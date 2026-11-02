/* VISUCARDS 1.3 | Placar de demonstração, exclusivamente local.
 * NUNCA tratar pontuações fictícias como ranking global verdadeiro.
 * O banco de dados/autenticação/validação de XP são etapas futuras.
 */
(function(root){
  'use strict';
  const POINTS_PER_CARD=10;
  const MAX_AWARDS=5000;
  const EXAMPLE_PARTICIPANTS=Object.freeze([
    Object.freeze({id:'aurora',name:'Estudante Aurora',weekly:70,monthly:250,all:900,streak:12}),
    Object.freeze({id:'concurseiro',name:'Concurseiro AM',weekly:60,monthly:230,all:800,streak:9}),
    Object.freeze({id:'lex',name:'Lex 2027',weekly:40,monthly:200,all:720,streak:8}),
    Object.freeze({id:'foco',name:'Foco Jurídico',weekly:20,monthly:130,all:500,streak:5})
  ]);
  const DEMO_CARDS=Object.freeze([
    Object.freeze({id:'game-example-1',title:'CONTRADITÓRIO E AMPLA DEFESA',text:'O art. 5º, LV, da Constituição Federal prevê o contraditório e a ampla defesa, com os meios e recursos a ela inerentes, aos litigantes em processo judicial ou administrativo e aos acusados em geral.',note:'Exemplo para conhecer o modo leitura. Confira sempre a fonte oficial.',source:'Demonstração · Constituição Federal · art. 5º, LV',color:0,layout:'caderno'}),
    Object.freeze({id:'game-example-2',title:'IDENTIFICAR EXCEÇÕES',text:'Na leitura de uma regra, expressões como “salvo” e “exceto” ajudam a localizar possíveis exceções. Identifique primeiro a regra e depois as condições da ressalva.',note:'Pergunta de revisão: qual expressão indica a exceção?',source:'Demonstração · técnica de leitura',color:1,layout:'caderno'}),
    Object.freeze({id:'game-example-3',title:'PRAZOS E CONDIÇÕES',text:'Ao estudar um prazo, anote o evento inicial, a duração, as possibilidades de suspensão ou interrupção e a norma que estabelece as regras.',note:'Pergunta de revisão: qual é o marco inicial?',source:'Demonstração · técnica de estudo',color:2,layout:'caderno'}),
    Object.freeze({id:'game-example-4',title:'REVISÃO ATIVA',text:'Depois de ler um card, tente explicar seu conteúdo sem olhar. Só depois compare sua resposta com o texto do material e anote o que não lembrou.',note:'Exercício de recuperação ativa.',source:'Demonstração · técnica de estudo',color:3,layout:'caderno'}),
    Object.freeze({id:'game-example-5',title:'REVISÃO ESPAÇADA',text:'Revisar um assunto em momentos diferentes ajuda a manter a lembrança por mais tempo. Cards difíceis podem voltar antes que os já dominados.',note:'Exemplo ilustrativo de organização das revisões.',source:'Demonstração · técnica de estudo',color:0,layout:'caderno'})
  ]);
  const isoDate=(input)=>{
    if(!(input instanceof Date)||Number.isNaN(input.getTime()))throw Error('Data inválida');
    return input.getFullYear()+'-'+String(input.getMonth()+1).padStart(2,'0')+'-'+String(input.getDate()).padStart(2,'0');
  };
  function mondayKey(dateString){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(dateString)))return null;
    const date=new Date(dateString+'T00:00:00.000Z');
    if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==dateString)return null;
    date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);
    return date.toISOString().slice(0,10);
  }
  function normalize(raw){
    const seen=new Set(),awards=[];
    const input=raw&&typeof raw==='object'&&Array.isArray(raw.awards)?raw.awards:[];
    for(const a of input.slice(0,MAX_AWARDS)){
      if(!a||typeof a!=='object'||typeof a.id!=='string'||!/^[-\w]{1,100}$/.test(a.id)||seen.has(a.id))continue;
      if(typeof a.date!=='string'||!mondayKey(a.date))continue;
      awards.push({id:a.id,date:a.date});seen.add(a.id);
    }
    return {awards};
  }
  function award(current,cardId,date=new Date()){
    const state=normalize(current);
    if(typeof cardId!=='string'||!/^[-\w]{1,100}$/.test(cardId))return {state,awarded:false};
    if(state.awards.some(a=>a.id===cardId)||state.awards.length>=MAX_AWARDS)return {state,awarded:false};
    return {state:{awards:[...state.awards,{id:cardId,date:isoDate(date)}]},awarded:true};
  }
  function score(current,period='weekly',today=new Date()){
    const state=normalize(current);
    const date=isoDate(today);
    const week=mondayKey(date);
    const valid=['weekly','monthly','all'].includes(period)?period:'weekly';
    const selected=state.awards.filter(a=>valid==='all'||
      (valid==='monthly'?a.date.slice(0,7)===date.slice(0,7):mondayKey(a.date)===week));
    return selected.length*POINTS_PER_CARD;
  }
  function standings(current,period='weekly',today=new Date()){
    const key=['weekly','monthly','all'].includes(period)?period:'weekly';
    return [
      ...EXAMPLE_PARTICIPANTS.map(x=>({id:x.id,name:x.name,points:x[key],streak:x.streak,example:true})),
      {id:'you',name:'Você',points:score(current,key,today),example:false}
    ].sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name,'pt-BR'))
      .map((p,i)=>({...p,place:i+1}));
  }
  function demoCards(){return DEMO_CARDS.map(c=>({...c}))}
  const api={POINTS_PER_CARD,MAX_AWARDS,EXAMPLE_PARTICIPANTS,normalize,award,score,standings,demoCards,mondayKey};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VisuRankingDemo=api;
})(typeof window!=='undefined'?window:globalThis);
