# VISUCARDS 0.4 | Protótipo para concursos

Aplicativo experimental de estudo visual, voltado a transformar trechos de PDFs com texto selecionável em cards ilustrados para revisão.

## O que já funciona
- Interface responsiva em português e demonstração de cards.
- Leitura de PDFs textuais no próprio navegador, com limite demonstrativo de 1 PDF de até 5 páginas/mês.
- Geração de até 2 cards ilustrados/mês na modalidade gratuita.
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
- A cota gratuita é demonstrativa, pois o armazenamento local pode ser apagado.
- O leitor PDF.js 6.4.299 é carregado pela internet quando necessário.
- Não coloque documentos sigilosos nesta versão experimental.
- Os combos e valores exibidos são exemplos e não estão à venda.

## Testes e publicação

O arquivo `index.html` desta versão concentra a interface e o JavaScript do protótipo para facilitar a publicação.

O fluxo `.github/workflows/pages.yml` executa os testes presentes em `tests/*.test.cjs` e só depois tenta publicar o HTML no GitHub Pages.

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
