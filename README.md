# VISUCARDS 0.6.1 | Protótipo para concursos

Aplicativo experimental de estudo visual, voltado a transformar trechos de PDFs com texto selecionável em cards ilustrados para revisão.

## O que já funciona
- Interface responsiva em português e demonstração de cards.
- Leitura de PDFs textuais no próprio navegador, com limite demonstrativo de 1 PDF de até 5 páginas/mês.
- **Triagem 0.6:** reconstrói linhas do PDF, separa artigos e dispositivos legais, remove cabeçalhos e fragmentos repetidos, identifica páginas e prioriza candidatos didaticamente úteis. Dispositivos curtos com referência normativa também são preservados.
- **Modo de testes:** geração de cards sem limite mensal, em lotes de até 2 por clique; após percorrer os trechos disponíveis do PDF, o app recomeça para permitir novos testes de estilos.
- O limite comercial proposto de 2 cards por mês está apenas configurado para uma futura fase, mas **não bloqueia** a geração no modo de testes.
- Triagem textual automática de regras, exceções, prazos e artigos, sem necessidade de importar histórico de questões. **Não** mede a frequência real em concursos.
- O texto escolhido é preservado dentro de blocos de até 650 caracteres, sem corte com reticências; blocos longos são divididos. A seleção ainda se limita aos 10 melhores trechos por página e 50 no total, logo não equivale a um resumo completo do PDF.
- **Cards editoriais ilustrados (0.5):** cabeçalho com hierarquia, ilustração temática em SVG, trecho central, complementos numerados, identificação de artigos/prazos/ressalvas quando constarem literalmente no PDF, notas e fonte.
- Três estilos visuais (caderno, quadrinhos e minimalista), edição de textos, exportação PNG e impressão/PDF adaptadas ao novo layout.
- A organização utiliza regras locais e não cria interpretações jurídicas, jurisprudência, dicas ou exemplos por IA a partir do PDF. Os desenhos ainda são modelos vetoriais por tema, não ilustrações exclusivas por conceito.
- Biblioteca local, busca, backup e restauração.
- **Modo revisão** na biblioteca: ocultar/responder, marcar dificuldade, agendar próximas revisões e fazer revisão livre. Revisar não consome cota mensal.
- Próxima revisão armazenada no navegador e incluída no backup.
- Vitrine ilustrativa de combos e planos, **sem compras reais**.

## Limitações importantes
- O processamento é **local** e não possui IA para interpretar conceitos ou gerar desenhos sob demanda. Melhorias da seleção não equivalem a avaliação humana nem a previsão da banca.
- A nova análise completa de estrutura do PDF será aplicada a arquivos enviados **a partir da versão 0.6**. Cards já salvos não são reescritos.
- Não há cadastro de usuários, banco de dados ativo, cobrança, OCR nem cotas verificadas por servidor.
- Foi incluído o arquivo `backend/schema_preparacao.sql` com RLS, mas **não foi executado** em nenhum Supabase. Precisa de testes reais.
- Dados guardados no navegador podem desaparecer; use o backup.
- O limite demonstrativo de upload de PDF continua em 1 arquivo de até 5 páginas por mês. Apenas o limite de geração de cards foi desativado para testes.
- O uso sem limite pode ocupar o armazenamento local do aparelho. Faça backup regularmente; os dados podem ser apagados ao limpar o navegador.
- O leitor PDF.js 6.4.299 é carregado pela internet quando necessário.
- Não coloque documentos sigilosos nesta versão experimental.
- Os combos e valores exibidos são exemplos e não estão à venda.

## Testes e publicação

O arquivo `index.html` desta versão concentra a interface e o JavaScript do protótipo para facilitar a publicação.

O fluxo `.github/workflows/pages.yml` publica `selection.js`, `card-design.js` e `pdf-intelligence.js`, executa os testes presentes em `tests/*.test.cjs` e só depois tenta publicar o HTML no GitHub Pages.

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

Validar a triagem com PDFs reais de concursos, incluindo PDFs digitalizados e documentos jurídicos em duas colunas; depois estudar OCR local e uma integração segura com IA por backend, com referências de página e conferência do texto original. Antes de monetizar, criar Supabase exclusivo com Auth, RLS e controle real de direitos, cotas e acesso a combos. Os cartões mantêm o layout editorial 0.5, protegido em `DESIGN_LOCK.md`.

O serviço Recebi+ e outros projetos não são utilizados nem alterados por este repositório.


## Fluxo de criação simplificado

1. Selecione um PDF com texto legível de até cinco páginas.
2. Escolha o estilo dos cards (caderno ilustrado, quadrinhos ou minimalista).
3. Toque em **Gerar meus cards** para receber dois cards por vez, sem limite mensal durante os testes.

A triagem identifica pistas didáticas no próprio PDF, priorizando regras, artigos, exceções, prazos e conceitos relevantes para revisão. **Não há importação de CSV, filtros de banca/cargo ou ranking histórico de questões.** O aplicativo não afirma que os assuntos escolhidos são estatisticamente os mais cobrados.

Os cards já salvos, as revisões e os backups continuam disponíveis. O novo fluxo não altera o modelo visual 0.5, protegido em `DESIGN_LOCK.md`.
