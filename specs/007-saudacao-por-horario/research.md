# Research: Saudação por horário

## Decisão 1 — Fonte do horário
- **Decision**: `new Date().getHours()` (relógio local do dispositivo).
- **Rationale**: FR-006 exige funcionar offline e refletir fuso/horário do dispositivo. O `hoje` do `AppStore` representa a data da agenda, não o relógio, e não deve ser usado.
- **Alternatives**: horário do servidor (Supabase) — rejeitado: exige rede e ignora o fuso do usuário.

## Decisão 2 — Atualização enquanto o app está aberto
- **Decision**: `setInterval` de 10 minutos para forçar recálculo (mesmo mecanismo de `useProximaSessao`, que usa 30 s).
- **Rationale**: Atende SC-003 (≤ 10 min) com mecanismo já aceito no código; a saudação não exige precisão de segundos; sem agendar timers exatos nas fronteiras (complexidade desnecessária, Princípio V).
- **Alternatives**: `setTimeout` até a próxima fronteira — rejeitado: mais código e frágil com mudança de relógio.

## Decisão 3 — Retorno do segundo plano
- **Decision**: ouvir `AppState` ("change" → "active") e recalcular imediatamente; remover o listener no cleanup.
- **Rationale**: Timers JS ficam suspensos em segundo plano; sem isso a saudação poderia ficar velha por até 10 min após voltar, contrariando "imediatamente" em SC-003.
- **Alternatives**: depender só do intervalo — rejeitado pelo motivo acima.

## Decisão 4 — Onde fica a lógica
- **Decision**: hook `src/hooks/useSaudacao.ts` com função de faixa interna.
- **Rationale**: Único consumidor (Início); evita utilitário compartilhado prematuro.
- **Alternatives**: helper em `src/lib/format.ts` — desnecessário com um só chamador.

Nenhum item `NEEDS CLARIFICATION` pendente.
