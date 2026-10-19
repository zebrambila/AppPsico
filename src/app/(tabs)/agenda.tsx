import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SessionRow } from '@/components/SessionRow';
import { Button, Display, EmptyState, Row, Screen, Txt } from '@/components/ui';
import { addDays, diaCurto, diaDoMes, fmtDiaSemana, fmtMesAno, plural, startOfWeek } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { sessoesDoDia } from '@/store/selectors';
import { colors, radius } from '@/theme';

export default function Agenda() {
  const { hoje, sessoes, paciente } = useApp();
  const [semana, setSemana] = useState(() => startOfWeek(hoje));
  const [dia, setDia] = useState(hoje);

  const dias = Array.from({ length: 6 }, (_, i) => addDays(semana, i)); // seg–sáb
  const doDia = sessoesDoDia(sessoes, dia);

  const mudarSemana = (delta: number) => {
    const nova = addDays(semana, 7 * delta);
    setSemana(nova);
    setDia(nova);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: 110 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ gap: 4 }}>
            <Txt size={13} weight="medium" color={colors.muted}>
              {fmtMesAno(dia)}
            </Txt>
            <Display>Agenda</Display>
          </View>
          <Row>
            <Pressable accessibilityRole="button" accessibilityLabel="Semana anterior" onPress={() => mudarSemana(-1)} style={styles.arrow}>
              <Feather name="chevron-left" size={20} color={colors.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Próxima semana" onPress={() => mudarSemana(1)} style={styles.arrow}>
              <Feather name="chevron-right" size={20} color={colors.ink} />
            </Pressable>
          </Row>
        </Row>

        <Row style={{ gap: 6 }}>
          {dias.map((d) => {
            const on = d === dia;
            const n = sessoesDoDia(sessoes, d).length;
            return (
              <Pressable
                key={d}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${fmtDiaSemana(d)}, ${plural(n, 'sessão', 'sessões')}`}
                onPress={() => setDia(d)}
                style={[styles.day, { backgroundColor: on ? colors.primary : colors.surface }]}
              >
                <Txt size={12} weight="semibold" color={on ? colors.onPrimaryMuted : colors.muted}>
                  {diaCurto(d)}
                </Txt>
                <Txt size={18} weight="extrabold" color={on ? colors.white : colors.ink}>
                  {diaDoMes(d)}
                </Txt>
                <Txt size={11} color={on ? colors.onPrimaryMuted : colors.muted}>
                  {n ? String(n) : '—'}
                </Txt>
              </Pressable>
            );
          })}
        </Row>

        <Txt size={13} weight="semibold" color={colors.muted}>
          {fmtDiaSemana(dia)} · {doDia.length ? plural(doDia.length, 'sessão', 'sessões') : 'sem sessões'}
        </Txt>

        {doDia.length === 0 ? (
          <EmptyState title="Dia livre" subtitle="Nenhuma sessão marcada neste dia." />
        ) : (
          <View style={{ gap: 10 }}>
            {doDia.map((s) => {
              const p = paciente(s.pacienteId);
              if (!p) return null;
              return (
                <SessionRow
                  key={s.id}
                  sessao={s}
                  paciente={p}
                  showValue
                  onPress={() =>
                    router.push({ pathname: '/sessao/registrar', params: { sessaoId: s.id, pacienteId: p.id } })
                  }
                />
              );
            })}
          </View>
        )}
      </Screen>

      <Button
        label="Nova sessão"
        icon="plus"
        size="lg"
        onPress={() => router.push({ pathname: '/sessao/nova', params: { data: dia >= hoje ? dia : hoje } })}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    shadowColor: '#1F4038',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
