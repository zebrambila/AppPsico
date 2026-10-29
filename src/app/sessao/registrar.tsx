import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Card, EmptyState, FieldLabel, Pill, Row, Screen, Txt } from '@/components/ui';
import type { MetodoPagamento, Presenca } from '@/data/types';
import { confirmarAcao } from '@/lib/confirmar';
import { addDays, fmtDiaSemana, moeda } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { colors, fonts, radius } from '@/theme';

const PRESENCAS: { value: Presenca; label: string }[] = [
  { value: 'compareceu', label: 'Compareceu' },
  { value: 'faltou', label: 'Faltou' },
  { value: 'remarcou', label: 'Remarcou' },
];
const METODOS: MetodoPagamento[] = ['Pix', 'Cartão', 'Dinheiro', 'Convênio'];

export default function RegistrarSessao() {
  const { sessaoId, pacienteId } = useLocalSearchParams<{ sessaoId?: string; pacienteId: string }>();
  const { paciente, sessoes, lancamentos, notas, hoje, registrarSessao, excluirSessao, removerLancamento, showToast } =
    useApp();

  const sessao = sessaoId ? sessoes.find((s) => s.id === sessaoId) : undefined;
  const p = paciente(sessao?.pacienteId ?? pacienteId);
  const lancExistente = sessao ? lancamentos.find((l) => l.sessaoId === sessao.id) : undefined;
  const notaExistente = sessao ? notas.find((n) => n.sessaoId === sessao.id) : undefined;

  const presencaInicial: Presenca =
    sessao?.status === 'faltou' ? 'faltou' : sessao?.status === 'remarcada' ? 'remarcou' : 'compareceu';
  const [presenca, setPresenca] = useState<Presenca>(presencaInicial);
  const [pago, setPago] = useState(lancExistente ? lancExistente.pago : true);
  const [metodo, setMetodo] = useState<MetodoPagamento>(lancExistente?.metodo ?? 'Pix');
  const [nota, setNota] = useState(notaExistente?.texto ?? '');
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [removendoLancamento, setRemovendoLancamento] = useState(false);

  if (!p) {
    return (
      <Screen>
        <BackButton />
        <EmptyState title="Sessão não encontrada" subtitle="Volte e tente novamente." />
      </Screen>
    );
  }

  const data = sessao?.data ?? hoje;
  const hora = sessao?.hora ?? p.horaFixa;
  const valor = sessao?.valor ?? p.valorSessao;
  const cobra = presenca === 'compareceu';

  const salvar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      await registrarSessao({ sessaoId: sessao?.id, pacienteId: p.id, presenca, pago, metodo, nota });
      showToast(presenca === 'compareceu' ? 'Sessão registrada' : presenca === 'faltou' ? 'Falta registrada' : 'Sessão marcada como remarcada');
      router.back();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível registrar a sessão.');
    } finally {
      setEnviando(false);
    }
  };

  const excluir = () => {
    if (!sessao) return;
    confirmarAcao({
      titulo: 'Excluir sessão',
      mensagem:
        'Tem certeza que deseja excluir esta sessão? O lançamento financeiro vinculado (se houver) será excluído, e qualquer anotação será arquivada. Essa ação não pode ser desfeita.',
      labelConfirmar: 'Excluir',
      onConfirmar: async () => {
        setExcluindo(true);
        try {
          await excluirSessao(sessao.id);
          showToast('Sessão excluída');
          router.back();
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível excluir a sessão.');
        } finally {
          setExcluindo(false);
        }
      },
    });
  };

  const removerLancamentoDaSessao = () => {
    if (!lancExistente) return;
    confirmarAcao({
      titulo: 'Remover lançamento',
      mensagem: 'Tem certeza que deseja remover o lançamento financeiro desta sessão?',
      labelConfirmar: 'Remover',
      onConfirmar: async () => {
        setRemovendoLancamento(true);
        try {
          await removerLancamento(lancExistente.id);
          showToast('Lançamento removido');
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível remover o lançamento.');
        } finally {
          setRemovendoLancamento(false);
        }
      },
    });
  };

  return (
    <Screen
      contentStyle={{ gap: 20 }}
      edges={['top', 'bottom']}
    >
      <BackButton />
      <View style={{ gap: 4 }}>
        <Txt accessibilityRole="header" size={24} weight="bold" style={{ letterSpacing: -0.5 }}>
          Registrar sessão
        </Txt>
        <Txt size={14} color={colors.muted}>
          {p.nome} · {fmtDiaSemana(data)} · {hora}
        </Txt>
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel>Presença</FieldLabel>
        <Row style={{ gap: 8 }}>
          {PRESENCAS.map((o) => (
            <Pill
              key={o.value}
              label={o.label}
              selected={presenca === o.value}
              onPress={() => setPresenca(o.value)}
              style={{ flex: 1, borderRadius: radius.md, minHeight: 44 }}
            />
          ))}
        </Row>
      </View>

      {cobra ? (
        <Card style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ gap: 2 }}>
              <Txt weight="bold">Pagamento</Txt>
              <Txt size={13} color={colors.muted}>
                Valor da sessão: {moeda(valor)}
              </Txt>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel="Sessão paga"
              accessibilityState={{ checked: pago }}
              onPress={() => setPago((v) => !v)}
              style={[styles.switch, { backgroundColor: pago ? colors.primary : colors.handle, justifyContent: pago ? 'flex-end' : 'flex-start' }]}
            >
              <View style={styles.knob} />
            </Pressable>
          </Row>
          <Txt size={13} weight="semibold" color={pago ? colors.primaryInk : colors.warnInk}>
            {pago ? 'Pago · escolha a forma de pagamento' : 'Pendente · ficará em "A receber"'}
          </Txt>
          {pago ? (
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              {METODOS.map((m) => (
                <Pill key={m} label={m} variant="soft" selected={metodo === m} onPress={() => setMetodo(m)} />
              ))}
            </Row>
          ) : null}
          {lancExistente ? (
            <Button
              label={removendoLancamento ? 'Removendo…' : 'Remover lançamento'}
              variant="outline"
              size="sm"
              icon="trash-2"
              onPress={removerLancamentoDaSessao}
              style={{ opacity: removendoLancamento ? 0.7 : 1, alignSelf: 'flex-start' }}
            />
          ) : null}
        </Card>
      ) : (
        <Card>
          <Txt size={13} color={colors.muted}>
            {presenca === 'faltou'
              ? 'Faltas não geram cobrança automática.'
              : 'A sessão ficará como remarcada; agende o novo horário pela Agenda.'}
          </Txt>
        </Card>
      )}

      <View style={{ gap: 8 }}>
        <FieldLabel>Anotações da sessão</FieldLabel>
        <TextInput
          value={nota}
          onChangeText={setNota}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholder="Temas trabalhados, intervenções, combinados para a próxima sessão…"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Anotações da sessão"
          style={styles.textarea}
        />
        <Txt size={12} color={colors.muted}>
          Salvo no prontuário, protegido e visível só para você.
        </Txt>
      </View>

      <View style={styles.next}>
        <View style={{ gap: 2 }}>
          <Txt size={12} weight="semibold" color={colors.primaryInk}>
            Próxima sessão
          </Txt>
          <Txt weight="bold">
            {fmtDiaSemana(addDays(data, 7))} · {hora}
          </Txt>
        </View>
        <Txt size={12} weight="semibold" color={colors.primaryInk}>
          Recorrente
        </Txt>
      </View>

      <Button label={enviando ? 'Salvando…' : 'Salvar registro'} size="lg" onPress={salvar} style={{ opacity: enviando ? 0.7 : 1 }} />

      {sessao ? (
        <Button
          label={excluindo ? 'Excluindo…' : 'Excluir sessão'}
          variant="outline"
          icon="trash-2"
          accessibilityLabel="Excluir sessão"
          onPress={excluir}
          style={{ opacity: excluindo ? 0.7 : 1 }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  switch: { width: 56, height: 32, borderRadius: radius.pill, padding: 3, flexDirection: 'row' },
  knob: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.white },
  textarea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md + 2,
    padding: 14,
    backgroundColor: colors.surface,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  next: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md + 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
