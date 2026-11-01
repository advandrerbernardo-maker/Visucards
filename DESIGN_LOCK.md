# VISUCARDS | Padrão visual oficial bloqueado

**Versão de referência:** 0.5 (1º de novembro de 2026)  
**Branch de recuperação:** `design-locked-v0.5`  
**Commit de referência:** `53e5e3f5fed69dc31e26511a8951dd2ae0249d96`

## Decisão do projeto

O design editorial ilustrado do VISUCARDS 0.5 é o **padrão oficial e permanente até que o responsável solicite uma alteração explícita**. Melhorias de conteúdo, detecção de assuntos, desempenho, segurança, IA, exportação e compatibilidade devem se integrar a esse desenho, sem simplificá-lo, substituí-lo ou mudar sua identidade visual.

Não confundir o bloqueio de **layout** com bloqueio de funcionalidades: a aplicação continua evoluindo.

## Componentes que precisam ser mantidos

- Cabeçalho escuro com marca VISUCARDS, título destacado e identificação do tipo de conteúdo.
- Faixa ilustrada de apoio ao assunto e resumo visual do foco.
- Corpo organizado em trecho central, complementos numerados, dados essenciais (artigos, prazos, exceções), nota de revisão e fonte.
- Tipografia legível, cores coerentes, espaçamento amplo, responsividade e altura adaptada ao texto sem sobreposição ou cortes.
- Três acabamentos atuais: **Caderno ilustrado**, **Quadrinhos** e **Minimalista**. A escolha do usuário deve continuar disponível e o padrão inicial deve continuar Caderno ilustrado.
- Exportação em PNG e impressão/PDF devem preservar a identidade, os elementos e a leitura do card.
- A leitura e o destaque não devem inventar fatos, artigos, prazos ou incidência de provas não presentes nas fontes.

## Proteção técnica

O arquivo `tests/design-lock.test.cjs` verifica uma impressão digital do CSS `premium-card-style` e da estrutura `cardMarkup`, além de conferir componentes essenciais e os estilos disponíveis.

**Não atualizar as impressões digitais do teste apenas para fazê-lo passar.** Se um ajuste visual indispensável for solicitado, demonstrar o resultado, obter autorização para mudar o padrão e só então atualizar o bloqueio de modo consciente.

Novas ilustrações, recursos de IA e mecanismos de extração podem ser adicionados sem mexer no modelo visual já aprovado. Para recuperar a referência, consulte a branch `design-locked-v0.5`; ela contém os arquivos da versão escolhida.

## Teste rápido de regressão

1. Abrir o aplicativo em celular e computador.
2. Clicar em **Ver demonstração** e conferir os três acabamentos.
3. Verificar todos os textos, fontes e marcadores sem corte.
4. Exportar PNG e PDF e comparar a hierarquia visual.
5. Rodar `node --test tests/*.test.cjs` antes da publicação.

O bloqueio é de projeto, respaldado por testes e branch de referência. Não é uma proteção de branch contra administradores: alguém com permissão de escrita ainda pode deliberadamente alterá-lo.
