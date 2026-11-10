import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DistrictPicker } from '../components/DistrictPicker';
import { BarChart, Message, Panel, RiskBadge, Stat } from '../components/analytics/OverviewUI';
import { PredictionPanel } from '../components/analytics/PredictionPanel';
import { WeatherPanel } from '../components/analytics/WeatherPanel';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { alertService } from '../services/alertService';
import { districtService } from '../services/districtService';
import { historicalCaseService } from '../services/historicalCaseService';
import { predictiveService } from '../services/predictiveService';
import { colors } from '../utils/theme';

export default function DashboardWebScreen() {
  const { user } = useAuth();
  const [chosenDistrictId, setDistrictId] = useState<number | null>(user?.districtId ?? null);
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const alerts = useFetch(signal => alertService.getActive(signal), []);
  const districtId = chosenDistrictId ?? districts.data?.[0]?.id ?? null;
  const cases = useFetch(signal => districtId == null ? Promise.resolve([]) : historicalCaseService.getByDistrict(districtId, signal), [districtId]);
  const forecast = useFetch(signal => districtId == null ? Promise.resolve(null) : predictiveService.getLatest(districtId, signal), [districtId]);
  const selected = districts.data?.find(d => d.id === districtId);
  const localAlerts = (alerts.data ?? []).filter(a => a.active !== false && a.districtId === districtId);
  const priority = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;
  const strongestAlert = [...localAlerts].sort((a, b) => priority[b.riskLevel] - priority[a.riskLevel])[0];
  const activeAlerts = (alerts.data ?? []).filter(a => a.active !== false);
  const history = [...(cases.data ?? [])].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate))
    .slice(-12).map(d => ({ label: d.weekStartDate.slice(5), value: d.caseCount }));

  return (
    <ScrollView contentContainerStyle={s.page}>
      <View style={s.hero}>
        <Text style={s.brand}>DENGUETRACE · PANEL WEB</Text>
        <Text style={s.title}>Panel de vigilancia</Text>
        <Text style={s.heroText}>Casos registrados, pronóstico por distrito y alertas vigentes.</Text>
      </View>
      <View style={s.metrics}>
        <Stat label="Distritos registrados" value={districts.data?.length ?? (districts.loading ? '…' : '—')} note="Base de datos del sistema" />
        <Stat label="Alertas activas" value={alerts.data ? activeAlerts.length : alerts.loading ? '…' : '—'} note="Todas las localidades" />
        <Stat label="Alertas del distrito" value={alerts.data ? localAlerts.length : alerts.loading ? '…' : '—'} note={selected?.name ?? 'Selecciona un distrito'} />
      </View>
      {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
      {alerts.error ? <Message text={alerts.error.message} action="Reintentar" onAction={alerts.reload} /> : null}
      <Panel title="Explorar distrito">
        <DistrictPicker label="Distrito" districts={districts.data} value={districtId} onChange={setDistrictId} loading={districts.loading} />
        {selected ? <View style={s.line}><Text style={s.location}>{selected.name} · {selected.department}</Text><RiskBadge risk={strongestAlert?.riskLevel ?? forecast.data?.riskLevel} /></View> : null}
        {selected ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/district/[id]', params: { id: String(selected.id) } })} style={s.action}><Text style={s.actionText}>Abrir ficha completa del distrito →</Text></Pressable> : null}
      </Panel>
      <View style={s.columns}>
        <View style={s.column}>
          <Panel title="Casos históricos" subtitle="Hasta doce semanas recientes disponibles">
            {cases.loading ? <Text>Cargando…</Text> : cases.error ? <Message text={cases.error.message} action="Reintentar" onAction={cases.reload} /> : <BarChart data={history} />}
          </Panel>
        </View>
        <View style={s.column}>
          {forecast.error ? <Message text={forecast.error.message} action="Reintentar" onAction={forecast.reload} /> : null}
          {!forecast.loading && !forecast.error && districtId != null ? <PredictionPanel model={forecast.data} /> : null}
          {forecast.loading ? <Text>Cargando predicción…</Text> : null}
        </View>
      </View>
      {selected ? <WeatherPanel district={selected} /> : null}
      <Text style={s.foot}>Fuente epidemiológica: API de DengueTrace. El clima procede de Open-Meteo. Valores sin datos no se interpretan como riesgo bajo.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 22, paddingBottom: 44, gap: 18, backgroundColor: colors.background, width: '100%', maxWidth: 1200, alignSelf: 'center' },
  hero: { backgroundColor: '#0C4A6E', padding: 25, borderRadius: 18, gap: 7 },
  brand: { color: '#BAE6FD', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  heroText: { color: '#E0F2FE', lineHeight: 20 },
  metrics: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  columns: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  column: { flex: 1, minWidth: 280 },
  line: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  location: { color: colors.text, fontWeight: '700' },
  action: { backgroundColor: colors.primarySoft, borderRadius: 10, padding: 12 },
  actionText: { color: colors.primary, fontWeight: '800' },
  foot: { color: colors.textMuted, fontSize: 12 },
});
