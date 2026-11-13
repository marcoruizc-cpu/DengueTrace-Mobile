import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DistrictPicker } from '../components/DistrictPicker';
import { MapCanvas } from '../components/map/MapCanvas';
import { Message, Panel, RiskBadge } from '../components/analytics/OverviewUI';
import { WeatherPanel } from '../components/analytics/WeatherPanel';
import catalog from '../data/distritos.json';
import { useAuth } from '../hooks/useAuth';
import { useFetch } from '../hooks/useFetch';
import { alertService } from '../services/alertService';
import { districtService } from '../services/districtService';
import type { RiskLevel } from '../types/api';
import { haversineKm } from '../utils/geo';
import { colors } from '../utils/theme';

const PRIORITY: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
const referenceDistricts = catalog.map(district => ({ ...district, id: district.ubigeo }));
const referenceLima = referenceDistricts.find(district => district.ubigeo === '150101') ?? referenceDistricts[0];
const referenceRisks = {};

function ReferenceMap({ reload }: { reload: () => void }) {
  const [districtId, setDistrictId] = useState<string | null>(referenceLima.id);
  const selected = referenceDistricts.find(district => district.id === districtId);

  return (
    <>
      <Message
        text="El servidor todavía no tiene distritos registrados. Puedes consultar el catálogo geográfico de referencia."
        action="Actualizar distritos"
        onAction={reload}
      />
      <DistrictPicker label="Buscar distrito de referencia" value={districtId} onChange={setDistrictId}
        districts={referenceDistricts} emptyLabel="Seleccionar distrito" />
      <View style={s.map}>
        <MapCanvas districts={referenceDistricts} selectedId={districtId} risks={referenceRisks} onSelect={setDistrictId} />
      </View>
      <Text style={s.subtitle}>Acerca el mapa o usa el buscador para localizar un distrito.</Text>
      {selected ? (
        <Panel title={selected.name} subtitle={`${selected.province} · ${selected.department}`}>
          <Text style={s.subtitle}>Ubigeo {selected.ubigeo}</Text>
          <Text style={s.subtitle}>Capital distrital: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</Text>
          <Text style={s.subtitle}>Los reportes, las alertas y las predicciones requieren el registro del distrito en el servidor.</Text>
        </Panel>
      ) : null}
    </>
  );
}

export default function MapScreen() {
  const { user } = useAuth();
  const districts = useFetch(signal => districtService.getAll(signal), []);
  const alerts = useFetch(signal => alertService.getActive(signal), []);
  const [chosenDistrictId, setSelectedId] = useState<number | null>(null);
  const preferred = districts.data?.find(d => d.id === user?.districtId);
  const lima = districts.data?.find(d => d.name.toLowerCase() === 'lima');
  const chosen = districts.data?.find(d => d.id === chosenDistrictId);
  const selected = chosen ?? preferred ?? lima ?? districts.data?.[0];
  const selectedId = selected?.id ?? null;

  const risks = useMemo(() => {
    const result: Record<number, RiskLevel> = {};
    for (const alert of alerts.data ?? []) {
      if (alert.active === false) continue;
      if (!result[alert.districtId] || PRIORITY[alert.riskLevel] > PRIORITY[result[alert.districtId]]) {
        result[alert.districtId] = alert.riskLevel;
      }
    }
    return result;
  }, [alerts.data]);

  const nearby = useMemo(() => {
    if (!selected || selected.latitude == null || selected.longitude == null) return [];
    return (districts.data ?? []).filter(d => d.latitude != null && d.longitude != null)
      .map(d => ({ ...d, km: haversineKm(selected.latitude!, selected.longitude!, d.latitude!, d.longitude!) }))
      .sort((a, b) => a.km - b.km).slice(0, 8);
  }, [districts.data, selected]);

  if (!districts.loading && !districts.error && districts.data?.length === 0) {
    return (
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.title}>Mapa de distritos</Text>
        <ReferenceMap reload={districts.reload} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>Mapa de vigilancia epidemiológica</Text>
      <Text style={s.subtitle}>Marcadores grises: sin alerta activa registrada. Los colores reflejan alertas del servidor, no estimaciones locales.</Text>
      {districts.error ? <Message text={districts.error.message} action="Reintentar" onAction={districts.reload} /> : null}
      {alerts.error ? <Message text={`Alertas: ${alerts.error.message}`} action="Reintentar" onAction={alerts.reload} /> : null}
      <DistrictPicker label="Buscar distrito" value={selectedId} onChange={setSelectedId} districts={districts.data} loading={districts.loading} emptyLabel="Seleccionar distrito" />
      <View style={s.map}><MapCanvas districts={districts.data ?? []} selectedId={selectedId} risks={risks} onSelect={setSelectedId} /></View>
      {selected ? (
        <Panel title={selected.name} subtitle={[selected.province, selected.department].filter(Boolean).join(' · ')}>
          <RiskBadge risk={risks[selected.id]} />
          <Pressable onPress={() => router.push({ pathname: '/district/[id]', params: { id: String(selected.id) } })} style={s.link} accessibilityRole="button">
            <Text style={s.linkText}>Ver detalle, gráficos y predicción del distrito →</Text>
          </Pressable>
        </Panel>
      ) : null}
      {nearby.length ? (
        <Panel title="Distritos cercanos" subtitle="Distancias aproximadas entre coordenadas de referencia, no límites distritales.">
          {nearby.map(d => (
            <Pressable key={d.id} onPress={() => setSelectedId(d.id)} style={s.row} accessibilityRole="button">
              <Text style={s.rowName}>{d.name} <Text style={s.distance}>{d.km.toFixed(1)} km</Text></Text>
              <RiskBadge risk={risks[d.id]} />
            </Pressable>
          ))}
        </Panel>
      ) : null}
      {selected ? <WeatherPanel district={selected} /> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 16, gap: 14, backgroundColor: colors.background, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, lineHeight: 20 },
  map: { height: 380, backgroundColor: '#E2E8F0', borderRadius: 14, overflow: 'hidden' },
  link: { padding: 12, backgroundColor: colors.primarySoft, borderRadius: 8 },
  linkText: { color: colors.primary, fontWeight: '800' },
  row: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { color: colors.text, fontWeight: '600', flexShrink: 1 },
  distance: { color: colors.textMuted, fontSize: 12, fontWeight: '400' },
});
