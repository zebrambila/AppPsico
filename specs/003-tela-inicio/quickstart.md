# Quickstart: Validando a Tela de Início

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Sobre contratos de interface

Esta funcionalidade não expõe nenhuma API, CLI ou endpoint — é uma tela de um app
mobile consumida apenas pela própria usuária dentro do app. Por isso não há diretório
`contracts/`; a validação é feita executando o app e observando o comportamento na
tela, como descrito abaixo.

## Pré-requisitos

- Dependências instaladas (`npm install` ou equivalente já configurado no projeto).
- `expo-network` instalado via `npx expo install expo-network` (ver `research.md`,
  Decisão 1) antes de implementar o bloqueio offline.
- Uma conta de teste já autenticada (fora do escopo desta funcionalidade — ver spec
  002) para alcançar a tela de Início.

## Comandos

```bash
npx expo lint        # DEVE passar sem erros antes de considerar a tarefa concluída
npx tsc --noEmit      # DEVE passar sem erros antes de considerar a tarefa concluída
npx expo start        # inicia o servidor de desenvolvimento para validação manual
```

## Cenários de validação manual

Execute o app (Expo Go ou simulador/emulador) e entre na tela de Início (aba
"Início") para cada cenário:

1. **Resumo do dia (US1, FR-001/FR-002)**
   - Confirme a saudação com o primeiro nome da usuária e a data de hoje.
   - Confirme a contagem de sessões do dia e quantas já foram realizadas.

2. **Valor a receber mascarado (FR-003, FR-016)**
   - Ao abrir a tela, o valor total a receber deve aparecer oculto (ex.: `••••`), não
     o número.
   - Toque no controle de revelar: o valor real (`moeda()`) deve aparecer.
   - Navegue para outra aba e volte para "Início": o valor deve voltar a aparecer
     oculto (reset por foco, não lembrado).

3. **Destaque de próxima sessão mascarado (FR-004, FR-016)**
   - Com uma sessão confirmada/pendente marcada para hoje, confirme que horário,
     paciente, modalidade e duração aparecem, mas o valor da sessão aparece oculto até
     tocar para revelar.
   - Toque em "Abrir ficha" e "Registrar" e confirme que levam à ficha do paciente
     correto e à tela de registro da sessão correta (US2).

4. **Atualização automática da próxima sessão (FR-015)**
   - Em ambiente de desenvolvimento, ajuste temporariamente o horário de uma sessão em
     `src/data/mock.ts` para poucos minutos no futuro (ou ajuste o relógio do
     dispositivo/simulador) e permaneça na tela de Início sem navegar.
   - Confirme que, quando esse horário passa, o destaque troca para a próxima sessão
     elegível automaticamente, sem precisar sair e voltar à tela.

5. **Pendências do dia (US3, FR-009–FR-011)**
   - Com uma sessão de hoje em status `pendente`, confirme que ela aparece na seção de
     pendências com um botão "Confirmar"; tocar nele deve atualizar o status e mostrar
     confirmação visual.
   - Com nenhuma sessão pendente e nenhum pagamento em aberto, confirme que a seção
     mostra o indicador de "tudo em dia" em vez de aparecer vazia.

6. **Bloqueio offline (FR-014)**
   - Ative o modo avião (ou desligue o Wi-Fi/dados) no dispositivo/simulador e abra ou
     permaneça na tela de Início.
   - Confirme que o conteúdo da tela é bloqueado e uma mensagem de erro pedindo
     conexão é exibida, em vez de dados desatualizados ou uma tela em branco.
   - Reative a conexão e confirme que o conteúdo normal volta a aparecer.

7. **Estados vazios (Edge Cases, SC-004)**
   - Sem nenhuma sessão, pendência ou pagamento em aberto no dia, confirme que cada
     seção relevante mostra uma mensagem de estado vazio compreensível (não uma área
     em branco).

## Critério de aceite da fase de implementação

A funcionalidade está pronta para revisão quando todos os 7 cenários acima passarem
manualmente **e** `npx expo lint` + `npx tsc --noEmit` estiverem limpos, conforme o
Princípio II da Constituição.
