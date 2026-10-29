import { router } from 'expo-router';

import { PacienteForm } from '@/components/PacienteForm';
import { BackButton, Screen, Txt } from '@/components/ui';
import { useApp } from '@/store/AppStore';

export default function NovoPaciente() {
  const { criarPaciente, showToast } = useApp();

  return (
    <Screen>
      <BackButton />
      <Txt accessibilityRole="header" size={20} weight="bold">
        Novo paciente
      </Txt>
      <PacienteForm
        labelBotao="Cadastrar paciente"
        onSalvar={async (dados) => {
          const criado = await criarPaciente(dados);
          showToast(`${criado.nome} foi cadastrado`);
          router.replace({ pathname: '/paciente/[id]', params: { id: criado.id } });
        }}
      />
    </Screen>
  );
}
