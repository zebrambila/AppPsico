import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Button, Chip, Display, PressableCard, Row, Screen, Txt } from '@/components/ui';
import { useApp } from '@/store/AppStore';
import { emAbertoDoPaciente } from '@/store/selectors';
import { colors, fonts, radius } from '@/theme';

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Pacientes() {
  const { pacientes, lancamentos, showToast } = useApp();
  const [busca, setBusca] = useState('');

  const lista = useMemo(
    () => pacientes.filter((p) => !busca || normalizar(p.nome).includes(normalizar(busca))),
    [pacientes, busca],
  );

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 4 }}>
          <Txt size={13} weight="medium" color={colors.muted}>
            {pacientes.length} pacientes ativos
          </Txt>
          <Display>Pacientes</Display>
        </View>
        <Button label="+ Novo" onPress={() => showToast('Cadastro de novo paciente — em breve')} />
      </Row>

      <View style={styles.search}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar por nome"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Buscar paciente"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>

      {lista.length === 0 ? (
        <Txt size={14} color={colors.muted} style={{ textAlign: 'center', paddingVertical: 20 }}>
          Nenhum paciente encontrado.
        </Txt>
      ) : (
        <View style={{ gap: 8 }}>
          {lista.map((p) => {
            const emDia = emAbertoDoPaciente(lancamentos, p.id).length === 0;
            return (
              <PressableCard
                key={p.id}
                accessibilityLabel={p.nome}
                onPress={() => router.push({ pathname: '/paciente/[id]', params: { id: p.id } })}
                style={{ paddingVertical: 12, paddingHorizontal: 14 }}
              >
                <Avatar iniciais={p.iniciais} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="semibold">{p.nome}</Txt>
                  <Txt size={12} color={colors.muted}>
                    {p.frequencia} · {DIAS[p.diaFixo]} {p.horaFixa} · {p.modalidade}
                  </Txt>
                </View>
                <Chip label={emDia ? 'Em dia' : 'Em aberto'} tone={emDia ? 'success' : 'warn'} />
              </PressableCard>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md + 2,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: { flex: 1, minHeight: 46, fontSize: 15, fontFamily: fonts.regular, color: colors.ink },
});
