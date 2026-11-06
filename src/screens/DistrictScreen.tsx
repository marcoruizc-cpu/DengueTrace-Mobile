import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../utils/theme';

/** Pantalla pendiente: la implementa la Persona C. */
export default function DistrictScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Distrito (pendiente)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { fontSize: 18, color: colors.textMuted },
});
