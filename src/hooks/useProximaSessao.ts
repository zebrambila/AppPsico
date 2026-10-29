import { useEffect, useState } from 'react';

import type { Sessao } from '@/data/types';

const INTERVALO_MS = 30_000;

/** Sessão confirmada/pendente mais próxima do horário atual; reavaliada periodicamente
 * enquanto o componente estiver montado, para acompanhar o relógio sem exigir reabrir a tela. */
export function useProximaSessao(sessoesDoDia: Sessao[]): Sessao | undefined {
  const [, forcarRecalculo] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forcarRecalculo((n) => n + 1), INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  const agora = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
  return sessoesDoDia
    .filter((s) => s.status === 'confirmada' || s.status === 'pendente')
    .find((s) => s.hora >= agora);
}
