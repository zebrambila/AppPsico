# Quickstart: Validar a saudação por horário

Não há testes automatizados no repositório; a validação é manual (exigência da constituição para mudanças de UI).

## Pré-requisitos
- Dependências instaladas; `npx expo lint` e `npx tsc --noEmit` sem erros.
- Simulador/emulador ou Expo Go. Login com conta de teste.

## Rodar
```bash
npx expo start
```

## Cenários (mapeados à spec)
1. **Faixas (US1)**: ajustar o horário do dispositivo/simulador para 08:00, 14:00, 20:00 e 02:00 e abrir a aba Início. Esperado: "Bom dia", "Boa tarde", "Boa noite", "Boa noite" + primeiro nome.
2. **Fronteiras (SC-001)**: 04:59 → Boa noite; 05:00 → Bom dia; 11:59 → Bom dia; 12:00 → Boa tarde; 17:59 → Boa tarde; 18:00 → Boa noite.
3. **Atualização com app aberto (US2-1)**: deixar a tela aberta às 11:59 e esperar passar das 12:00 (ou, para não esperar, usar o retorno do segundo plano do cenário 4). Esperado: "Boa tarde" em até 10 min.
4. **Retorno do segundo plano (US2-2)**: abrir às 11:50, enviar o app ao segundo plano, mudar o horário para 12:05 e voltar. Esperado: "Boa tarde" imediatamente.
5. **Sem nome**: usuário sem nome mantém o comportamento atual (saudação sem nome quebrada/ausente conforme já era).

Se algum cenário não puder ser exercitado, declarar a limitação ao reportar a conclusão.
