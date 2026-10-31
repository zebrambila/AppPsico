# Quickstart: Validar o scroll automático com teclado

Guia manual para confirmar que a funcionalidade funciona de ponta a ponta. Não há testes
automatizados neste repositório (ver `research.md`/`plan.md`), então esta é a forma de
verificação exigida pela constituição antes de reportar a tarefa como concluída.

## Pré-requisitos

- Dependências instaladas (`npm install` / conforme o gerenciador do projeto).
- `npx expo lint` e `npx tsc --noEmit` passando sem erros.
- Um simulador iOS e um emulador/dispositivo Android disponíveis (User Story 3 exige
  checar as duas plataformas).

## Rodar o app

```bash
npx expo start
```

Abra no simulador iOS (tecla `i`) e, em outra sessão, no emulador Android (tecla `a`),
ou em dois dispositivos físicos via Expo Go.

## Cenários de validação (mapeados às Acceptance Scenarios da spec)

1. **Campo inferior fica visível ao focar (User Story 1, cenário 1)**
   - Login → entrar com uma conta de teste → ir em **Pacientes → + Novo paciente**.
   - Tocar no campo **Telefone** (último campo do formulário, antes do botão Salvar).
   - Esperado: o campo e seu rótulo ficam visíveis acima do teclado, sem colar na borda
     superior do teclado nem ficarem escondidos atrás dele.

2. **Scroll acompanha a troca de foco (User Story 1, cenário 2)**
   - Na mesma tela, tocar em **Nome completo** e depois usar "próximo"/tocar em
     **Horário fixo**, depois **Telefone**.
   - Esperado: a cada troca de campo, a tela ajusta o scroll para manter o novo campo
     focado visível, sem saltos abruptos.

3. **Tocar fora fecha o teclado (User Story 1, cenário 3)**
   - Com o teclado aberto em qualquer campo do formulário de paciente, tocar em uma área
     vazia da tela (não em um campo, botão ou pill).
   - Esperado: o teclado fecha; os botões/pills continuam funcionando normalmente com um
     único toque (não exigem dois toques).

4. **Botão de ação acessível com o teclado aberto (User Story 2)**
   - Em **Pacientes → + Novo paciente**, focar o campo **Telefone** (teclado aberto) e
     rolar manualmente até o botão **Cadastrar paciente**.
   - Esperado: o botão fica visível e clicável, não fica sob o teclado.
   - Repetir em **Sessão → Registrar sessão** (anotações da sessão) e em
     **Sessão → Nova sessão** (campo Valor) até o botão **Agendar sessão**/
     **Salvar registro**.

5. **Sem espaço em branco quando o teclado está fechado (Edge case)**
   - Abrir **Editar paciente** para um paciente existente, sem tocar em nenhum campo.
   - Esperado: nenhum espaço em branco extra abaixo do botão de ação.

6. **Campo multilinha que cresce (Edge case)**
   - Em **Registrar sessão**, tocar no campo **Anotações da sessão** e digitar várias
     linhas até ele crescer de altura.
   - Esperado: o scroll acompanha o crescimento do campo, mantendo a linha de edição
     atual visível acima do teclado.

7. **Consistência entre plataformas (User Story 3)**
   - Repetir os cenários 1 e 4 no simulador iOS e no emulador Android.
   - Esperado: comportamento equivalente nas duas plataformas, sem sobreposição do
     teclado e sem espaço em branco excessivo entre o conteúdo e o teclado em nenhuma
     delas.

8. **Fora do escopo: busca de pacientes (Decisão de clarificação)**
   - Ir em **Pacientes** (lista) e tocar no campo de busca no topo.
   - Esperado: nenhuma mudança de comportamento é esperada aqui — o campo já está
     sempre visível; confirmar que nada regrediu (ex.: o teclado ainda abre e fecha
     normalmente ao tocar fora, como antes).

## Critério de aceite da validação

Todos os 8 cenários acima devem passar nas duas plataformas antes de considerar a
funcionalidade pronta (alinhado a SC-001 a SC-004 da spec).
