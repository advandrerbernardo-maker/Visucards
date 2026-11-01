# VISUCARDS 0.8 | Ativação segura da IA

A interface e o código da integração já foram implementados. **A IA não está ativa no site publicado enquanto `ai-config.js` estiver vazio.** O aplicativo continua gerando cards localmente, sem enviar trechos para IA.

## Infraestrutura exclusiva

O único projeto Supabase conectado à conta durante a implementação era o **Recebi-plus**. **Não usar esse projeto para o VISUCARDS.** Criar um projeto próprio, após escolher organização e conferir possíveis custos de infraestrutura.

No projeto dedicado:

1. Conferir o plano e os custos da conta Supabase; não ativar recursos pagos sem autorização.
2. Habilitar Supabase Auth com confirmação de e-mail e domínio/site URL `https://advandrerbernardo-maker.github.io/Visucards/`, incluindo essa URL nos redirects permitidos. Considerar CAPTCHA e limites contra contas abusivas.
3. Executar `backend/ai_usage.sql` **somente nesse projeto**. Esse script cria a tabela e a função de reserva de cota atômica de dez chamadas de IA por usuário autenticado a cada dia UTC. A tabela tem RLS ativo e usuários comuns não possuem leitura/escrita.
4. Configurar o segredo **GROQ_API_KEY** na lista de secrets da Edge Function. Não colocar a chave em arquivos públicos, no GitHub Pages ou no JavaScript do navegador. O modelo padrão é `openai/gpt-oss-20b` na API Groq.
5. Implantar a função de `supabase/functions/visucards-ai/index.ts` com o nome `visucards-ai` e `verify_jwt=true`. Verificar comportamento com usuário confirmado, usuário anônimo, resposta inválida do modelo e cota esgotada.
6. Em `ai-config.js`, informar **somente** a URL pública do projeto e a *publishable key* pública. A função exige sessão JWT de usuário e faz uma segunda verificação com Supabase Auth; a publishable key **não** é um segredo.
7. Confirmar que a integração está ativa e os testes end-to-end passam antes de anunciar IA disponível a usuários.

## Comportamento do aplicativo

- Fluxo básico preservado: PDF → estilo → gerar cards. O login por e-mail é um campo **opcional e recolhido**, visível somente com backend configurado.
- Sem login, configuração ou com falha do serviço, o app produz cards **locais** e informa a origem local.
- Quando a sessão está ativa, a cada geração envia **até dois trechos com até 650 caracteres por trecho**, título e número de página. **Não envia o PDF inteiro.**
- O modelo sugere o título e um esquema `flow`, `steps`, `compare` ou `timeline`, com rótulos **copiados literalmente** de dentro dos trechos. O servidor e o navegador verificam os rótulos antes de montar o SVG.
- O texto integral do trecho, sua fonte e a página **sempre vêm do PDF**, não da resposta da IA. Nenhuma jurisprudência, interpretação ou estatística de cobrança é fabricada.
- A ilustração é um **diagrama SVG orientado pelo modelo**, não uma imagem fotográfica gerada por IA. Usar geração de imagens separada exigiria outro serviço, controles de custo e validações.
- A identidade visual oficial v0.5 e os três acabamentos ficam intocados. Os diagramas funcionam no card, na impressão e no PNG.
- Cards antigos, backups e revisões continuam disponíveis. O campo `visualPlan` é opcional, permitindo restaurar bibliotecas antigas.

## Segurança e limites

- Não permitir chamadas diretas do site ao provedor Groq; a chave fica no servidor.
- O servidor aceita exclusivamente a origem oficial GitHub Pages e valida autenticação, tamanho, páginas, quantidade, identificadores, cota e saída do modelo.
- A reserva de cota ocorre **antes** da chamada ao provedor, inclusive quando o provedor falha, para evitar custos descontrolados.
- A cota é de **10 solicitações por dia e por conta confirmada**, mas isso **não substitui** limites de gasto na conta Groq, CAPTCHA, antifraude e observabilidade antes da oferta comercial.
- O aplicativo público não deve processar documentos confidenciais: ao ativar a IA, trechos selecionados serão enviados ao Supabase e à Groq. Avisar os usuários e atualizar a política de privacidade.
- A tabela de uso não guarda o conteúdo de documentos. A função não registra textos em logs, mas a retenção e o tratamento pelo provedor de IA seguem as condições do serviço.
- `backend/schema_preparacao.sql` também é apenas uma proposta de banco e **não foi aplicado**.

## Verificação local e publicação

```bash
node --test tests/*.test.cjs
```

O GitHub Actions copia `ai-cards.js` e `ai-config.js` para o site estático. Os arquivos de backend e SQL **não são publicados no GitHub Pages**. Implantá-los no Supabase é uma operação independente e posterior.

Documentação oficial consultada: https://supabase.com/docs/guides/functions/auth, https://supabase.com/docs/guides/functions/cors e https://console.groq.com/docs/api-reference.
