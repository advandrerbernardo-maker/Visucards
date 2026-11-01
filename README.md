# VISUCARDS 0.3 | Protótipo de aplicativo para concursos

Transforma trechos de PDFs textuais em cards didáticos com **ilustrações vetoriais originais**, editáveis, exportáveis em PNG e por impressão/PDF.

## Novidades na 0.3

- Ilustrações vetoriais próprias para temas jurídicos, prazos, estudo, matemática e saúde.
- Estilos visuais: caderno ilustrado, quadrinhos e minimalista.
- Exportação em PNG com desenho, mais janela de impressão para **Salvar como PDF**.
- Biblioteca local com busca, exclusão, backup JSON e restauração validada, sem truncamento silencioso.
- Rascunho do PDF do mês persistido localmente, para retomar após fechar e reabrir a interface.
- Travamento de leitura simultânea de PDFs, melhorias de exibição no celular e testes automatizados no GitHub Actions.
- GitHub Pages publica apenas os arquivos públicos do aplicativo.
- Leitor de PDF atualizado, com `isEvalSupported:false` como proteção adicional.
- Repositório pronto para configurar GitHub Pages com workflow em `.github/workflows/pages.yml`.
- Arquivo `backend/schema.sql` com modelo para Supabase separado, políticas RLS, cotas e direitos de acesso para venda avulsa + Premium. **Não aplicado nem conectado**.

## Testes automáticos

```bash
node --test tests/*.test.mjs
```

Veja `tests/RESULTADOS.md` para os limites dos testes.

## Testar no computador

```bash
python -m http.server 8080
```

Abra `http://localhost:8080`. No celular, publique em HTTPS para instalar como PWA.

O leitor PDF.js 6.4.299 é importado sob demanda por CDN ao abrir PDFs; requer internet nesse momento (a versão vulnerável 3.11.174 foi removida). PDFs digitalizados sem texto selecionável não são suportados nesta versão. Os PDFs não são enviados a servidor. O limite gratuito é **demonstrativo, gravado no navegador**: 1 PDF de até 5 páginas e 2 cards por mês. O navegador pode ser limpo, então ainda não é sistema comercial pronto. O aplicativo salva temporariamente no dispositivo alguns trechos de texto do PDF para retomar a geração depois: evite documentos confidenciais nesta versão.

## Publicar no GitHub Pages

1. Os arquivos do projeto devem estar no repositório `advandrerbernardo-maker/Visucards`, mantendo a estrutura e a pasta `.github`.
2. Nas configurações do repositório, abra **Settings > Pages** e selecione **Source: GitHub Actions**.
3. Vá a **Actions**, confira a execução do workflow `Publicar VISUCARDS no GitHub Pages`.
4. O endereço esperado, **somente depois da publicação**, é `https://SEU-USUARIO.github.io/visucards/`.

Não publique PDFs enviados por clientes nem chaves secretas no repositório. O GitHub Pages hospeda apenas a interface estática.

## O que ainda falta

- IA real para interpretar, resumir e desenhar ilustrações personalizadas a partir do texto, com aprovação do estudante antes de gerar a arte.
- OCR para PDFs escaneados.
- Login, sincronização, cota verificada no servidor e backend de processamento.
- Checkout, assinatura recorrente e publicação de combos revisados.
- Testes de uso real com múltiplos usuários, políticas de privacidade e termos de venda.

**A publicação no GitHub Pages requer habilitar a origem GitHub Actions nas configurações de Pages. O protótipo ainda não está conectado ao Supabase.**