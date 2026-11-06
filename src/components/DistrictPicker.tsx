import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { District } from '../types/api';
import { colors } from '../utils/theme';

interface DistrictPickerProps {
  label: string;
  value: number | null;
  onChange: (districtId: number | null) => void;
  districts: District[] | null;
  loading?: boolean;
  emptyLabel?: string;
  error?: string;
}

/** Selector de distrito con buscador, en un modal. */
export function DistrictPicker({ label, value, onChange, districts, loading, emptyLabel = 'Elegir después', error }: DistrictPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = districts?.find(d => d.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!districts) return [];
    if (!q) return districts;
    return districts.filter(d => d.name.toLowerCase().includes(q) || d.department.toLowerCase().includes(q));
  }, [districts, query]);

  const choose = (id: number | null) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.name ?? emptyLabel}`}
        style={[styles.field, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted }}>
          {loading ? 'Cargando distritos…' : selected ? `${selected.name} (${selected.department})` : emptyLabel}
        </Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{label}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar distrito o departamento"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
            autoCorrect={false}
          />
          <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable onPress={() => choose(null)} style={styles.option}>
                <Text style={{ color: colors.textMuted }}>{emptyLabel}</Text>
              </Pressable>
            }
            ListEmptyComponent={<Text style={styles.empty}>No encontramos distritos con ese nombre.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => choose(item.id)} style={[styles.option, item.id === value && styles.optionSelected]}>
                <Text style={styles.optionText}>{item.name}</Text>
                <Text style={styles.optionSub}>{item.department}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={() => setOpen(false)} style={styles.close} accessibilityRole="button">
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontWeight: '600', color: colors.text },
  field: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, backgroundColor: colors.surface },
  error: { color: colors.danger, fontSize: 12 },
  modal: { flex: 1, paddingTop: 56, paddingHorizontal: 16, backgroundColor: colors.background },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: colors.surface },
  option: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  optionSelected: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: 16, color: colors.text },
  optionSub: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 24 },
  close: { paddingVertical: 16, alignItems: 'center' },
  closeText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});
