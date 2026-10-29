# Phase 0 Research: Tela de Início (Painel do Dia)

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nenhum item do Technical Context ficou marcado como `NEEDS CLARIFICATION` — a spec já
passou por duas rodadas de `/speckit-clarify` que resolveram as decisões de maior
impacto (offline, privacidade de valores financeiros, atualização em tempo real). Esta
pesquisa cobre as decisões técnicas necessárias para implementar essas decisões dentro
das restrições da Constituição do projeto (Expo managed workflow, Expo Go, sem
abstração especulativa).

## Decisão 1: Detecção de conectividade para o bloqueio offline (FR-014)

- **Decision**: Usar o módulo oficial `expo-network` (hook `useNetworkState()`),
  tratando `isConnected === false || isInternetReachable === false` como "sem
  conexão" e, nesse caso, renderizar um estado de bloqueio em vez do conteúdo da tela.
- **Rationale**: É o módulo recomendado pela Expo para este propósito, confirmado via
  documentação versionada da SDK em uso
  (`https://docs.expo.dev/versions/v58.0.0/sdk/network/`, consultada nesta sessão de
  planejamento em vez de depender de memória, por exigência do `AGENTS.md`). A
  documentação confirma que o módulo está **incluído no Expo Go**, então nenhum
  development build passa a ser necessário só por esta funcionalidade (Princípio I/IV
  da Constituição). O hook já expõe atualização automática em mudanças de estado de
  rede, sem necessidade de gerenciar listeners manualmente.
- **Alternatives considered**:
  - `@react-native-community/netinfo` — biblioteca de terceiros amplamente usada, mas
    rejeitada porque a Constituição pede preferência por módulos Expo oficiais quando
    a capacidade já existe (`expo-network` cobre o caso).
  - Checagem via requisição de rede a um endpoint próprio ("ping") — rejeitada por
    adicionar uma dependência de rede e complexidade operacional desnecessárias para
    uma tela cujos dados hoje são locais; o requisito pede apenas detectar
    conectividade do dispositivo, não a saúde de um serviço.

## Decisão 2: Reset do estado de "valor revelado" a cada abertura da tela (FR-016)

- **Decision**: Guardar a visibilidade de cada valor mascarado em estado local do
  componente da tela (`useState`), e resetá-lo para "oculto" dentro de um
  `useFocusEffect` (re-exportado por `expo-router`, equivalente ao do
  `@react-navigation/native`), que dispara toda vez que a tela de Início recebe foco —
  cobrindo tanto a troca de abas quanto reabrir o app.
- **Rationale**: A navegação por abas do Expo Router (`Tabs`, ver
  `src/app/(tabs)/_layout.tsx`) mantém as telas montadas ao trocar de aba por padrão
  (não há `unmountOnBlur`); um `useState` comum não seria suficiente para resetar ao
  simplesmente trocar de aba e voltar. `useFocusEffect` resolve isso sem exigir mudar a
  configuração de navegação nem desmontar a tela a cada troca de aba (o que teria custo
  de performance/UX maior do que o necessário).
- **Alternatives considered**:
  - Persistir a preferência em `AsyncStorage`/`expo-secure-store` — rejeitada
    explicitamente pela clarificação (a usuária decidiu que o padrão deve resetar
    sempre, nunca lembrar entre aberturas); persistir seria contrariar o requisito.
  - Guardar o estado no `AppStore` (contexto global) — rejeitada: visibilidade de
    valor é uma preocupação puramente de apresentação local a esta tela, não precisa
    ser compartilhada com Agenda/Pacientes/Financeiro (Princípio V, sem abstração
    compartilhada prematura).

## Decisão 3: Atualização automática do destaque de "próxima sessão" (FR-015)

- **Decision**: Introduzir um estado de "agora" atualizado por um `setInterval` (ex.:
  a cada 30s, limpo no `unmount`/`blur`), usado para recalcular qual sessão do dia é a
  "próxima" elegível (confirmada ou pendente), reaproveitando o filtro já existente em
  `inicio.tsx`/`selectors.ts` (`sessoesDoDia` + `find`).
- **Rationale**: Satisfaz o requisito de que a tela se atualize sozinha enquanto
  permanece aberta, sem depender de a usuária sair e voltar. Um intervalo de ~30s é
  granularidade suficiente para sessões marcadas em minutos, sem gerar re-renders
  excessivos.
- **Alternatives considered**:
  - Recalcular apenas em `useFocusEffect` (ao focar a tela) — rejeitada: não cobre o
    caso explícito da clarificação em que a usuária permanece na tela parada quando o
    horário da sessão em destaque passa.
  - Mover o relógio para o `AppStore` global — rejeitada: nenhuma outra tela precisa
    hoje de um "agora" ticking; manter local a `inicio.tsx` (ou a um hook dedicado
    `useProximaSessao`) evita acoplamento novo sem necessidade comprovada.

## Decisão 4: Componente de valor mascarado reutilizável

- **Decision**: Criar um componente de apresentação pequeno (`ValorMascarado`) que
  recebe o valor numérico já formatado (via `moeda()`) e um estado de
  visível/oculto + callback de toggle, usado nos dois pontos da tela que exibem
  dinheiro: o valor a receber (FR-003) e o valor da sessão em destaque (FR-004).
- **Rationale**: Dois usos reais e idênticos no comportamento (mascarar com `••••`,
  alternar com um controle tocável) justificam extrair um componente, em vez de
  duplicar a lógica de toggle duas vezes — mas sem ir além disso (não é um "sistema de
  campos sensíveis" genérico, é só o que as duas ocorrências desta tela precisam).
- **Alternatives considered**:
  - Duplicar a lógica de máscara inline nos dois lugares — rejeitada: geraria duas
    implementações do mesmo comportamento de toggle que precisariam ser mantidas em
    sincronia manualmente.
  - Um sistema genérico de "campo sensível" configurável para todo o app — rejeitado
    por ir além do que a spec pede agora (Princípio V); nenhuma outra tela tem esse
    requisito hoje.

## Saída

Todas as incertezas técnicas do Technical Context foram resolvidas. Nenhum
`NEEDS CLARIFICATION` permanece. Pronto para a Fase 1 (data-model.md, quickstart.md).
