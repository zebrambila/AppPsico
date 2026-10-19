import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/store/AppStore';
import { colors, radius } from '@/theme';
import { Txt } from './ui';

/** Aviso flutuante global; fica acima da barra de abas. */
export function Toast() {
  const { toast } = useApp();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.toast, { bottom: insets.bottom + 76 }]}
    >
      <Feather name="check" size={18} color={colors.toastIcon} />
      <Txt size={14} weight="semibold" color={colors.white} style={{ flex: 1 }}>
        {toast}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.ink,
    borderRadius: radius.md + 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
