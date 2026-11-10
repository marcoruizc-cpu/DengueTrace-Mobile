import { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import type { MapCanvasProps } from './MapCanvas';
import { colors } from '../../utils/theme';

const RISK_COLORS = {
  LOW: '#16A34A',
  MEDIUM: '#F59E0B',
  HIGH: '#DC2626',
  CRITICAL: '#7F1D1D',
} as const;

export function MapCanvas({ districts, selectedId, risks, onSelect }: MapCanvasProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const markers = useMemo(() => districts
    .filter(d => d.latitude != null && d.longitude != null && Number.isFinite(d.latitude) && Number.isFinite(d.longitude))
    .map(d => ({
      id: d.id,
      name: d.name,
      latitude: d.latitude!,
      longitude: d.longitude!,
      color: risks[d.id] ? RISK_COLORS[risks[d.id]] : '#64748B',
    })), [districts, risks]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const payload = event.data;
      if (payload?.type !== 'DENGUETRACE_SELECT_DISTRICT') return;
      const id = Number(payload.id);
      if (Number.isSafeInteger(id) && markers.some(d => d.id === id)) onSelect(id);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [markers, onSelect]);

  const selected = markers.find(d => d.id === selectedId) ?? markers[0];
  const latitude = selected?.latitude ?? -12.0464;
  const longitude = selected?.longitude ?? -77.0428;
  const serializedMarkers = JSON.stringify(markers).replace(/</g, '\\u003c');
  const selectedMarker = selected?.id ?? null;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html,body,#map {margin:0;width:100%;height:100%;background:#e0f2fe}
  .leaflet-container {font-family:system-ui,-apple-system,sans-serif}
  #fallback {position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#334155;font:14px system-ui}
</style>
</head>
<body>
<div id="map"><div id="fallback">Cargando mapa interactivo…</div></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="document.getElementById('fallback').textContent='No se pudo cargar Leaflet. Comprueba la conexión a Internet.'"></script>
<script>
  const points = ${serializedMarkers};
  const selectedId = ${JSON.stringify(selectedMarker)};
  const map = L.map('map').setView([${latitude}, ${longitude}], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(map);
  points.forEach(function(p) {
    const active = p.id === selectedId;
    const marker = L.circleMarker([p.latitude, p.longitude], {
      radius: active ? 12 : 8,
      color: active ? '#0369a1' : '#ffffff',
      weight: active ? 3 : 2,
      fillColor: p.color,
      fillOpacity: 0.95
    }).addTo(map);
    const label = document.createElement('span');
    label.textContent = p.name;
    marker.bindTooltip(label);
    marker.on('click', function() {
      window.parent.postMessage({type:'DENGUETRACE_SELECT_DISTRICT', id:p.id}, '*');
    });
  });
</script>
</body>
</html>`;

  return (
    <View style={{ flex: 1, overflow: 'hidden', borderRadius: 12, backgroundColor: '#E0F2FE' }}>
      <iframe
        ref={frame}
        title="Mapa interactivo de distritos de DengueTrace"
        srcDoc={html}
        sandbox="allow-scripts"
        loading="lazy"
        style={{ width: '100%', height: '100%', border: 0 }}
      />
      <Text style={{ padding: 5, color: colors.textMuted, fontSize: 11 }}>
        Mapa: OpenStreetMap · {markers.length} distritos con coordenadas · Selecciona un marcador para consultar su ficha
      </Text>
    </View>
  );
}
