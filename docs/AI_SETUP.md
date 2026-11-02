# VISUCARDS 0.8 | Ativação segura da IA

## Situação confirmada em 1º de novembro de 2026

- **Projeto:** VISUCARDS, ID `cuzqfjmjfozfngrahkzz`, organização **Recebi Plus**, região **São Paulo (sa-east-1)**, status `ACTIVE_HEALTHY`.
- **Custo de criação informado pelo Supabase:** 0 por mês para o projeto criado no plano Free. O plano é sujeito aos limites do Supabase e não abrange despesas eventuais do provedor de IA.
- **Banco:** migração `visucards_ai_daily_usage_and_quota` aplicada neste projeto em 2026-11-02 UTC, com RLS e tabela `public.visu_ai_daily_usage`.
- **Acesso:** `anon` e `authenticated` não possuem permissão para leitura/escrita da tabela nem para executar `visu_ai_reserve`. Apenas `service_role` chama a função; ela é `security invoker`.
- **Backend:** Edge Function `visucards-ai` publicada e atualizada para aceitar a página original de documentos com mais de 15 páginas, status `ACTIVE`, `verify_jwt=true`.
- **Site:** `ai-config.js` inclui apenas a URL e a *publishable key* públicas do projeto VISUCARDS. `enabled:false` impede chamadas de IA até a ativação final.
- **Recebi-plus:** projeto separado, nenhuma tabela ou função alterada nele.

## Falta concluir antes de ativar a IA

Estas duas configurações são feitas pelo responsável dentro dos respectivos painéis, porque as ferramentas conectadas não permitem inserir secrets nem alterar Auth > URL Configuration diretamente.

1. **Groq:** obter a chave em [Groq Console](https://console.groq.com/keys) e conferir se o plano oferece cota gratuita suficiente para os testes. Não enviar a chave por chat e não inserir no GitHub.
2. **Supabase VISUCARDS:** no [painel deste projeto](https://supabase.com/dashboard/project/cuzqfjmjfozfngrahkzz), entrar em **Edge Functions > Secrets**, adicionar a variável `GROQ_API_KEY` com a chave da Groq e salvar. Se já existir, conferir se corresponde a uma chave ativa. Ela será disponibilizada à Edge Function sem precisar republicar o código.
3. **Supabase Auth:** em **Authentication > URL Configuration**, alterar a **Site URL** para `https://advandrerbernardo-maker.github.io/Visucards/` e incluir o mesmo endereço nos **Redirect URLs** permitidos. Em **Authentication > Providers**, verificar que o login por e-mail está habilitado e há confirmação de e-mail; revisar os limites do provedor de e-mails.
4. **Testes reais:** criar sessão com e-mail confirmado e testar até dois trechos de PDF sem dados sensíveis; conferir retorno JSON, SVG fiel ao texto, funcionamento no navegador móvel, exportação PNG/PDF, comportamento quando houver erro e bloqueio por cota. Testar também chamadas sem sessão e com usuário anônimo. Habilitar proteções adicionais contra abuso antes de abrir a IA ao público.
5. **Ativação:** somente depois desses testes alterar `enabled: false` para `enabled: true` em `ai-config.js`, publicar novamente o GitHub Pages e confirmar a integração ponta a ponta.

## Como funciona

O fluxo permanece **PDF → escolha do estilo → gerar cards**, sem CSV. No modo de testes, é possível enviar PDFs sem limite mensal, com **até 50 MB e sem limite de páginas por arquivo**, processando 15 páginas por vez. O leitor é local por padrão. Quando a IA estiver ativada e o usuário autenticar por e-mail, somente **até dois trechos de 650 caracteres cada** (com título, identificador e página) serão transmitidos ao Supabase e ao provedor Groq, não o PDF integral. A IA sugere estrutura visual e rótulos; o servidor e o navegador exigem rótulos literais do texto. O conteúdo original e a página continuam vindo do PDF.

Em caso de falha de autenticação, de servidor ou de provedor, o app usa diagramas locais; não envia documentos inteiros. A função reserva no máximo **dez solicitações de IA por dia UTC** por conta, mesmo se o provedor falhar, para limitar custos e abusos. O limite não substitui um orçamento máximo no provedor.

**Os diagramas de IA são SVGs organizados em fluxo, etapas, contraste e linha do tempo, não fotografias criadas por modelo de imagem.** Os três estilos visuais aprovados em 0.5, backups, biblioteca local e exportações são preservados.

Não processar documentos sigilosos neste protótipo. Verificar as condições do provedor e atualizar a política de privacidade antes de coletar materiais de usuários.

## Comandos e referências

Testes de código: `node --test tests/*.test.cjs`.

- Código da função: `supabase/functions/visucards-ai/index.ts`.
- SQL de cota aplicado: `backend/ai_usage.sql`.
- Configuração pública e flag: `ai-config.js`.
- O esquema comercial `backend/schema_preparacao.sql` continua **não instalado**; não confundir com a tabela de cota de IA.
- [Documentação Supabase de secrets](https://supabase.com/docs/guides/functions/secrets).
- [Documentação Supabase de redirecionamento de login](https://supabase.com/docs/guides/auth/redirect-urls).
- [Documentação Groq](https://console.groq.com/docs/api-reference).
