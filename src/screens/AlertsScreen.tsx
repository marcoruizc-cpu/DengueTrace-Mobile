import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DistrictPicker } from '../components/DistrictPicker';
import { formatDate, Message, Panel, RiskBadge, Stat } from '../components/analytics/OverviewUI';
import { useFetch } from '../hooks/useFetch';
import { alertService } from '../services/alertService';
import { districtService } from '../services/districtService';
import { colors } from '../utils/theme';

export default function AlertsScreen() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const alerts = useFetch(signal => alertService.getActive(signal), []);
  const active = (alerts.data ?? []).filter(a => a.active !== false && (selectedId == null || a.districtId === selectedId));
  const high = active.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length;

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>Alertas epidemiológicas</Text>
      <Text style={s.muted}>Alertas activas registradas en DengueTrace. No se generan alertas basadas únicamente en el clima externo.</Text>
      <DistrictPicker label="Filtrar por distrito" value={selectedId} onChange={setSelectedId} districts={districts.data} loading={districts.loading} emptyLabel="Todos los distritos" />
      <View style={s.metrics}><Stat label="Alertas en el filtro" value={active.length} /><Stat label="Altas o críticas" value={high} /></View>
      {alerts.error ? <Message text={alerts.error.message} action="Reintentar" onAction={alerts.reload} /> : null}
      <Panel title="Listado de alertas">
        {alerts.loading ? <Text style={s.muted}>Cargando…</Text> : active.length ? active.map(a => (
          <Pressable key={a.id} onPress={() => router.push({ pathname: '/district/[id]', params: { id: String(a.districtId) } })} accessibilityRole="button" style={s.alert}>
            <View style={s.line}><Text style={s.name}>{a.districtName}</Text><RiskBadge risk={a.riskLevel} /></View>
            <Text style={s.body}>{a.message}</Text>
            <Text style={s.muted}>{formatDate(a.createdAt)} · Ver distrito →</Text>
          </Pressable>
        )) : !alerts.error ? <Text style={s.muted}>No hay alertas activas con este filtro.</Text> : null}
      </Panel>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, paddingBottom: 36, gap: 14, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  muted: { color: colors.textMuted, lineHeight: 20 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alert: { borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 14, gap: 8 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  name: { fontWeight: '800', color: colors.text, fontSize: 16 },
  body: { color: colors.text, lineHeight: 20 },
});
