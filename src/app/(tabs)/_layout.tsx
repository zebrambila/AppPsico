import Feather from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Feather>['name'];

const icon = (name: IconName) => {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} size={size - 2} color={typeof color === 'string' ? color : colors.muted} />;
  }
  return TabIcon;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="pacientes" options={{ title: 'Pacientes', tabBarIcon: icon('users') }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro', tabBarIcon: icon('credit-card') }} />
    </Tabs>
  );
}
