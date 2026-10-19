import Feather from '@expo/vector-icons/Feather';
import { View } from 'react-native';

import { colors } from '@/theme';
import { Row, Txt } from './ui';

export const NOME_APP = 'Psico';

export function Logo() {
  return (
    <Row style={{ gap: 10 }} accessible accessibilityLabel={NOME_APP}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="heart" size={22} color={colors.white} />
      </View>
      <Txt size={18} weight="extrabold">
        {NOME_APP}
      </Txt>
    </Row>
  );
}
