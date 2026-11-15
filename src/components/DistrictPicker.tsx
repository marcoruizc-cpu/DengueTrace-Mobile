import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../utils/theme';

type DistrictOption<Id> = {
  id: Id;
  name: string;
  department: string;
  province: string | null;
};

interface DistrictPickerProps<Id extends number | string> {
  label: string;
  value: Id | null;
  onChange: (districtId: Id | null) => void;
  districts: DistrictOption<Id>[] | null;
  loading?: boolean;
  emptyLabel?: string;
  error?: string;
  onRetry?: () => void;
}

function searchable(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function DistrictPicker<Id extends number | string>({
  label, value, onChange, districts, loading, emptyLabel = 'Elegir después', error, onRetry,
}: DistrictPickerProps<Id>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = districts?.find(d => d.id === value);
  const empty = districts?.length === 0;
  const fieldText = loading ? 'Cargando distritos…' : empty ? 'No hay distritos registrados' :
    selected ? `${selected.name} · ${selected.province} · ${selected.department}` : emptyLabel;

  const filtered = useMemo(() => {
    if (!districts) return [];
    const sorted = [...districts].sort((a,b) => a.name.localeCompare(b.name, 'es', {sensitivity: 'base'}));
    const q = searchable(query.trim());
    if (!q) return sorted.slice(0,10);
    return sorted.filter(district =>
      searchable([district.name, district.province, district.department].join(' ')).includes(q));
  }, [districts, query]);

  const choose = (id: Id | null) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={loading || empty || !!error}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${fieldText}`}
        style={[styles.field, error ? { borderColor: colors.danger } : null]}
      >
        <Text style={{ color: selected ? colors.text : colors.textMuted }}>
          {fieldText}
        </Text>
      </Pressable>
      {error && onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Reintentar</Text>
        </Pressable>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{label}</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Distrito, provincia o departamento"
            accessibilityLabel="Buscar distrito, provincia o departamento"
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
                <Text style={styles.optionSub}>{[item.province, item.department].filter(Boolean).join(' · ')}</Text>
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
