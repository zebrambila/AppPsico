# Data Model: Saudação por horário

Sem persistência. Único conceito: **Faixa do dia**, derivado da hora local (0–23).

| Faixa | Hora local | Saudação |
|-------|-----------|----------|
| Manhã | 5 ≤ h < 12 | Bom dia |
| Tarde | 12 ≤ h < 18 | Boa tarde |
| Noite | h ≥ 18 ou h < 5 | Boa noite |

Regras: as faixas cobrem as 24 horas sem sobreposição; a fronteira inferior é inclusiva (05:00, 12:00 e 18:00 pertencem à nova faixa). Não há transições de estado armazenadas; o valor é recalculado a cada leitura do relógio.
