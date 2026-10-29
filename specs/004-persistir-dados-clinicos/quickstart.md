# Quickstart: Validando a Persistência Real de Pacientes, Sessões e Financeiro

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **Contratos**: [contracts/schema.sql](./contracts/schema.sql), [contracts/app-store.md](./contracts/app-store.md)

## Pré-requisitos

1. Projeto Supabase já configurado para autenticação (spec 002), com `EXPO_PUBLIC_SUPABASE_URL`
   e `EXPO_PUBLIC_SUPABASE_ANON_KEY` definidos (ver `.env.example`).
2. Executar o script [contracts/schema.sql](./contracts/schema.sql) uma vez no SQL
   Editor do painel do Supabase (cria as 4 tabelas, índices e políticas de RLS).
3. Pelo menos duas contas de psicóloga já cadastradas (spec 002), para validar o
   isolamento entre contas (cenário 3 abaixo).

## Comandos

```bash
npx expo lint        # DEVE passar sem erros antes de considerar a tarefa concluída
npx tsc --noEmit      # DEVE passar sem erros antes de considerar a tarefa concluída
npx expo start        # inicia o servidor de desenvolvimento para validação manual
```

## Cenários de validação manual

Execute o app com a Conta A autenticada, salvo onde indicado o contrário.

1. **Cadastrar e persistir um paciente (US1, FR-001)**
   - Na aba Pacientes, toque em "+ Novo" e preencha o formulário.
   - Confirme que o paciente aparece na lista.
   - Encerre e reabra o app (ou saia e entre de novo): o paciente continua lá, com os
     mesmos dados.

2. **Editar um paciente (US1, FR-002)**
   - Abra a ficha de um paciente existente, edite um campo (ex.: valor da sessão).
   - Confirme que a mudança aparece na ficha e em qualquer lugar que mostre esse valor
     (ex.: destaque de próxima sessão na tela de Início).
   - Reabra o app: a mudança persiste.

3. **Isolamento entre contas (US1, FR-003, SC-002)**
   - Com a Conta A, cadastre um paciente.
   - Saia e entre com a Conta B.
   - Confirme que o paciente da Conta A não aparece na lista de Pacientes da Conta B,
     nem é possível acessá-lo digitando a URL/rota da ficha dele diretamente.

4. **Agendar e progredir uma sessão real (US2, FR-004, FR-005)**
   - Na ficha de um paciente real, toque em "Agendar", crie uma sessão para hoje.
   - Confirme que ela aparece na Agenda e na tela de Início.
   - Confirme a sessão, depois registre-a como realizada.
   - Reabra o app: o status final persiste.

5. **Pagamento e nota ao registrar sessão (US3, FR-006, FR-008)**
   - Ao registrar a sessão do cenário 4 como realizada, marque o pagamento como feito
     e escreva uma nota de atendimento.
   - Confirme que o lançamento aparece no resumo financeiro do paciente e que a nota
     aparece na aba "Prontuário" da ficha dele.
   - Reabra o app: lançamento e nota persistem.

6. **Marcar como pago posteriormente (US3, FR-007)**
   - Registre uma sessão como realizada sem marcar pagamento (fica em aberto).
   - Na tela Financeiro, use a nova ação "Marcar como pago" (distinta de "Cobrar") no
     lançamento em aberto, informando o método.
   - Confirme que o lançamento passa a "Pago" e some do total "a receber".

7. **Bloqueio de exclusão de paciente com histórico (FR-009, SC-003)**
   - Tente excluir o paciente usado nos cenários 4–6 (que já tem sessão/lançamento/nota).
   - Confirme que a exclusão é rejeitada com uma mensagem clara, e que o paciente
     continua na lista ativa com todo o histórico intacto.
   - Cadastre um paciente novo sem nenhuma sessão/lançamento/nota e confirme que esse
     sim pode ser excluído normalmente.

8. **Bloqueio de escrita offline (FR-010)**
   - Ative o modo avião.
   - Tente cadastrar um paciente, agendar uma sessão, ou marcar um pagamento.
   - Confirme que cada ação falha imediatamente com uma mensagem clara pedindo
     conexão, sem criar nenhum registro parcial (verificável reconectando e
     confirmando que nada "meio salvo" apareceu).

## Critério de aceite da fase de implementação

A funcionalidade está pronta para revisão quando os 8 cenários acima passarem
manualmente **e** `npx expo lint` + `npx tsc --noEmit` estiverem limpos, conforme o
Princípio II da Constituição.
