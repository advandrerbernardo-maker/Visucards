# Backend VISUCARDS: preparação, ainda não instalada

O arquivo `schema_preparacao.sql` reserva tabelas para biblioteca, revisão espaçada,
catálogo, combos avulsos, assinatura Premium e cotas mensais.

**Não foi criado Supabase para o VISUCARDS. O Recebi+ não foi alterado.**

Antes de executar:
1. Criar um projeto exclusivo do VISUCARDS, conferindo o custo e autorizando-o.
2. Aplicar a estrutura em ambiente de testes e validar RLS com dois usuários diferentes.
3. Configurar Auth e sincronização de cards, sem perder o backup local.
4. Criar serviço backend para validar o PDF e controlar cotas de geração de forma atômica.
5. Verificar pagamento via webhook confiável antes de inserir direitos nas tabelas de assinatura e combos.
6. Testar com contas gratuitas, Premium, compra avulsa, assinatura cancelada e acesso expirado.

O banco não concede ao navegador permissão de gravar consumo, assinaturas nem acessos pagos.
Nenhuma chave secreta ou `service_role` deve ser exposta em GitHub Pages.

**Aviso**: arquivo preparatório; o SQL ainda não passou por execução num PostgreSQL Supabase real.