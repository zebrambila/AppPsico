import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import {
  Avatar,
  BackButton,
  Button,
  Card,
  Chip,
  EmptyState,
  InfoRow,
  Row,
  Screen,
  Segmented,
  StatusChip,
  Txt,
} from '@/components/ui';
import { confirmarAcao } from '@/lib/confirmar';
import { fmtLonga, fmtTelefone, moeda, plural } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { emAbertoDoPaciente, ordenarPorDataDesc, soma } from '@/store/selectors';
import { colors, radius } from '@/theme';

type Aba = 'sessoes' | 'prontuario' | 'financeiro';
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function PacienteDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { paciente, sessoes, lancamentos, notas, hoje, excluirPaciente, excluirNota, removerLancamento, showToast } =
    useApp();
  const [aba, setAba] = useState<Aba>('sessoes');
  const [excluindo, setExcluindo] = useState(false);
  const [excluindoNotaId, setExcluindoNotaId] = useState<string | null>(null);
  const [excluindoLancamentoId, setExcluindoLancamentoId] = useState<string | null>(null);
  const p = paciente(id);

  if (!p) {
    return (
      <Screen>
        <BackButton />
        <EmptyState title="Paciente não encontrado" subtitle="Volte e tente novamente." />
      </Screen>
    );
  }

  const historico = sessoes
    .filter((s) => s.pacienteId === p.id && s.data <= hoje)
    .sort(ordenarPorDataDesc);
  const realizadas = historico.filter((s) => s.status === 'realizada');
  const numeroDe = new Map(
    [...realizadas].reverse().map((s, i) => [s.id, i + 1] as const),
  );
  const notasPac = notas.filter((n) => n.pacienteId === p.id).sort(ordenarPorDataDesc);
  const pagamentos = lancamentos.filter((l) => l.pacienteId === p.id).sort(ordenarPorDataDesc);
  const abertos = emAbertoDoPaciente(lancamentos, p.id);
  const saldo = soma(abertos);
  const [ano, mes] = p.desde.split('-').map(Number);

  const excluir = () => {
    confirmarAcao({
      titulo: 'Excluir paciente',
      mensagem: `Tem certeza que deseja excluir ${p.nome}? Todas as sessões, lançamentos e notas vinculados a esse paciente também serão excluídos. Essa ação não pode ser desfeita.`,
      labelConfirmar: 'Excluir',
      onConfirmar: async () => {
        setExcluindo(true);
        try {
          await excluirPaciente(p.id);
          showToast(`${p.nome} foi excluído`);
          router.back();
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível excluir o paciente.');
        } finally {
          setExcluindo(false);
        }
      },
    });
  };

  const excluirNotaDoProntuario = (notaId: string) => {
    confirmarAcao({
      titulo: 'Excluir anotação',
      mensagem: 'Tem certeza que deseja excluir esta anotação do prontuário? Essa ação não pode ser desfeita.',
      labelConfirmar: 'Excluir',
      onConfirmar: async () => {
        setExcluindoNotaId(notaId);
        try {
          await excluirNota(notaId);
          showToast('Anotação excluída');
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível excluir a anotação.');
        } finally {
          setExcluindoNotaId(null);
        }
      },
    });
  };

  const excluirLancamentoDoFinanceiro = (lancamentoId: string) => {
    confirmarAcao({
      titulo: 'Excluir lançamento',
      mensagem: 'Tem certeza que deseja excluir este lançamento financeiro? Essa ação não pode ser desfeita.',
      labelConfirmar: 'Excluir',
      onConfirmar: async () => {
        setExcluindoLancamentoId(lancamentoId);
        try {
          await removerLancamento(lancamentoId);
          showToast('Lançamento excluído');
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Não foi possível excluir o lançamento.');
        } finally {
          setExcluindoLancamentoId(null);
        }
      },
    });
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <BackButton />
        <Row style={{ gap: 4 }}>
          <Button
            label="Editar"
            variant="outline"
            size="sm"
            icon="edit-2"
            onPress={() => router.push({ pathname: '/paciente/[id]/editar', params: { id: p.id } })}
          />
          <Button
            label={excluindo ? 'Excluindo…' : 'Excluir'}
            variant="outline"
            size="sm"
            icon="trash-2"
            accessibilityLabel={`Excluir ${p.nome}`}
            onPress={excluir}
          />
        </Row>
      </Row>

      <Row style={{ gap: 14 }}>
        <Avatar iniciais={p.iniciais} size={64} dark />
        <View style={{ gap: 4, flex: 1 }}>
          <Txt accessibilityRole="header" size={22} weight="bold">
            {p.nome}
          </Txt>
          <Txt size={13} color={colors.muted}>
            Desde {MESES[mes - 1]} {ano} · {plural(realizadas.length, 'sessão', 'sessões')}
          </Txt>
        </View>
      </Row>

      <Card style={{ paddingVertical: 4 }}>
        <InfoRow label="Frequência" value={p.frequencia} />
        <InfoRow label="Horário fixo" value={`${DIAS[p.diaFixo]} ${p.horaFixa}`} />
        <InfoRow label="Modalidade" value={p.modalidade} />
        <InfoRow label="Valor da sessão" value={moeda(p.valorSessao)} />
        <InfoRow label="Contato" value={fmtTelefone(p.telefone)} last />
      </Card>

      <Row style={{ gap: 10 }}>
        <Button
          label="Agendar"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/sessao/nova', params: { pacienteId: p.id } })}
        />
        <Button
          label="Registrar sessão"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/sessao/registrar', params: { pacienteId: p.id } })}
        />
      </Row>

      <Segmented<Aba>
        value={aba}
        onChange={setAba}
        options={[
          { value: 'sessoes', label: 'Sessões' },
          { value: 'prontuario', label: 'Prontuário' },
          { value: 'financeiro', label: 'Financeiro' },
        ]}
      />

      {aba === 'sessoes' && (
        <View style={{ gap: 8 }}>
          {historico.length === 0 ? <EmptyState title="Sem sessões" subtitle="Nenhuma sessão registrada ainda." /> : null}
          {historico.map((s) => (
            <Card key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ gap: 2 }}>
                <Txt size={14} weight="semibold">
                  {fmtLonga(s.data)}
                </Txt>
                <Txt size={12} color={colors.muted}>
                  {numeroDe.has(s.id) ? `Sessão ${numeroDe.get(s.id)} · ` : ''}
                  {s.hora}
                </Txt>
              </View>
              <StatusChip status={s.status} />
            </Card>
          ))}
        </View>
      )}

      {aba === 'prontuario' && (
        <View style={{ gap: 10 }}>
          <Row style={{ gap: 8 }}>
            <Feather name="lock" size={14} color={colors.muted} />
            <Txt size={12} color={colors.muted}>
              Anotações protegidas · visíveis só para você
            </Txt>
          </Row>
          {notasPac.length === 0 ? (
            <EmptyState title="Prontuário vazio" subtitle="As anotações feitas ao registrar sessões aparecem aqui." />
          ) : null}
          {notasPac.map((n) => (
            <Card key={n.id} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Txt size={12} weight="bold" color={colors.primary}>
                  {fmtLonga(n.data)}
                </Txt>
                <Button
                  label={excluindoNotaId === n.id ? 'Excluindo…' : 'Excluir'}
                  variant="outline"
                  size="sm"
                  icon="trash-2"
                  accessibilityLabel="Excluir anotação"
                  onPress={() => excluirNotaDoProntuario(n.id)}
                  style={{ opacity: excluindoNotaId === n.id ? 0.7 : 1 }}
                />
              </Row>
              <Txt size={14} style={{ lineHeight: 21 }}>
                {n.texto}
              </Txt>
            </Card>
          ))}
        </View>
      )}

      {aba === 'financeiro' && (
        <View style={{ gap: 10 }}>
          <View
            style={{
              backgroundColor: saldo ? colors.warnBg : colors.primarySoft,
              borderRadius: radius.md + 2,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Txt size={14} weight="semibold" color={saldo ? colors.warnInk : colors.primaryInk}>
              {saldo ? 'Saldo em aberto' : 'Pagamentos em dia'}
            </Txt>
            <Txt size={17} weight="extrabold" color={saldo ? colors.warnInk : colors.primaryInk}>
              {moeda(saldo)}
            </Txt>
          </View>
          {pagamentos.map((l) => (
            <Card key={l.id} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Txt size={14} weight="semibold">
                    {fmtLonga(l.data)}
                  </Txt>
                  <Txt size={12} color={colors.muted}>
                    {l.pago ? l.metodo : 'Aguardando pagamento'}
                  </Txt>
                </View>
                <Row style={{ gap: 10 }}>
                  <Txt size={14} weight="bold">
                    {moeda(l.valor)}
                  </Txt>
                  <Chip label={l.pago ? 'Pago' : 'Em aberto'} tone={l.pago ? 'success' : 'warn'} />
                </Row>
              </Row>
              <Button
                label={excluindoLancamentoId === l.id ? 'Excluindo…' : 'Excluir'}
                variant="outline"
                size="sm"
                icon="trash-2"
                accessibilityLabel="Excluir lançamento"
                onPress={() => excluirLancamentoDoFinanceiro(l.id)}
                style={{ alignSelf: 'flex-start', opacity: excluindoLancamentoId === l.id ? 0.7 : 1 }}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
