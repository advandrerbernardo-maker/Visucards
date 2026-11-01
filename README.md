# VISUCARDS 0.4.2 | Protótipo para concursos

Aplicativo experimental de estudo visual, voltado a transformar trechos de PDFs com texto selecionável em cards ilustrados para revisão.

## O que já funciona
- Interface responsiva em português e demonstração de cards.
- Leitura de PDFs textuais no próprio navegador, com limite demonstrativo de 1 PDF de até 5 páginas/mês.
- **Modo de testes:** geração de cards sem limite mensal, em lotes de até 2 por clique; após percorrer os trechos disponíveis do PDF, o app recomeça para permitir novos testes de estilos.
- O limite comercial proposto de 2 cards por mês está apenas configurado para uma futura fase, mas **não bloqueia** a geração no modo de testes.
- Triagem textual didática de regras, exceções, prazos e artigos, quando não há base histórica. Isso **não** mede frequência em concursos.
- Texto dos trechos selecionados preservado no card, sem o antigo corte automático em 48 palavras (o trecho de origem continua limitado ao fragmento extraído).
- Três estilos de layout, edição de textos, exportação PNG e impressão/PDF.
- Biblioteca local, busca, backup e restauração.
- **Modo revisão** na biblioteca: ocultar/responder, marcar dificuldade, agendar próximas revisões e fazer revisão livre. Revisar não consome cota mensal.
- Próxima revisão armazenada no navegador e incluída no backup.
- Vitrine ilustrativa de combos e planos, **sem compras reais**.

## Limitações importantes
- O processamento é **local** e não possui IA para interpretar conceitos ou gerar desenhos sob demanda.
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

O fluxo `.github/workflows/pages.yml` publica também `selection.js` e `incidence.js`, executa os testes presentes em `tests/*.test.cjs` e só depois tenta publicar o HTML no GitHub Pages.

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

Criar um projeto Supabase exclusivo, com Auth e políticas RLS para biblioteca, cotas e direito de acesso a combos; integrar IA com referências às páginas do PDF; validar PDFs reais; e apenas depois implementar pagamentos.

O serviço Recebi+ e outros projetos não são utilizados nem alterados por este repositório.


## Priorização por incidência de questões (protótipo)
O VISUCARDS pode importar um CSV com as colunas **assunto;questoes** e, opcionalmente, **banca;cargo;ano**.
- Ao selecionar PDF de até 5 páginas, o app cruza os trechos com os assuntos e contagens da amostra importada.
- Se houver correspondência, apresenta uma lista dos temas reconhecidos e prioriza a geração dos cards correspondentes.
- Os números exibidos vêm exclusivamente do arquivo fornecido, sem validação de fontes. Não são estatísticas de todas as provas.
- Se não houver histórico ou correspondência, o app cria cards textuais normais e avisa que **não existe prova de que o assunto seja o mais cobrado**.
- Não consulta automaticamente QConcursos, TEC ou plataformas comerciais; não coleta questões protegidas nem acesso de contas.
- Sem IA e sem base histórica licenciada, a interpretação de sinônimos e a identificação de temas ainda são limitadas.

### Exemplo de CSV (apenas formato, valores fictícios)
\`\`\`csv
assunto;questoes;banca;cargo;ano
Ampla defesa;12;BANCA_DE_EXEMPLO;CARGO_DE_EXEMPLO;2025
Segurança jurídica;9;BANCA_DE_EXEMPLO;CARGO_DE_EXEMPLO;2024
\`\`\`

**Próxima evolução:** conectar um acervo legítimo de provas e questões com banca, cargo, ano, fonte e identificação do item, permitindo cálculo verificável da incidência por assunto e comparação por edital. Só então usar percentuais de frequência históricos reais.
