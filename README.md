# VISUCARDS 1.1 | Protótipo para concursos

Aplicativo experimental de estudo visual, voltado a transformar trechos de PDFs com texto selecionável em cards ilustrados para revisão.

## O que já funciona
- Interface responsiva em português e demonstração de cards.
- **Modo de testes 1.0:** envie PDFs sem limite mensal, com **até 50 MB por arquivo e sem limite prévio de páginas**. O leitor analisa as páginas **1 a 15**, depois **16 a 30** e assim até o final; o próximo intervalo é liberado depois de gerar os cards do bloco atual. PDFs digitalizados sem texto selecionável ainda dependem de OCR.
- **Triagem 0.6:** reconstrói linhas do PDF, separa artigos e dispositivos legais, remove cabeçalhos e fragmentos repetidos, identifica páginas e prioriza candidatos didaticamente úteis. Dispositivos curtos com referência normativa também são preservados.
- **Geração simplificada 1.1:** além do botão manual de dois cards, o comando **Gerar bloco inteiro** cria automaticamente todos os cards ainda disponíveis naquele intervalo de até 15 páginas, salva os cards a cada dois e oferece **Pausar geração**. É possível continuar depois sem refazer cards. O modo de geração automática usa o processamento **local**, sem consumir cota de IA externa; a prévia mostra os últimos cards gerados, e o restante está na biblioteca. Ao terminar, clique em **Ler páginas 16 a 30**, **31 a 45** etc.
- As regras comerciais futuras de 1 PDF de 5 páginas e 2 cards por mês continuam apenas como configuração de referência, mas **não bloqueiam** uploads nem geração no modo de testes.
- **Triagem 0.7 + proteção 1.1:** além de identificar regras, exceções, prazos e artigos, elimina textos idênticos e muito semelhantes de maneira conservadora, distribui os assuntos entre páginas e verifica se a mesma explicação já virou card em bloco anterior **do mesmo PDF**, evitando repetições. É uma seleção didática, **não** uma medida de incidência real nas provas.
- O texto escolhido é preservado em trechos de até 650 caracteres; textos longos são divididos. Cada **bloco de 15 páginas** seleciona no máximo dez trechos por página e 50 no total, reservando inicialmente um de cada página com conteúdo elegível. A referência de página continua sendo a página **real do documento**, inclusive depois da 15. Isso **não** equivale a um resumo completo do PDF.
- **Cards editoriais ilustrados (0.5):** cabeçalho com hierarquia, ilustração temática em SVG, trecho central, complementos numerados, identificação de artigos/prazos/ressalvas quando constarem literalmente no PDF, notas e fonte. As notas dos novos cards agora oferecem **perguntas de revisão conforme as pistas do texto**, sem acrescentar respostas inventadas.
- Três estilos visuais (caderno, quadrinhos e minimalista), edição de textos, exportação PNG e impressão/PDF adaptadas ao novo layout.
- **Diagramas locais (0.8):** mesmo sem IA externa, o VISUCARDS combina artigos, prazos e ressalvas encontrados literalmente no PDF em diagramas vetoriais personalizados quando há pistas suficientes. Quando não há, mantém a ilustração temática anterior.
- **Integração de IA preparada (0.8):** cliente autenticado, Edge Function Supabase exclusiva, cota diária por usuário e retorno em diagramas vetoriais específicos com rótulos literais do PDF. O modelo pode sugerir título e disposição gráfica, mas nunca substitui o texto original nem inventa leis ou dados.
- **Infraestrutura criada:** projeto Supabase exclusivo **VISUCARDS** (`cuzqfjmjfozfngrahkzz`, São Paulo), tabela de cota com RLS e função `visucards-ai` publicada com verificação de JWT. **A IA externa continua desativada** (`enabled:false` em `ai-config.js`) até concluir a configuração do segredo `GROQ_API_KEY`, as URLs de autenticação e um teste real. O modo local continua funcionando.
- Diagramas da IA são SVGs próprios de estudo (fluxo, passos, comparação ou linha do tempo), não imagens realistas geradas por difusão. O design visual 0.5 permanece bloqueado.
- Biblioteca local, busca, backup e restauração.
- **Modo revisão** na biblioteca: ocultar/responder, marcar dificuldade, agendar próximas revisões e fazer revisão livre. Revisar não consome cota mensal.
- Próxima revisão armazenada no navegador e incluída no backup.
- Vitrine ilustrativa de combos e planos, **sem compras reais**.

