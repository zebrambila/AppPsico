import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme';
import { Txt } from './ui';

type Props = TextInputProps & {
  label: string;
  optional?: boolean;
  error?: string | false;
  hint?: string;
  /** campo de senha com botão mostrar/ocultar */
  password?: boolean;
};

export function FormField({ label, optional, error, hint, password, style, ...input }: Props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Txt size={13} weight="bold" color={colors.inkSoft}>
        {label}
        {optional ? (
          <Txt size={13} weight="medium" color={colors.muted}>
            {' '}
            (opcional)
          </Txt>
        ) : null}
      </Txt>
      <View style={[styles.box, error ? { borderColor: colors.dangerInk } : null]}>
        <TextInput
          placeholderTextColor={colors.muted}
          accessibilityLabel={label}
          secureTextEntry={password && !visivel}
          autoCapitalize={password ? 'none' : input.autoCapitalize}
          {...input}
          style={[styles.input, style]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            onPress={() => setVisivel((v) => !v)}
            style={styles.eye}
          >
            <Feather name={visivel ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Txt size={12} weight="semibold" color={colors.dangerInk}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt size={12} color={colors.muted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md + 2,
    backgroundColor: colors.surface,
    paddingLeft: 14,
  },
  input: { flex: 1, minHeight: 48, fontSize: 15, fontFamily: fonts.regular, color: colors.ink, paddingRight: 14 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
