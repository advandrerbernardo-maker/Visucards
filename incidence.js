/* VISUCARDS: priorização por incidência comprovável em base fornecida pelo usuário.
   Sem uma base de questões não há inferência de frequência histórica. */
(function(root){
  "use strict";
  const normalizar = value => String(value == null ? "" : value)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

  function parseCSV(source){
    if(typeof source !== "string" || !source.trim()) throw new Error("O CSV de questões está vazio.");
    if(source.length > 1000000) throw new Error("O arquivo de incidência excede 1 MB.");
    const input = source.replace(/^\uFEFF/, "");
    const headerLine = input.split(/\r?\n/,1)[0] || "";
    const separator = (headerLine.match(/;/g)||[]).length >= (headerLine.match(/,/g)||[]).length ? ";" : ",";
    const parsed = []; let row = []; let field = ""; let quoted = false;
    for(let i=0; i<input.length; i++){
      const ch=input[i];
      if(ch === '"'){
        if(quoted && input[i+1] === '"'){field+='"';i++;}
        else quoted=!quoted;
      }else if(ch === separator && !quoted){row.push(field);field="";}
      else if((ch==="\n"||ch==="\r") && !quoted){
        row.push(field);
        if(row.some(v=>v.trim())) parsed.push(row);
        row=[];field="";
        if(ch==="\r"&&input[i+1]==="\n")i++;
      }else field+=ch;
    }
    if(quoted) throw new Error("Aspas incompletas no CSV.");
    row.push(field);if(row.some(v=>v.trim()))parsed.push(row);
    if(parsed.length<2) throw new Error("Inclua cabeçalho e pelo menos uma linha de dados.");
    if(parsed.length>751) throw new Error("O limite é de 750 linhas de histórico por arquivo.");
    const keys=parsed[0].map(v=>normalizar(v).replace(/\s/g,""));
    const indexOfAny=(values)=>keys.findIndex(k=>values.includes(k));
    const topicIx=indexOfAny(["assunto","tema","topico","topicos","topic"]);
    const countIx=indexOfAny(["questoes","qtdquestoes","quantidade","quantidadedequestoes","ocorrencias","frequencia","nquestoes"]);
    const bancaIx=indexOfAny(["banca","organizadora"]);
    const cargoIx=indexOfAny(["cargo","funcao"]);
    const anoIx=indexOfAny(["ano"]);
    if(topicIx<0||countIx<0) throw new Error("O CSV deve ter as colunas 'assunto' e 'questoes'.");
    const rows=[];
    for(let i=1;i<parsed.length;i++){
      const cells=parsed[i];const topic=String(cells[topicIx]||"").trim();
      if(!topic)continue;
      if(topic.length>120)throw new Error("Assunto muito longo na linha "+(i+1)+".");
      const raw=String(cells[countIx]||"").trim();
      if(!/^\d{1,6}$/.test(raw))throw new Error("Quantidade de questões inválida na linha "+(i+1)+".");
      const questions=Number(raw);
      if(!questions)continue;
      const banca=bancaIx<0?"":String(cells[bancaIx]||"").trim().slice(0,80);
      const cargo=cargoIx<0?"":String(cells[cargoIx]||"").trim().slice(0,80);
      const ano=anoIx<0?"":String(cells[anoIx]||"").trim().slice(0,10);
      if(ano && !/^\d{4}$/.test(ano))throw new Error("Ano inválido na linha "+(i+1)+".");
      if(normalizar(topic).length < 5)continue;
      rows.push({topic,questions,banca,cargo,ano});
    }
    if(!rows.length)throw new Error("O histórico não contém questões válidas.");
    return rows;
  }

  function visibleRows(rows,filters={}){
    const banca=normalizar(filters.banca||"");
    const cargo=normalizar(filters.cargo||"");
    return (Array.isArray(rows)?rows:[]).filter(r =>
      (!banca || (r.banca && normalizar(r.banca).includes(banca))) &&
      (!cargo || (r.cargo && normalizar(r.cargo).includes(cargo)))
    );
  }

  function topicPresent(text,topic){
    const hay=normalizar(text), needle=normalizar(topic);
    if(!hay||needle.length<5)return false;
    const hayWords = new Set(hay.split(" "));
    if(hay===needle || hay.includes(" "+needle+" ") || hay.startsWith(needle+" ") || hay.endsWith(" "+needle))return true;
    const tokens=needle.split(" ").filter(x=>x.length>=4 && !["para","como","sobre","entre","quando","direito","artigo"].includes(x));
    return tokens.length>=2 && tokens.every(x=>hayWords.has(x));
  }

  function rank(chunks,rows,filters={}){
    const filtered=visibleRows(rows,filters);
    const topics=new Map();
    for(const r of filtered){
      const key=normalizar(r.topic);
      if(!topics.has(key))topics.set(key,{topic:r.topic,questions:0});
      topics.get(key).questions += r.questions;
    }
    const result=(Array.isArray(chunks)?chunks:[]).map((chunk,i)=>{
      const matches=[...topics.values()].filter(t=>topicPresent(chunk.text||"",t.topic))
        .sort((a,b)=>b.questions-a.questions);
      return {...chunk,matches,questions:matches.reduce((n,m)=>n+m.questions,0),rankIndex:i};
    });
    result.sort((a,b)=>b.questions-a.questions || a.rankIndex-b.rankIndex);
    return {ranked:result,evidence:result.some(x=>x.questions>0),sampleRows:filtered.length,sampleQuestions:filtered.reduce((s,x)=>s+x.questions,0)};
  }

  const api={normalizar,parseCSV,visibleRows,topicPresent,rank};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  else root.VisuIncidence=api;
})(typeof window!=="undefined"?window:globalThis);