## Limitações importantes
- O processamento e a seleção padrão são **locais**. A integração de IA será opcional quando o backend próprio estiver ativo; nesse caso, apenas os trechos selecionados serão transmitidos com autenticação para gerar diagramas, não o PDF completo. Melhorias de triagem não equivalem a avaliação humana nem à previsão da banca.
- A nova análise completa de estrutura do PDF será aplicada a arquivos enviados **a partir da versão 0.6**. Cards já salvos não são reescritos.
- Existe um banco Supabase exclusivo com controle de cota para IA, mas a autenticação por e-mail ainda depende da configuração das URLs e a integração está desativada. A biblioteca segue local, sem sincronização, cobrança ou OCR. As cotas comerciais de PDFs e cards ainda são locais.
- Foi incluído o arquivo `backend/schema_preparacao.sql` com RLS, mas **não foi executado** em nenhum Supabase. Precisa de testes reais.
- Dados guardados no navegador podem desaparecer; use o backup.
- O **modo de testes** aceita PDFs ilimitados, de **até 50 MB, com qualquer número de páginas**, lidos em partes de até 15. Identifica documentos pelo SHA-256 do arquivo; reimportar o mesmo PDF reconhece o progresso e não duplica páginas nem cards. Quando terminado, o mesmo documento não é importado novamente. O arquivo PDF ativo pode ser guardado em **IndexedDB local** para continuar após fechar a aba. Se o aparelho não permitir guardar o arquivo, basta selecioná-lo novamente para retomar no ponto salvo. Os cards antigos continuam na biblioteca.
- O uso sem limite pode ocupar o armazenamento do aparelho. Apenas o PDF ativo é guardado localmente para retomada automática, quando houver espaço. Os metadados de progresso e hashes identificam PDFs já importados; ao apagar os dados do navegador, esse histórico também desaparece. Faça backup dos cards regularmente; o backup da biblioteca não contém o PDF original.
- O leitor PDF.js 6.4.299 é carregado pela internet quando necessário.
- Não coloque documentos sigilosos nesta versão experimental.
- Os combos e valores exibidos são exemplos e não estão à venda.

## Testes e publicação

O arquivo `index.html` desta versão concentra a interface e o JavaScript do protótipo para facilitar a publicação.

O fluxo `.github/workflows/pages.yml` publica `selection.js`, `card-design.js`, `pdf-intelligence.js`, `ai-cards.js` e `ai-config.js`, executa os testes presentes em `tests/*.test.cjs` e só depois tenta publicar o HTML no GitHub Pages.

Para rodar os testes localmente:

```bash
node --test tests/*.test.cjs
```

Para visualizar sem GitHub Pages, abra `index.html` em um servidor HTTP local. Não é necessário configurar chaves.

### GitHub Pages

1. Abra **Settings > Pages** no repositório.
2. Se necessário, escolha **Build and deployment > Source: GitHub Actions**.
3. Confira a execução em **Actions**. A URL esperada depois da publicação é https://advandrerbernardo-maker.github.io/Visucards/ .

## Próximos passos

**Falta a ativação final do provedor de IA:** adicionar o segredo `GROQ_API_KEY` no painel do projeto VISUCARDS, configurar Auth > URL Configuration com a URL do GitHub Pages, testar login e saída validada do provedor e então mudar `enabled:false` para `true` em `ai-config.js`. A função `visucards-ai` já aceita referências de páginas acima da 15, sem limite de página fixo; URL e publishable key públicas do projeto estão preenchidas. Consulte [docs/AI_SETUP.md](docs/AI_SETUP.md). **Não utilizar o projeto Recebi+.** Depois testar PDFs reais, OCR e funções comerciais. O layout editorial 0.5 permanece protegido em `DESIGN_LOCK.md`.

O serviço Recebi+ e outros projetos não são utilizados nem alterados por este repositório.


## Fluxo de criação simplificado

1. Selecione um PDF com texto legível de **até 50 MB**. Ele pode ter mais de 15 páginas: somente o primeiro bloco será lido inicialmente.
2. Escolha o estilo dos cards (caderno ilustrado, quadrinhos ou minimalista).
3. Toque em **Gerar bloco inteiro** para criar, de uma vez, os cards restantes das páginas 1 a 15. Se preferir, **Gerar meus cards** continua criando dois por vez. Durante a criação automática, é possível pausar sem perder o que já foi salvo. Ao concluir, toque em **Ler páginas 16 a 30** (ou até o fim, se faltar menos) e repita até terminar o documento sem reler páginas.

A triagem identifica pistas didáticas no próprio PDF, priorizando regras, artigos, exceções, prazos e conceitos relevantes para revisão. **Não há importação de CSV, filtros de banca/cargo ou ranking histórico de questões.** O aplicativo não afirma que os assuntos escolhidos são estatisticamente os mais cobrados.

Os cards já salvos, as revisões e os backups continuam disponíveis. Os novos cards recebem um identificador do documento para impedir que um trecho de bloco anterior seja selecionado novamente; esse identificador também é preservado nos backups novos. Ao escolher outro PDF, o conteúdo em análise muda, mas cada documento conserva seu checkpoint de páginas e de cards no navegador. Um documento já concluído é reconhecido por hash e não é importado de novo. O último PDF ativo pode ser retomado do cache local; para outros arquivos, selecione o mesmo PDF novamente. O visual 0.5 permanece protegido em `DESIGN_LOCK.md`. PDFs digitalizados ainda precisam de OCR para leitura.

### IA opcional

A função de IA só aparece após a ativação controlada de um backend Supabase **dedicado ao VISUCARDS**. A infraestrutura foi criada, mas o serviço está temporariamente desativado até a configuração segura do provedor e do login. Depois disso, o usuário confirma acesso por e-mail e pode gerar os cards normalmente. O navegador transmite até dois trechos por solicitação, valida com o backend os dados extraídos literalmente e guarda apenas um plano de ilustração na biblioteca. Se a IA estiver indisponível, a geração local permanece utilizável. A ativação depende de infraestrutura separada e credenciais de provedor que ainda não foram configuradas. Leia [docs/AI_SETUP.md](docs/AI_SETUP.md) para concluir a implantação de modo seguro.
