import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FieldLabel, Pill, Row, Txt } from '@/components/ui';
import type { Modalidade } from '@/data/types';
import { addDays, diaCurto, diaDoMes, fmtDiaSemana, horaValida } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { colors, fonts, radius } from '@/theme';

export default function NovaSessao() {
  const params = useLocalSearchParams<{ pacienteId?: string; data?: string }>();
  const { pacientes, paciente, sessoes, hoje, agendarSessao, showToast } = useApp();
  const insets = useSafeAreaInsets();

  const inicial = paciente(params.pacienteId ?? '') ?? pacientes[0];
  const [pacienteId, setPacienteId] = useState(inicial.id);
  const [data, setData] = useState(params.data ?? addDays(hoje, 7));
  const [hora, setHora] = useState(inicial.horaFixa);
  const [modalidade, setModalidade] = useState<Modalidade>(inicial.modalidade);
  const [valor, setValor] = useState(String(inicial.valorSessao));
  const [repetir, setRepetir] = useState(true);

  const datas = Array.from({ length: 14 }, (_, i) => addDays(hoje, i));
  const valorNum = Number(valor.replace(',', '.'));
  const conflito = sessoes.find(
    (s) => s.data === data && s.hora === hora && s.status !== 'faltou' && s.status !== 'remarcada',
  );
  const valido = horaValida(hora) && valorNum > 0 && !conflito;

  const escolherPaciente = (id: string) => {
    const p = paciente(id);
    setPacienteId(id);
    if (p) {
      setHora(p.horaFixa);
      setModalidade(p.modalidade);
      setValor(String(p.valorSessao));
    }
  };

  const agendar = () => {
    if (!valido) return;
    agendarSessao({ pacienteId, data, hora, modalidade, valor: valorNum, repetirSemanal: repetir });
    showToast(`Sessão agendada · ${fmtDiaSemana(data)}, ${hora}`);
    router.back();
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Txt accessibilityRole="header" size={20} weight="bold">
        Nova sessão
      </Txt>

      <View style={{ gap: 8 }}>
        <FieldLabel>Paciente</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {pacientes.map((p) => (
            <Pill key={p.id} label={p.nome} selected={p.id === pacienteId} onPress={() => escolherPaciente(p.id)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel>Data</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {datas.map((d) => {
            const on = d === data;
            return (
              <Pill
                key={d}
                label={`${diaCurto(d)} ${diaDoMes(d)}`}
                selected={on}
                onPress={() => setData(d)}
                style={{ borderRadius: radius.md }}
              />
            );
          })}
        </ScrollView>
      </View>

      <Row style={{ gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <FieldLabel>Horário</FieldLabel>
          <TextInput
            value={hora}
            onChangeText={setHora}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel="Horário"
            style={[styles.input, !horaValida(hora) && { borderColor: colors.dangerInk }]}
          />
          {!horaValida(hora) ? (
            <Txt size={12} color={colors.dangerInk}>
              Use o formato HH:MM
            </Txt>
          ) : null}
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <FieldLabel>Valor (R$)</FieldLabel>
          <TextInput
            value={valor}
            onChangeText={setValor}
            keyboardType="decimal-pad"
            accessibilityLabel="Valor da sessão"
            style={styles.input}
          />
        </View>
      </Row>

      {conflito ? (
        <Txt size={13} weight="semibold" color={colors.dangerInk}>
          Já existe uma sessão em {fmtDiaSemana(data)} às {hora} ({paciente(conflito.pacienteId)?.nome}).
        </Txt>
      ) : null}

      <View style={{ gap: 8 }}>
        <FieldLabel>Modalidade</FieldLabel>
        <Row style={{ gap: 8 }}>
          {(['Presencial', 'Online'] as Modalidade[]).map((m) => (
            <Pill key={m} label={m} selected={modalidade === m} onPress={() => setModalidade(m)} style={{ flex: 1, borderRadius: radius.md }} />
          ))}
        </Row>
      </View>

      <Row style={{ justifyContent: 'space-between', minHeight: 44 }}>
        <Txt weight="semibold">Repetir toda semana</Txt>
        <Switch
          value={repetir}
          onValueChange={setRepetir}
          trackColor={{ true: colors.primary, false: colors.handle }}
          thumbColor={colors.white}
          accessibilityLabel="Repetir toda semana"
        />
      </Row>

      <Row style={{ gap: 10 }}>
        <Button label="Cancelar" variant="outline" style={{ flex: 1 }} onPress={() => router.back()} />
        <Button label="Agendar sessão" style={{ flex: 2, opacity: valido ? 1 : 0.5 }} onPress={agendar} />
      </Row>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
});
