import Feather from '@expo/vector-icons/Feather';
import { Pressable, type StyleProp, type TextStyle } from 'react-native';

import { Row, Txt } from '@/components/ui';
import { colors } from '@/theme';

export function ValorMascarado({
  valor,
  visivel,
  onToggle,
  size = 22,
  weight = 'extrabold',
  color = colors.ink,
  style,
}: {
  valor: string;
  visivel: boolean;
  onToggle: () => void;
  size?: number;
  weight?: Parameters<typeof Txt>[0]['weight'];
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Row style={{ gap: 6 }}>
      <Txt size={size} weight={weight} color={color} style={style}>
        {visivel ? valor : '••••'}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visivel ? 'Ocultar valor' : 'Mostrar valor'}
        onPress={onToggle}
        hitSlop={10}
        style={{ minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center' }}
      >
        <Feather name={visivel ? 'eye-off' : 'eye'} size={16} color={color} />
      </Pressable>
    </Row>
  );
}
