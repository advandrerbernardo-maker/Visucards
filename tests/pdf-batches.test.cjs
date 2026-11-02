const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const batches=require('../pdf-batches.js');
const intelligence=require('../pdf-intelligence.js');
const priority=require('../selection.js');
const html=fs.readFileSync('index.html','utf8');
const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
const HASH_A='a'.repeat(64),HASH_B='b'.repeat(64);

function simulated(total){
  let doc=batches.create(HASH_A,'direito.pdf',total,2048);
  const visited=[],readRanges=[];
  while(!doc.completed){
    const range=batches.range(total,doc.nextPage);
    assert.ok(range);
    readRanges.push([range.start,range.end]);
    const seen=Array.from({length:range.end-range.start+1},(_,i)=>range.start+i);
    visited.push(...seen);
    const parsed={hash:doc.hash,file:doc.file,totalPages:total,pageStart:range.start,
      pageEnd:range.end,chunks:seen.map(page=>({page,text:'Art. '+page+' A regra deve ser observada conforme requisitos legais e os prazos correspondentes.'}))};
    doc=batches.batch(doc,parsed);
    // Primeiro fim da fila de cards, depois avanço.
    assert.throws(()=>batches.batch(doc,parsed),/Intervalo repetido/);
    doc=batches.moveCursor(doc,parsed.chunks.length,parsed.chunks.length);
    assert.equal(doc.completed,range.end===total);
    const restored=batches.normalizeDoc(JSON.parse(JSON.stringify(doc)));
    assert.ok(restored);
    assert.equal(restored.nextPage,doc.nextPage);
  }
  assert.equal(visited.length,total);
  assert.equal(new Set(visited).size,total);
  assert.deepEqual(visited,Array.from({length:total},(_,i)=>i+1));
  assert.equal(batches.range(total,doc.nextPage),null);
  return readRanges;
}

test('PDFs de 1, 15, 20, 30, 31 e 101 páginas avançam sem repetir nenhuma',()=>{
  for(const count of [1,15,20,30,31,101]){
    const ranges=simulated(count);
    assert.equal(ranges[0][0],1);
    assert.equal(ranges.at(-1)[1],count);
    assert.ok(ranges.every(([a,b])=>b-a+1<=15));
  }
  assert.deepEqual(simulated(20),[[1,15],[16,20]]);
  assert.deepEqual(simulated(31),[[1,15],[16,30],[31,31]]);
});

test('Documento igual é identificado por hash, mesmo se tiver nome diferente',()=>{
  const document=batches.create(HASH_A,'arquivo-original.pdf',20,1000);
  const existing=[document];
  const duplicateName='copiado.pdf';
  assert.notEqual(duplicateName,document.file);
  assert.equal(existing.find(x=>x.hash===HASH_A),document);
  assert.equal(existing.find(x=>x.hash===HASH_B),undefined);
  assert.equal(batches.normalizeDoc({...document,hash:'inválido'}),null);
});

test('Progresso salvo recupera o bloco anterior sem voltar à página 1',()=>{
  let doc=batches.create(HASH_A,'estudo.pdf',45,25000);
  const first={hash:doc.hash,file:doc.file,pageStart:1,pageEnd:15,totalPages:45,
    chunks:Array.from({length:5},(_,i)=>({page:i+1,text:'Art. '+(i+1)+' A regra geral será observada conforme requisitos indicados na norma.'}))};
  doc=batches.batch(doc,first);
  doc=batches.moveCursor(doc,3,5);
  const restored=batches.normalizeDoc(JSON.parse(JSON.stringify(doc)));
  assert.equal(restored.pending.cursor,3);
  assert.equal(restored.pending.parsed.pageStart,1);
  assert.equal(restored.nextPage,16);
  assert.deepEqual(batches.range(restored.totalPages,restored.nextPage),{start:16,end:30,total:45});
  assert.throws(()=>batches.batch(restored,first),/Intervalo repetido/);
});

test('Páginas escaneadas sem texto são marcadas como lidas, sem loops',()=>{
  let doc=batches.create(HASH_A,'scan.pdf',32,25000);
  while(doc.nextPage<=doc.totalPages){
    const current=batches.range(doc.totalPages,doc.nextPage);
    doc=batches.withoutContent(doc,current);
  }
  assert.equal(doc.nextPage,33);
  assert.equal(doc.completed,true);
});

test('Referências da extração são absolutas nos blocos 16-30 e 31-45',()=>{
  const paragraph=n=>'Art. '+n+' O procedimento seguirá os requisitos previstos na lei, com observância dos prazos e da competência da autoridade responsável, conforme a situação apresentada.';
  const r16=intelligence.extract([paragraph(16),paragraph(17)],priority.prioritize,16);
  assert.deepEqual(new Set(r16.chunks.map(c=>c.page)),new Set([16,17]));
  const r31=intelligence.extract([paragraph(31)],priority.prioritize,31);
  assert.ok(r31.chunks.every(c=>c.page===31));
  assert.throws(()=>intelligence.extract(['texto'],priority.prioritize,0),/Página inicial inválida/);
});

test('Interface permite avançar blocos sem recomeçar e guarda o histórico',()=>{
  assert.match(html,/id="next-pages"/);
  assert.match(html,/id="document-progress"/);
  assert.match(html,/VisuPDFBatches\.fingerprint\(buffer\)/);
  assert.match(html,/VisuPDFBatches\.cacheFile\(hash,file\)/);
  assert.match(html,/VisuPDFBatches\.cachedFile\(doc\.hash\)/);
  assert.match(html,/documents:state\.documents,activeHash:state\.activeHash/);
  assert.match(html,/if\(existing\?\.completed\)/);
  assert.match(html,/existing\?\.pending\?\.parsed/);
  assert.match(html,/VisuPDFBatches\.batch\(doc,parsed\)/);
  assert.match(html,/VisuPDFBatches\.moveCursor\(doc,batch\.nextCursor,candidates\.length\)/);
  assert.match(html,/window\.VisuPDFIntelligence\.extract\(pages,window\.VisuSelection\.prioritize,startPage\)/);
  assert.match(html,/Boolean\(state\.parsed\)&&remaining>0/);
  assert.match(workflow,/cp pdf-batches\.js site\/pdf-batches\.js/);
  assert.doesNotMatch(html,/Use Recomeçar cards para testar outras versões/);
});
