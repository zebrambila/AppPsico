import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { BackButton, Button, Card, EmptyState, FieldLabel, Pill, Row, Screen, Txt } from '@/components/ui';
import type { MetodoPagamento, Presenca } from '@/data/types';
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
  const { paciente, sessoes, lancamentos, hoje, registrarSessao, showToast } = useApp();

  const sessao = sessaoId ? sessoes.find((s) => s.id === sessaoId) : undefined;
  const p = paciente(sessao?.pacienteId ?? pacienteId);
  const lancExistente = sessao ? lancamentos.find((l) => l.sessaoId === sessao.id) : undefined;

  const [presenca, setPresenca] = useState<Presenca>(sessao?.status === 'faltou' ? 'faltou' : 'compareceu');
  const [pago, setPago] = useState(lancExistente ? lancExistente.pago : true);
  const [metodo, setMetodo] = useState<MetodoPagamento>(lancExistente?.metodo ?? 'Pix');
  const [nota, setNota] = useState('');

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

  const salvar = () => {
    registrarSessao({ sessaoId: sessao?.id, pacienteId: p.id, presenca, pago, metodo, nota });
    showToast(presenca === 'compareceu' ? 'Sessão registrada' : presenca === 'faltou' ? 'Falta registrada' : 'Sessão marcada como remarcada');
    router.back();
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

      <Button label="Salvar registro" size="lg" onPress={salvar} />
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
