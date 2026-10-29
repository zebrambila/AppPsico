import Feather from '@expo/vector-icons/Feather';
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
  modoSelecao = false,
  selecionada = false,
}: {
  sessao: Sessao;
  paciente: Paciente;
  onPress: () => void;
  showValue?: boolean;
  /** quando true, mostra um indicador de seleção no lugar do status (modo de exclusão em lote) */
  modoSelecao?: boolean;
  selecionada?: boolean;
}) {
  return (
    <PressableCard
      onPress={onPress}
      accessibilityRole={modoSelecao ? 'checkbox' : undefined}
      accessibilityState={modoSelecao ? { checked: selecionada } : undefined}
      accessibilityLabel={`${sessao.hora}, ${paciente.nome}`}
      style={[
        { gap: 14, paddingVertical: 14 },
        modoSelecao && selecionada ? { borderWidth: 2, borderColor: colors.primary } : null,
      ]}
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
      {modoSelecao ? (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selecionada ? colors.primary : colors.handle,
            backgroundColor: selecionada ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selecionada ? <Feather name="check" size={14} color={colors.white} /> : null}
        </View>
      ) : (
        <StatusChip status={sessao.status} />
      )}
    </PressableCard>
  );
}
