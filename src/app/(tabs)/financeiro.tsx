import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Display, Pill, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import { fmtCurta, fmtMesAnoCurto, milhar, moeda, primeiroNome } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { ordenarPorDataDesc, resumoDoMes } from '@/store/selectors';
import { colors, radius } from '@/theme';

type Filtro = 'todos' | 'pagos' | 'pendentes';
const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'pendentes', label: 'Pendentes' },
];
const BAR_MAX = 100;

export default function Financeiro() {
  const { hoje, sessoes, lancamentos, paciente, cobrar, showToast } = useApp();
  const params = useLocalSearchParams<{ filtro?: Filtro }>();
  const [filtro, setFiltro] = useState<Filtro>(params.filtro ?? 'todos');
  const [paramFiltroAplicado, setParamFiltroAplicado] = useState(params.filtro);

  if (params.filtro !== paramFiltroAplicado) {
    setParamFiltroAplicado(params.filtro);
    if (params.filtro) setFiltro(params.filtro);
  }

  const resumo = useMemo(() => resumoDoMes(sessoes, lancamentos, hoje), [sessoes, lancamentos, hoje]);
  const pct = resumo.previsto ? Math.round((resumo.recebido / resumo.previsto) * 100) : 0;
  const maxSemana = Math.max(1, ...resumo.semanas.map((s) => s.recebido + s.previsto));

  const lista = lancamentos
    .filter((l) => l.data.slice(0, 7) === hoje.slice(0, 7))
    .filter((l) => filtro === 'todos' || (filtro === 'pagos' ? l.pago : !l.pago))
    .sort(ordenarPorDataDesc)
    .slice(0, 30);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Display>Financeiro</Display>
        <Row>
          <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" style={styles.arrow} onPress={() => showToast('Navegação entre meses — em breve')}>
            <Feather name="chevron-left" size={18} color={colors.ink} />
          </Pressable>
          <Txt size={14} weight="bold">
            {fmtMesAnoCurto(hoje)}
          </Txt>
          <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" style={styles.arrow} onPress={() => showToast('Navegação entre meses — em breve')}>
            <Feather name="chevron-right" size={18} color={colors.ink} />
          </Pressable>
        </Row>
      </Row>

      <View style={styles.hero}>
        <Txt size={13} weight="semibold" color={colors.onPrimaryMuted}>
          Recebido no mês
        </Txt>
        <Txt size={34} weight="extrabold" color={colors.white} style={{ letterSpacing: -0.7 }}>
          {moeda(resumo.recebido)}
        </Txt>
        <View style={styles.track}>
          <View style={[styles.progress, { width: `${pct}%` }]} />
        </View>
        <Txt size={13} color={colors.onPrimaryMuted}>
          {pct}% do previsto de {moeda(resumo.previsto)}
        </Txt>
      </View>

      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <View style={[styles.tile, { backgroundColor: colors.warnBg }]}>
          <Txt size={18} weight="extrabold" color={colors.warnInk}>
            {moeda(resumo.aReceber)}
          </Txt>
          <Txt size={12} color={colors.warnInk}>
            a receber
          </Txt>
        </View>
        <View style={styles.tile}>
          <Txt size={18} weight="extrabold">
            {moeda(resumo.agendado)}
          </Txt>
          <Txt size={12} color={colors.muted}>
            agendado
          </Txt>
        </View>
        <View style={styles.tile}>
          <Txt size={18} weight="extrabold">
            {resumo.sessoesPagas}
          </Txt>
          <Txt size={12} color={colors.muted}>
            sessões pagas
          </Txt>
        </View>
      </Row>

      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt weight="bold">Por semana</Txt>
          <Row style={{ gap: 12 }}>
            <Legend color={colors.primary} label="Recebido" />
            <Legend color={colors.forecast} label="Previsto" />
          </Row>
        </Row>
        <Row style={{ gap: 12, alignItems: 'flex-end', height: 150 }}>
          {resumo.semanas.map((s) => {
            const total = s.recebido + s.previsto;
            const hRec = (s.recebido / maxSemana) * BAR_MAX;
            const hPrev = (s.previsto / maxSemana) * BAR_MAX;
            return (
              <View
                key={s.rotulo}
                style={styles.barCol}
                accessible
                accessibilityLabel={`${s.rotulo}: recebido ${moeda(s.recebido)}, previsto ${moeda(s.previsto)}`}
              >
                <Txt size={11} weight="bold" color={colors.inkSoft}>
                  {total ? milhar(total) : '—'}
                </Txt>
                <View style={{ width: '100%', gap: 2 }}>
                  {hPrev > 0 ? <View style={[styles.bar, { height: hPrev, backgroundColor: colors.forecast }]} /> : null}
                  {hRec > 0 ? <View style={[styles.bar, { height: hRec, backgroundColor: colors.primary }]} /> : null}
                </View>
                <Txt size={12} color={colors.muted}>
                  {s.rotulo}
                </Txt>
              </View>
            );
          })}
        </Row>
      </Card>

      <View style={{ gap: 10 }}>
        <SectionTitle>Lançamentos</SectionTitle>
        <Row style={{ gap: 8 }}>
          {FILTROS.map((f) => (
            <Pill key={f.value} label={f.label} selected={filtro === f.value} variant="dark" onPress={() => setFiltro(f.value)} />
          ))}
        </Row>
        {lista.length === 0 ? (
          <Txt size={14} color={colors.muted} style={{ textAlign: 'center', paddingVertical: 16 }}>
            Nenhum lançamento neste filtro.
          </Txt>
        ) : null}
        {lista.map((l) => {
          const p = paciente(l.pacienteId);
          if (!p) return null;
          return (
            <Card key={l.id} style={styles.lanc}>
              <Avatar iniciais={p.iniciais} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={14} weight="semibold">
                  {p.nome}
                </Txt>
                <Txt size={12} color={colors.muted}>
                  {fmtCurta(l.data)} · {l.pago ? l.metodo : 'Aguardando'}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Txt size={14} weight="bold">
                  {moeda(l.valor)}
                </Txt>
                {l.pago ? (
                  <Txt size={12} weight="semibold" color={colors.primaryInk}>
                    Pago
                  </Txt>
                ) : l.cobrado ? (
                  <Txt size={12} weight="semibold" color={colors.warnInk}>
                    Lembrete enviado
                  </Txt>
                ) : (
                  <Button
                    label="Cobrar"
                    size="sm"
                    variant="warn"
                    accessibilityLabel={`Cobrar ${p.nome}`}
                    onPress={() => {
                      cobrar(l.id);
                      showToast(`Lembrete enviado para ${primeiroNome(p.nome)}`);
                    }}
                  />
                )}
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Row style={{ gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Txt size={12} color={colors.muted}>
        {label}
      </Txt>
    </Row>
  );
}

const styles = StyleSheet.create({
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, gap: 12 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progress: { height: 8, borderRadius: radius.pill, backgroundColor: colors.white },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 150 },
  bar: { width: '100%', borderRadius: 6 },
  lanc: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
});
