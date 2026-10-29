import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Display, Pill, Row, Screen, SectionTitle, Txt } from '@/components/ui';
import type { MetodoPagamento } from '@/data/types';
import { confirmarAcao } from '@/lib/confirmar';
import { fmtCurta, fmtMesAnoCurto, milhar, moeda, plural, primeiroNome } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { ordenarPorDataDesc, resumoDoMes, soma } from '@/store/selectors';
import { colors, radius } from '@/theme';

type Filtro = 'todos' | 'pagos' | 'pendentes';
const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'pendentes', label: 'Pendentes' },
];
const METODOS: MetodoPagamento[] = ['Pix', 'Cartão', 'Dinheiro', 'Convênio'];
const BAR_MAX = 100;

export default function Financeiro() {
  const { hoje, sessoes, lancamentos, paciente, cobrar, marcarComoPago, removerLancamentosEmLote, showToast } =
    useApp();
  const params = useLocalSearchParams<{ filtro?: Filtro }>();
  const [filtro, setFiltro] = useState<Filtro>(params.filtro ?? 'todos');
  const [paramFiltroAplicado, setParamFiltroAplicado] = useState(params.filtro);
  const [marcandoId, setMarcandoId] = useState<string | null>(null);
  const [metodoEscolhido, setMetodoEscolhido] = useState<MetodoPagamento>('Pix');
  const [confirmando, setConfirmando] = useState(false);
  const [selecionando, setSelecionando] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [removendoLote, setRemovendoLote] = useState(false);

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

  const alternarModoSelecao = () => {
    setSelecionando((v) => !v);
    setSelecionados(new Set());
  };

  const alternarSelecao = (id: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const valorSelecionado = soma(lista.filter((l) => selecionados.has(l.id)));

  const removerSelecionados = () => {
    const ids = [...selecionados];
    confirmarAcao({
      titulo: 'Remover lançamentos',
      mensagem: `Tem certeza que deseja remover ${plural(ids.length, 'lançamento selecionado', 'lançamentos selecionados')} (${moeda(valorSelecionado)})?`,
      labelConfirmar: 'Remover',
      onConfirmar: async () => {
        setRemovendoLote(true);
        try {
          const resultado = await removerLancamentosEmLote(ids);
          const partes = [`${plural(resultado.removidos.length, 'lançamento removido', 'lançamentos removidos')}`];
          if (resultado.naoProcessados.length > 0) {
            partes.push(
              `${plural(resultado.naoProcessados.length, 'não processado por falha', 'não processados por falha')}`,
            );
          }
          showToast(partes.join(', '));
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível remover os lançamentos selecionados.');
        } finally {
          setRemovendoLote(false);
          setSelecionando(false);
          setSelecionados(new Set());
        }
      },
    });
  };

  return (
    <Screen
      footer={
        selecionando && selecionados.size > 0 ? (
          <View style={styles.barraSelecao}>
            <View>
              <Txt weight="semibold" color={colors.white}>
                {plural(selecionados.size, 'lançamento selecionado', 'lançamentos selecionados')}
              </Txt>
              <Txt size={12} color={colors.onPrimaryMuted}>
                {moeda(valorSelecionado)}
              </Txt>
            </View>
            <Button
              label={removendoLote ? 'Removendo…' : 'Remover selecionados'}
              variant="warn"
              onPress={removerSelecionados}
              style={{ opacity: removendoLote ? 0.7 : 1 }}
            />
          </View>
        ) : null
      }
    >
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
        <Row style={{ justifyContent: 'space-between' }}>
          <SectionTitle>Lançamentos</SectionTitle>
          {lista.length > 0 ? (
            <Button
              label={selecionando ? 'Cancelar' : 'Selecionar'}
              variant="outline"
              size="sm"
              onPress={alternarModoSelecao}
            />
          ) : null}
        </Row>
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
          const selecionandoMetodo = marcandoId === l.id;
          const marcado = selecionados.has(l.id);
          return (
            <Card
              key={l.id}
              style={[{ gap: 12 }, selecionando && marcado ? { borderWidth: 2, borderColor: colors.primary } : null]}
            >
              <Pressable
                accessibilityRole={selecionando ? 'checkbox' : undefined}
                accessibilityState={selecionando ? { checked: marcado } : undefined}
                onPress={selecionando ? () => alternarSelecao(l.id) : undefined}
                disabled={!selecionando}
              >
                <Row style={styles.lanc}>
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
                    ) : null}
                  </View>
                  {selecionando ? (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: marcado ? colors.primary : colors.handle,
                        backgroundColor: marcado ? colors.primary : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {marcado ? <Feather name="check" size={14} color={colors.white} /> : null}
                    </View>
                  ) : null}
                </Row>
              </Pressable>

              {!selecionando && !l.pago ? (
                selecionandoMetodo ? (
                  <View style={{ gap: 10 }}>
                    <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                      {METODOS.map((m) => (
                        <Pill key={m} label={m} variant="soft" selected={metodoEscolhido === m} onPress={() => setMetodoEscolhido(m)} />
                      ))}
                    </Row>
                    <Row style={{ gap: 8 }}>
                      <Button label="Cancelar" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => setMarcandoId(null)} />
                      <Button
                        label={confirmando ? 'Confirmando…' : 'Confirmar pagamento'}
                        size="sm"
                        style={{ flex: 2, opacity: confirmando ? 0.7 : 1 }}
                        onPress={async () => {
                          setConfirmando(true);
                          try {
                            await marcarComoPago(l.id, metodoEscolhido);
                            showToast(`Pagamento de ${primeiroNome(p.nome)} confirmado`);
                            setMarcandoId(null);
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : 'Não foi possível marcar como pago.');
                          } finally {
                            setConfirmando(false);
                          }
                        }}
                      />
                    </Row>
                  </View>
                ) : (
                  <Row style={{ gap: 8 }}>
                    {!l.cobrado ? (
                      <Button
                        label="Cobrar"
                        size="sm"
                        variant="warn"
                        style={{ flex: 1 }}
                        accessibilityLabel={`Cobrar ${p.nome}`}
                        onPress={async () => {
                          try {
                            await cobrar(l.id);
                            showToast(`Lembrete enviado para ${primeiroNome(p.nome)}`);
                          } catch (e) {
                            showToast(e instanceof Error ? e.message : 'Não foi possível enviar o lembrete.');
                          }
                        }}
                      />
                    ) : null}
                    <Button
                      label="Marcar como pago"
                      size="sm"
                      variant="outline"
                      style={{ flex: 1 }}
                      accessibilityLabel={`Marcar pagamento de ${p.nome} como pago`}
                      onPress={() => {
                        setMetodoEscolhido(l.metodo ?? 'Pix');
                        setMarcandoId(l.id);
                      }}
                    />
                  </Row>
                )
              ) : null}
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
  barraSelecao: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  hero: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, gap: 12 },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  progress: { height: 8, borderRadius: radius.pill, backgroundColor: colors.white },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: 150 },
  bar: { width: '100%', borderRadius: 6 },
  lanc: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
});
