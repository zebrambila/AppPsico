import { router, useLocalSearchParams } from 'expo-router';

import { PacienteForm } from '@/components/PacienteForm';
import { BackButton, EmptyState, Screen, Txt } from '@/components/ui';
import { useApp } from '@/store/AppStore';

export default function EditarPaciente() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { paciente, editarPaciente } = useApp();
  const p = paciente(id);

  if (!p) {
    return (
      <Screen>
        <BackButton />
        <EmptyState title="Paciente não encontrado" subtitle="Volte e tente novamente." />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackButton />
      <Txt accessibilityRole="header" size={20} weight="bold">
        Editar paciente
      </Txt>
      <PacienteForm
        valoresIniciais={{
          nome: p.nome,
          frequencia: p.frequencia,
          diaFixo: p.diaFixo,
          horaFixa: p.horaFixa,
          modalidade: p.modalidade,
          valorSessao: p.valorSessao,
          desde: p.desde,
          telefone: p.telefone,
        }}
        labelBotao="Salvar alterações"
        onSalvar={async (dados) => {
          await editarPaciente(p.id, dados);
          router.back();
        }}
      />
    </Screen>
  );
}
