import { useEffect, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import type { MapCanvasProps } from './MapCanvas';
import { RISK_META } from '../../utils/constants';

const LIMA = { latitude: -12.0464, longitude: -77.0428, latitudeDelta: 0.35, longitudeDelta: 0.35 };

export function MapCanvas({ districts, selectedId, risks, onSelect }: MapCanvasProps) {
  const map = useRef<MapView>(null);
  const selected = districts.find(d => d.id === selectedId);
  useEffect(() => {
    if (selected?.latitude != null && selected?.longitude != null) {
      map.current?.animateToRegion({
        latitude: selected.latitude,
        longitude: selected.longitude,
        latitudeDelta: 0.14,
        longitudeDelta: 0.14,
      }, 350);
    }
  }, [selected?.latitude, selected?.longitude]);

  return (
    <MapView
      ref={map}
      style={{ flex: 1 }}
      initialRegion={LIMA}
      showsUserLocation={false}
      showsCompass
      accessibilityLabel="Mapa interactivo de distritos"
    >
      {districts.filter(d => d.latitude != null && d.longitude != null).map(d => (
        <Marker
          key={d.id}
          coordinate={{ latitude: d.latitude!, longitude: d.longitude! }}
          title={d.name}
          description={risks[d.id] ? `Alerta: ${RISK_META[risks[d.id]].label}` : 'Sin alerta activa registrada'}
          pinColor={risks[d.id] ? RISK_META[risks[d.id]].color : '#64748B'}
          onPress={() => onSelect(d.id)}
        />
      ))}
    </MapView>
  );
}
