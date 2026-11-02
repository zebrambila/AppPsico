import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const INTERVALO_MS = 10 * 60_000;

type Saudacao = 'Bom dia' | 'Boa tarde' | 'Boa noite';

function saudacaoAgora(): Saudacao {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Saudação conforme o horário local do dispositivo; reavaliada periodicamente e ao voltar
 * do segundo plano, para acompanhar o relógio sem exigir reabrir a tela. */
export function useSaudacao(): Saudacao {
  const [saudacao, setSaudacao] = useState<Saudacao>(saudacaoAgora);

  useEffect(() => {
    const atualizar = () => setSaudacao(saudacaoAgora());
    const id = setInterval(atualizar, INTERVALO_MS);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });
    return () => {
      clearInterval(id);
      assinatura.remove();
    };
  }, []);

  return saudacao;
}
