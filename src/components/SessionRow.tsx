import { View } from 'react-native';

import type { Paciente, Sessao } from '@/data/types';
import { colors } from '@/theme';
import { PressableCard, StatusChip, Txt } from './ui';

/** Linha de sessão usada no Início e na Agenda. */
export function SessionRow({
  sessao,
  paciente,
  onPress,
  showValue = false,
}: {
  sessao: Sessao;
  paciente: Paciente;
  onPress: () => void;
  showValue?: boolean;
}) {
  return (
    <PressableCard
      onPress={onPress}
      accessibilityLabel={`${sessao.hora}, ${paciente.nome}`}
      style={{ gap: 14, paddingVertical: 14 }}
    >
      <Txt weight="bold" numberOfLines={1} style={{ width: 52, fontVariant: ['tabular-nums'] }}>
        {sessao.hora}
      </Txt>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt weight="semibold">{paciente.nome}</Txt>
        <Txt size={12} color={colors.muted}>
          {sessao.modalidade} · {sessao.duracaoMin} min{showValue ? ` · R$ ${sessao.valor}` : ''}
        </Txt>
      </View>
      <StatusChip status={sessao.status} />
    </PressableCard>
  );
}
