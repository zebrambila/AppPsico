import { useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { Button, FieldLabel, Pill, Row, Txt } from '@/components/ui';
import type { Frequencia, Modalidade } from '@/data/types';
import { fmtTelefone, horaValida, toISO } from '@/lib/format';
import type { NovoPacienteInput } from '@/store/AppStore';
import { colors, fonts, radius } from '@/theme';

const FREQUENCIAS: Frequencia[] = ['Semanal', 'Quinzenal', 'Mensal'];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MODALIDADES: Modalidade[] = ['Presencial', 'Online'];

export function PacienteForm({
  valoresIniciais,
  labelBotao = 'Salvar',
  onSalvar,
}: {
  valoresIniciais?: Partial<NovoPacienteInput>;
  labelBotao?: string;
  onSalvar: (dados: NovoPacienteInput) => Promise<void>;
}) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? '');
  const [frequencia, setFrequencia] = useState<Frequencia>(valoresIniciais?.frequencia ?? 'Semanal');
  const [diaFixo, setDiaFixo] = useState(valoresIniciais?.diaFixo ?? 1);
  const [horaFixa, setHoraFixa] = useState(valoresIniciais?.horaFixa ?? '09:00');
  const [modalidade, setModalidade] = useState<Modalidade>(valoresIniciais?.modalidade ?? 'Presencial');
  const [valorSessao, setValorSessao] = useState(String(valoresIniciais?.valorSessao ?? ''));
  const [desde, setDesde] = useState(valoresIniciais?.desde ?? toISO(new Date()));
  const [telefone, setTelefone] = useState(valoresIniciais?.telefone ?? '');
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorNum = Number(valorSessao.replace(',', '.'));
  const valido = nome.trim().length > 1 && horaValida(horaFixa) && valorNum > 0 && telefone.trim().length > 0;

  const salvar = async () => {
    setTentou(true);
    setErro(null);
    if (!valido) return;
    setSalvando(true);
    try {
      await onSalvar({
        nome: nome.trim(),
        frequencia,
        diaFixo,
        horaFixa,
        modalidade,
        valorSessao: valorNum,
        desde,
        telefone: telefone.trim(),
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar o paciente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 6 }}>
        <FieldLabel>Nome completo</FieldLabel>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome do paciente"
          accessibilityLabel="Nome completo"
          autoCapitalize="words"
          style={[estiloInput, tentou && nome.trim().length <= 1 && { borderColor: colors.dangerInk }]}
        />
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel>Frequência</FieldLabel>
        <Row style={{ gap: 8 }}>
          {FREQUENCIAS.map((f) => (
            <Pill key={f} label={f} selected={frequencia === f} onPress={() => setFrequencia(f)} style={{ flex: 1, borderRadius: radius.md }} />
          ))}
        </Row>
      </View>

      <View style={{ gap: 8 }}>
        <FieldLabel>Dia fixo</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {DIAS.map((d, i) => (
            <Pill key={d} label={d} selected={diaFixo === i} onPress={() => setDiaFixo(i)} style={{ borderRadius: radius.md }} />
          ))}
        </ScrollView>
      </View>

      <Row style={{ gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 6 }}>
          <FieldLabel>Horário fixo</FieldLabel>
          <TextInput
            value={horaFixa}
            onChangeText={setHoraFixa}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel="Horário fixo"
            style={[estiloInput, tentou && !horaValida(horaFixa) && { borderColor: colors.dangerInk }]}
          />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <FieldLabel>Valor da sessão (R$)</FieldLabel>
          <TextInput
            value={valorSessao}
            onChangeText={setValorSessao}
            keyboardType="decimal-pad"
            accessibilityLabel="Valor da sessão"
            style={[estiloInput, tentou && !(valorNum > 0) && { borderColor: colors.dangerInk }]}
          />
        </View>
      </Row>

      <View style={{ gap: 8 }}>
        <FieldLabel>Modalidade</FieldLabel>
        <Row style={{ gap: 8 }}>
          {MODALIDADES.map((m) => (
            <Pill key={m} label={m} selected={modalidade === m} onPress={() => setModalidade(m)} style={{ flex: 1, borderRadius: radius.md }} />
          ))}
        </Row>
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel>Paciente desde</FieldLabel>
        <TextInput
          value={desde}
          onChangeText={setDesde}
          placeholder="AAAA-MM-DD"
          accessibilityLabel="Paciente desde"
          style={estiloInput}
        />
      </View>

      <View style={{ gap: 6 }}>
        <FieldLabel>Telefone</FieldLabel>
        <TextInput
          value={telefone}
          onChangeText={(v) => setTelefone(fmtTelefone(v))}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          accessibilityLabel="Telefone"
          style={[estiloInput, tentou && telefone.trim().length === 0 && { borderColor: colors.dangerInk }]}
        />
      </View>

      {erro ? (
        <Txt size={13} weight="semibold" color={colors.dangerInk}>
          {erro}
        </Txt>
      ) : null}

      <Button label={salvando ? 'Salvando…' : labelBotao} size="lg" onPress={salvar} style={{ opacity: salvando ? 0.7 : 1 }} />
    </ScrollView>
  );
}

const estiloInput = {
  minHeight: 48,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.md,
  paddingHorizontal: 12,
  backgroundColor: colors.surface,
  fontSize: 15,
  fontFamily: fonts.regular,
  color: colors.ink,
};
