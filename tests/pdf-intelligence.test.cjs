const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('../pdf-intelligence.js');
const selection=require('../selection.js');

test('Reconstrói linhas do PDF.js sem juntar tópicos de posições diferentes',()=>{
  const text=engine.pageText([
    {str:'Art. 5º',transform:[1,0,0,1,20,720],height:10},
    {str:'assegura direitos.',transform:[1,0,0,1,80,720],height:10,hasEOL:true},
    {str:'Art. 6º',transform:[1,0,0,1,20,698],height:10},
    {str:'dispõe sobre outro direito.',transform:[1,0,0,1,80,698],height:10}
  ]);
  assert.equal(text,'Art. 5º assegura direitos.\nArt. 6º dispõe sobre outro direito.');
});

test('Preserva integralmente os textos ao dividir trechos extensos',()=>{
  const input=('A competência é exercida conforme os requisitos descritos na norma. ').repeat(34).trim();
  const parts=engine.cutLong(input);
  assert.ok(parts.length>2);
  assert.ok(parts.every(part=>part.length<=650));
  assert.equal(parts.join(' '),input);
  assert.ok(parts.every(part=>!part.endsWith('…')));
});

test('Capta diferentes artigos, prazos e ressalvas, com página original',()=>{
  const pages=[
    'DIREITO CONSTITUCIONAL\nArt. 5º O direito será exercido conforme previsão legal, observado o prazo de 15 dias para manifestação da pessoa interessada. Salvo disposição expressa em contrário, a regra geral será aplicada no procedimento.\nArt. 6º Os direitos sociais incluem educação e saúde e serão considerados no contexto normativo pertinente, conforme os critérios definidos em lei.',
    'DIREITO ADMINISTRATIVO\nArt. 37 A Administração pública deve observar os princípios expressamente previstos na Constituição e as exigências do ato administrativo. A competência será exercida por quem a lei determinar, sendo vedada a atuação fora das atribuições correspondentes.'
  ];
  const result=engine.extract(pages,selection.prioritize);
  assert.ok(result.chunks.length>=3,JSON.stringify(result.chunks));
  assert.ok(result.chunks.some(c=>c.text.startsWith('Art. 5º')&&c.page===1));
  assert.ok(result.chunks.some(c=>c.text.startsWith('Art. 6º')&&c.page===1));
  assert.ok(result.chunks.some(c=>c.text.startsWith('Art. 37')&&c.page===2));
  assert.ok(result.chunks.every(c=>c.text.length<=650 && c.page>=1 && c.page<=2));
});

test('Não repete cabeçalhos e textos idênticos em páginas diferentes',()=>{
  const repeated='A norma define os requisitos indispensáveis para a participação no procedimento, conforme o artigo correspondente, e determina que a competência não pode ser afastada por simples conveniência.';
  const pages=[
    'CURSO DE LEGISLAÇÃO\n'+repeated+'\nPágina de estudo',
    'CURSO DE LEGISLAÇÃO\n'+repeated+'\nOutra observação de uma linha com informações úteis para a aplicação da norma descrita.',
    'CURSO DE LEGISLAÇÃO\nTexto distinto sobre a aplicação do prazo previsto para a tramitação. A administração precisa observar a competência descrita no material.\nPágina de estudo'
  ];
  const result=engine.extract(pages,selection.prioritize);
  assert.equal(result.chunks.filter(c=>c.text.includes(repeated)).length,1);
  assert.ok(result.diagnostics.duplicates>=1);
  assert.ok(result.chunks.every(c=>!c.text.includes('CURSO DE LEGISLAÇÃO')));
});

test('Não elimina um artigo repetido como se fosse rodapé',()=>{
  const line='Art. 5º O direito será exercido conforme previsão legal e a competência será definida no procedimento, com observância dos requisitos e garantias previstos em lei.';
  const lines=engine.withoutRepeatedMargins([line+'\nNota 1',line+'\nNota 2']);
  assert.ok(lines.every(p=>p.some(x=>x===line)));
});

test('Mantém limites técnicos e origem mesmo com muitas páginas e candidatos',()=>{
  const long='A competência deverá ser exercida com observância dos requisitos, da legalidade e do procedimento previsto. ';
  const pages=Array.from({length:7},(_,page)=>Array.from({length:36},(_,j)=>'Art. '+(page*36+j+1)+' '+long.repeat(3)).join('\n'));
  const result=engine.extract(pages,selection.prioritize);
  assert.ok(result.chunks.length<=50);
  const counts=new Map();
  for(const c of result.chunks){
    counts.set(c.page,(counts.get(c.page)||0)+1);
    assert.ok(c.text.length<=650);
    assert.ok(c.page>=1&&c.page<=7);
  }
  assert.ok([...counts.values()].every(n=>n<=10));
});

test('Título usa palavras do próprio PDF e mantém referências a artigos',()=>{
  const title=engine.headline('Art. 37 A administração pública obedecerá aos princípios de legalidade, impessoalidade, moralidade, publicidade e eficiência, além de outras disposições normativas.');
  assert.match(title,/Art\. 37/i);
  assert.match(title,/administração pública/i);
  assert.doesNotMatch(title,/revisão inventada/i);
});

test('Integra extração e bloqueio visual sem alterar o desenho aprovado',()=>{
  const html=fs.readFileSync('index.html','utf8');
  const workflow=fs.readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(html,/script src="\.\/pdf-intelligence\.js"/);
  assert.match(html,/window\.VisuPDFIntelligence\.pageText\(content\.items\)/);
  assert.match(html,/window\.VisuPDFIntelligence\.extract\(pages,window\.VisuSelection\.prioritize\)/);
  assert.match(html,/window\.VisuPDFIntelligence\.headline\(p\.text\)/);
  assert.match(workflow,/cp pdf-intelligence\.js site\/pdf-intelligence\.js/);
});

test('Não descarta artigos curtos com conteúdo legal específico',()=>{
  const result=engine.extract(['Art. 10 É livre a manifestação do pensamento.\nArt. 11 É vedado o anonimato, nos termos da norma.'],selection.prioritize);
  assert.ok(result.chunks.some(c=>c.text.startsWith('Art. 10')));
  assert.ok(result.chunks.some(c=>c.text.startsWith('Art. 11')));
});
