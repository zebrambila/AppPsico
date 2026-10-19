import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { SessionRow } from '@/components/SessionRow';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Display,
  IconBox,
  PressableCard,
  Row,
  Screen,
  SectionTitle,
  Txt,
} from '@/components/ui';
import { fmtCabecalho, moeda, plural } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { iniciaisDe, useAuth } from '@/store/AuthStore';
import { sessoesDoDia, soma } from '@/store/selectors';
import { colors, radius } from '@/theme';

export default function Inicio() {
  const { hoje, sessoes, lancamentos, paciente, confirmarSessao, showToast } = useApp();
  const { usuario, sair } = useAuth();
  const primeiroNomeUsuario = usuario?.nome.split(' ')[0] ?? '';

  const deHoje = sessoesDoDia(sessoes, hoje);
  const realizadas = deHoje.filter((s) => s.status === 'realizada').length;
  const proxima = deHoje.find((s) => s.status === 'confirmada' || s.status === 'pendente');
  const proximoPac = proxima ? paciente(proxima.pacienteId) : undefined;
  const abertos = lancamentos.filter((l) => !l.pago);
  const aReceber = soma(abertos);
  const aConfirmar = deHoje.filter((s) => s.status === 'pendente');

  const abrirPaciente = (id: string) => router.push({ pathname: '/paciente/[id]', params: { id } });
  const registrar = (sessaoId: string, pacienteId: string) =>
    router.push({ pathname: '/sessao/registrar', params: { sessaoId, pacienteId } });

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 4 }}>
          <Txt size={13} weight="medium" color={colors.muted}>
            {fmtCabecalho(hoje)}
          </Txt>
          <Display>Bom dia, {primeiroNomeUsuario}</Display>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          onPress={() => {
            sair();
            showToast('Você saiu da conta');
          }}
          hitSlop={6}
        >
          <Avatar iniciais={iniciaisDe(usuario?.nome ?? '')} dark />
        </Pressable>
      </Row>

      {proxima && proximoPac ? (
        <View style={{ backgroundColor: colors.primary, borderRadius: radius.xl, padding: 20, gap: 14 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt size={13} weight="semibold" color={colors.onPrimaryMuted}>
              Próxima sessão · hoje
            </Txt>
            <View style={{ backgroundColor: colors.primaryDeep, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
              <Txt size={12} weight="semibold" color={colors.white}>
                {proxima.modalidade}
              </Txt>
            </View>
          </Row>
          <View style={{ gap: 2 }}>
            <Txt size={30} weight="extrabold" color={colors.white} style={{ letterSpacing: -0.6 }}>
              {proxima.hora}
            </Txt>
            <Txt size={18} weight="semibold" color={colors.white}>
              {proximoPac.nome}
            </Txt>
            <Txt size={13} color={colors.onPrimaryMuted}>
              {proxima.duracaoMin} min · R$ {proxima.valor}
            </Txt>
          </View>
          <Row style={{ gap: 10 }}>
            <Button label="Abrir ficha" variant="light" style={{ flex: 1 }} onPress={() => abrirPaciente(proximoPac.id)} />
            <Button
              label="Registrar"
              variant="ghostOnDark"
              style={{ flex: 1 }}
              onPress={() => registrar(proxima.id, proximoPac.id)}
            />
          </Row>
        </View>
      ) : (
        <Card>
          <Txt weight="bold">Agenda de hoje concluída</Txt>
          <Txt size={13} color={colors.muted}>
            Não há mais sessões marcadas para hoje.
          </Txt>
        </Card>
      )}

      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <Card style={{ flex: 1, padding: 14, gap: 4 }}>
          <Txt size={22} weight="extrabold">
            {deHoje.length}
          </Txt>
          <Txt size={12} color={colors.muted}>
            sessões hoje
          </Txt>
        </Card>
        <Card style={{ flex: 1, padding: 14, gap: 4 }}>
          <Txt size={22} weight="extrabold">
            {realizadas}
          </Txt>
          <Txt size={12} color={colors.muted}>
            {realizadas === 1 ? 'realizada' : 'realizadas'}
          </Txt>
        </Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${moeda(aReceber)} a receber`}
          onPress={() => router.navigate({ pathname: '/financeiro', params: { filtro: 'pendentes' } })}
          style={{ flex: 1, padding: 14, gap: 4, borderRadius: radius.lg, backgroundColor: colors.warnBg }}
        >
          <Txt size={20} weight="extrabold" color={colors.warnInk}>
            {moeda(aReceber)}
          </Txt>
          <Txt size={12} color={colors.warnInk}>
            a receber
          </Txt>
        </Pressable>
      </Row>

      <View style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <SectionTitle>Hoje</SectionTitle>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/agenda')} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Txt size={14} weight="semibold" color={colors.primary}>
              Ver agenda
            </Txt>
          </Pressable>
        </Row>
        {deHoje.map((s) => {
          const p = paciente(s.pacienteId);
          return p ? <SessionRow key={s.id} sessao={s} paciente={p} onPress={() => abrirPaciente(p.id)} /> : null;
        })}
      </View>

      <View style={{ gap: 10 }}>
        <SectionTitle>Pendências</SectionTitle>
        {abertos.length > 0 ? (
          <PressableCard
            onPress={() => router.navigate({ pathname: '/financeiro', params: { filtro: 'pendentes' } })}
            style={{ borderWidth: 1, borderColor: colors.line }}
          >
            <IconBox icon="dollar-sign" tone="warn" />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt weight="semibold">{plural(abertos.length, 'pagamento em aberto', 'pagamentos em aberto')}</Txt>
              <Txt size={12} color={colors.muted}>
                Total de {moeda(aReceber)} · enviar lembrete
              </Txt>
            </View>
          </PressableCard>
        ) : null}
        {aConfirmar.map((s) => {
          const p = paciente(s.pacienteId);
          if (!p) return null;
          return (
            <PressableCard key={s.id} onPress={() => abrirPaciente(p.id)} style={{ borderWidth: 1, borderColor: colors.line }}>
              <IconBox icon="calendar" />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt weight="semibold">Confirmar sessão de {p.nome}</Txt>
                <Txt size={12} color={colors.muted}>
                  Hoje às {s.hora} · ainda sem resposta
                </Txt>
              </View>
              <Button
                label="Confirmar"
                size="sm"
                variant="outline"
                onPress={() => {
                  confirmarSessao(s.id);
                  showToast(`Sessão de ${p.nome} confirmada`);
                }}
              />
            </PressableCard>
          );
        })}
        {abertos.length === 0 && aConfirmar.length === 0 ? <Chip label="Tudo em dia" tone="success" /> : null}
      </View>
    </Screen>
  );
}
