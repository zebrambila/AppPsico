import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import type { StatusSessao } from '@/data/types';
import { colors, fonts, radius, spacing, type FontWeight } from '@/theme';

/* ---------- Texto ---------- */

type TxtProps = TextProps & {
  size?: number;
  weight?: FontWeight;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function Txt({ size = 15, weight = 'regular', color = colors.ink, style, ...rest }: TxtProps) {
  return <Text {...rest} style={[{ fontSize: size, fontFamily: fonts[weight], color }, style]} />;
}

export function Display({ children }: { children: ReactNode }) {
  return (
    <Txt accessibilityRole="header" size={26} weight="bold" style={{ letterSpacing: -0.5 }}>
      {children}
    </Txt>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Txt accessibilityRole="header" size={17} weight="bold">
      {children}
    </Txt>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  edges = ['top'],
  contentStyle,
  footer,
}: {
  children: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <ScrollView
        contentContainerStyle={[styles.screenContent, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style, ...rest }: ViewProps & { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {children}
    </View>
  );
}

/* ---------- Botões ---------- */

type ButtonVariant = 'primary' | 'outline' | 'light' | 'ghostOnDark' | 'warn';

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  icon,
  size = 'md',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  icon?: ComponentProps<typeof Feather>['name'];
  size?: 'sm' | 'md' | 'lg';
  accessibilityLabel?: string;
}) {
  const v = buttonVariants[variant];
  const h = size === 'sm' ? 32 : size === 'lg' ? 52 : 46;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: h, backgroundColor: v.bg, borderColor: v.border, borderRadius: size === 'sm' ? radius.pill : radius.md },
        size === 'sm' && { paddingHorizontal: 12 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={size === 'sm' ? 14 : 18} color={v.fg} /> : null}
      <Txt size={size === 'sm' ? 12 : size === 'lg' ? 16 : 15} weight="bold" color={v.fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  outline: { bg: 'transparent', fg: colors.primary, border: colors.primary },
  light: { bg: colors.white, fg: colors.primary, border: colors.white },
  ghostOnDark: { bg: 'transparent', fg: colors.white, border: colors.primaryBorder },
  warn: { bg: colors.warnBg, fg: colors.warnInk, border: colors.warnBg },
};

export function BackButton({ label = 'Voltar' }: { label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' }}
    >
      <Feather name="chevron-left" size={22} color={colors.primary} />
      <Txt weight="semibold" color={colors.primary}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ---------- Chips / status ---------- */

export type ChipTone = 'neutral' | 'success' | 'warn' | 'danger';

const toneColors: Record<ChipTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.neutralBg, fg: colors.inkSoft },
  success: { bg: colors.primarySoft, fg: colors.primaryInk },
  warn: { bg: colors.warnBg, fg: colors.warnInk },
  danger: { bg: colors.dangerBg, fg: colors.dangerInk },
};

export function Chip({ label, tone }: { label: string; tone: ChipTone }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Txt size={12} weight="semibold" color={c.fg}>
        {label}
      </Txt>
    </View>
  );
}

export const statusInfo: Record<StatusSessao, { label: string; tone: ChipTone }> = {
  realizada: { label: 'Realizada', tone: 'neutral' },
  confirmada: { label: 'Confirmada', tone: 'success' },
  pendente: { label: 'A confirmar', tone: 'warn' },
  faltou: { label: 'Faltou', tone: 'danger' },
  remarcada: { label: 'Remarcada', tone: 'neutral' },
};

export function StatusChip({ status }: { status: StatusSessao }) {
  const s = statusInfo[status];
  return <Chip label={s.label} tone={s.tone} />;
}

/** Botão-pílula selecionável (filtros, métodos de pagamento, presença). */
export function Pill({
  label,
  selected,
  onPress,
  variant = 'primary',
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'primary' | 'soft' | 'dark';
  style?: StyleProp<ViewStyle>;
}) {
  const sel =
    variant === 'soft'
      ? { bg: colors.primarySoft, fg: colors.primaryInk, border: colors.primary }
      : variant === 'dark'
        ? { bg: colors.ink, fg: colors.white, border: colors.ink }
        : { bg: colors.primary, fg: colors.white, border: colors.primary };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: selected ? sel.bg : colors.white,
          borderColor: selected ? sel.border : colors.line,
        },
        style,
      ]}
    >
      <Txt size={13} weight="semibold" color={selected ? sel.fg : colors.inkSoft}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Controle segmentado (abas da ficha do paciente). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && { backgroundColor: colors.white }]}
          >
            <Txt size={13} weight="semibold" color={on ? colors.ink : colors.muted}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Outros ---------- */

export function Avatar({ iniciais, size = 44, dark = false }: { iniciais: string; size?: number; dark?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: dark ? colors.primary : colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Txt size={size > 50 ? 20 : 14} weight="bold" color={dark ? colors.white : colors.primaryInk}>
        {iniciais}
      </Txt>
    </View>
  );
}

export function IconBox({
  icon,
  tone = 'success',
}: {
  icon: ComponentProps<typeof Feather>['name'];
  tone?: ChipTone;
}) {
  const c = toneColors[tone];
  return (
    <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
      <Feather name={icon} size={18} color={c.fg} />
    </View>
  );
}

export function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.lineSoft }]}>
      <Txt size={14} color={colors.muted}>
        {label}
      </Txt>
      <Txt size={14} weight="semibold">
        {value}
      </Txt>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 32, gap: 6 }}>
      <Txt weight="bold">{title}</Txt>
      <Txt size={13} color={colors.muted} style={{ textAlign: 'center' }}>
        {subtitle}
      </Txt>
    </Card>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Txt size={13} weight="bold" color={colors.inkSoft}>
      {children}
    </Txt>
  );
}

export function PressableCard({ children, style, ...rest }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [styles.card, styles.pressableCard, pressed && { opacity: 0.8 }, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: spacing.screen, paddingTop: 20, paddingBottom: 32, gap: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  pressableCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'center' },
  pill: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.neutralBg,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
});
