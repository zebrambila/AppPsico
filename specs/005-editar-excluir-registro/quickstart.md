# Quickstart: Validando Editar e Excluir (Individual e em Lote) Registro de Sessão

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **Contratos**: [contracts/migracao-exclusao-logica.sql](./contracts/migracao-exclusao-logica.sql)

## Sobre contratos de interface

Esta funcionalidade não expõe nenhuma API nova — é uma correção e extensão de telas
já existentes do app mobile, consumidas apenas pela própria usuária. O único
`contracts/` desta spec é a migração de schema desta revisão (exclusão lógica
universal), não uma interface de rede.

## Pré-requisitos

- Dependências da spec 004 já aplicadas (schema do Supabase com as 4 tabelas e RLS).
- **Nesta revisão (Parte 4)**: aplicar
  [contracts/migracao-exclusao-logica.sql](./contracts/migracao-exclusao-logica.sql)
  no SQL Editor do Supabase antes de testar qualquer cenário de exclusão abaixo —
  sem isso, as colunas `excluido`/`excluida` não existem e as ações de exclusão
  falham. (A migração da Parte 3, `migracao-cascata.sql`, nunca foi aplicada e foi
  removida desta spec — não há nada dela para desfazer.)
- Uma conta de psicóloga autenticada com pelo menos um paciente cadastrado.

## Comandos

```bash
npx expo lint        # DEVE passar sem erros antes de considerar a tarefa concluída
npx tsc --noEmit      # DEVE passar sem erros antes de considerar a tarefa concluída
npx expo start        # inicia o servidor de desenvolvimento para validação manual
```

## Cenários de validação manual

1. **Prefill correto ao reabrir um registro (FR-001)**
   - Registre uma sessão como realizada, com pagamento e uma anotação de teste.
   - Reabra o registro dessa sessão (ex.: pela Agenda) e confirme que presença,
     status de pagamento, método e o texto da anotação aparecem preenchidos com o que
     foi salvo — nenhum campo em branco.
   - Repita registrando uma sessão como "Remarcou" e confirme que reabrir mostra
     "Remarcou" selecionado, não "Compareceu".

2. **Editar sem duplicar (FR-002, FR-003, FR-004, SC-002)**
   - A partir do cenário 1, altere o método de pagamento e o texto da anotação, e
     salve.
   - Confirme no resumo financeiro do paciente que há apenas um lançamento para essa
     sessão (atualizado, não duplicado).
   - Confirme no prontuário do paciente que há apenas uma anotação para essa sessão
     (com o texto novo, não duas anotações).

3. **Excluir uma sessão sem nenhum vínculo (US2, FR-005, FR-006)**
   - Agende uma sessão nova (ainda não registrada) e, sem registrá-la, use a opção de
     excluir na tela de registro.
   - Confirme a exclusão quando solicitado.
   - Confirme que a sessão some da agenda, do início e da ficha do paciente.

4. **Exclusão lógica em cascata: sessão, lançamento e nota todos marcados, nada apagado (US2, FR-006, FR-007, SC-003, SC-008)**
   - Use a sessão do cenário 1 (já tem anotação e lançamento).
   - Exclua-a pela tela de registro e confirme — a confirmação deve avisar que o
     lançamento e a anotação vinculados também serão marcados como excluídos.
   - Confirme no resumo financeiro do paciente que o lançamento **não aparece mais**
     em lugar nenhum.
   - Confirme na aba "Prontuário" da ficha do paciente que a anotação **não aparece
     mais**. Com acesso direto ao banco (SQL Editor do Supabase), confirme que as
     linhas da sessão, do lançamento e da nota continuam existindo nas tabelas
     `sessoes`, `lancamentos` e `notas`, com `excluida`/`excluido = true` e todo o
     conteúdo (`texto`, `valor`, etc.) intacto — nenhuma foi apagada.

5. **Remover só o lançamento financeiro, sem excluir a sessão (US3, FR-008, SC-004)**
   - Registre uma nova sessão com pagamento marcado por engano.
   - Use a opção de remover especificamente o lançamento financeiro e confirme.
   - Confirme que o valor some do resumo financeiro, mas a sessão continua intacta e
     registrada. No banco, a linha do lançamento continua existindo com
     `excluido = true`.

6. **Bloqueio offline (FR-009)**
   - Ative o modo avião.
   - Tente editar, excluir uma sessão, excluir um paciente, excluir uma nota, ou
     remover um lançamento.
   - Confirme que cada ação falha imediatamente com uma mensagem clara pedindo
     conexão, sem alterar nada.

7. **Exclusão em lote de sessões, todas sempre marcadas (US4, FR-010, FR-011, FR-012, SC-005, SC-006)**
   - No dia aberto na Agenda, crie várias sessões de teste, pelo menos uma com
     anotação e/ou lançamento vinculado.
   - Entre no modo de seleção da Agenda, selecione todas, e confirme a exclusão em
     lote.
   - Confirme que **todas** as sessões selecionadas somem de todas as listas, que os
     lançamentos vinculados a elas somem do financeiro, e que qualquer anotação
     vinculada some do prontuário — tudo marcado como excluído, nada apagado
     (mesma verificação no banco do cenário 4).

8. **Remoção em lote de lançamentos (US5, FR-013, SC-007)**
   - Na tela Financeiro, registre 2 lançamentos de teste.
   - Entre no modo de seleção, selecione os 2, e confirme a remoção em lote
     (a confirmação deve mostrar a quantidade e o valor total).
   - Confirme que ambos somem dos resumos financeiros, sem afetar as sessões
     vinculadas a eles.

9. **Excluir um paciente com cascata completa (US6, FR-015, FR-016, SC-009) — NOVO**
   - Cadastre um paciente de teste e registre para ele pelo menos uma sessão
     (realizada, com lançamento e anotação).
   - Na ficha do paciente, use a opção "Excluir" e confirme — a confirmação deve
     avisar que todo o histórico (sessões, lançamentos, notas) também será afetado.
   - Confirme que o paciente some da lista de Pacientes, suas sessões somem da
     Agenda e do Início, seu lançamento some do Financeiro, e tudo isso sem conseguir
     mais acessar a ficha dele pela interface normal.
   - No banco, confirme que a linha do paciente e todas as linhas de sessões,
     lançamentos e notas vinculadas a ele continuam existindo, todas com a coluna de
     exclusão lógica em `true`.

10. **Excluir uma nota de prontuário individualmente (US7, FR-017) — NOVO**
    - Registre uma sessão com uma anotação de teste.
    - Na aba "Prontuário" da ficha do paciente, use a opção de excluir essa nota
      específica e confirme.
    - Confirme que a nota some do prontuário, mas a sessão e o lançamento vinculados
      (se houver) continuam intactos e visíveis normalmente.
    - Reabra o registro dessa mesma sessão e escreva uma nova anotação; salve.
      Confirme que uma nota **nova** aparece no prontuário (não a antiga "ressuscitada"
      com o novo texto) — no banco, a nota antiga continua com `excluida = true` e seu
      texto original intacto.

## Critério de aceite da fase de implementação

A funcionalidade está pronta para revisão quando os 10 cenários acima passarem
manualmente **e** `npx expo lint` + `npx tsc --noEmit` estiverem limpos.
