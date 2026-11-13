import { useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { MapCanvasProps } from './MapCanvas';
import { RISK_META } from '../../utils/constants';

const LIMA = { latitude: -12.0464, longitude: -77.0428, latitudeDelta: 0.35, longitudeDelta: 0.35 };
const MAX_MARKERS = 100;

export function MapCanvas<Id extends number | string>({ districts, selectedId, risks, onSelect }: MapCanvasProps<Id>) {
  const map = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(LIMA);
  const selected = districts.find(d => d.id === selectedId);
  const markers = useMemo(() => {
    const located = districts.flatMap(district => {
      const { latitude, longitude } = district;
      if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [{ id: district.id, name: district.name, latitude, longitude }];
    });
    if (located.length <= MAX_MARKERS) return located;

    const halfLatitude = region.latitudeDelta / 2;
    const halfLongitude = region.longitudeDelta / 2;
    const distance = (point: (typeof located)[number]) =>
      Math.abs(point.latitude - region.latitude) + Math.abs(point.longitude - region.longitude);
    return located
      .filter(point => Math.abs(point.latitude - region.latitude) <= halfLatitude &&
        Math.abs(point.longitude - region.longitude) <= halfLongitude)
      .sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId) || distance(a) - distance(b))
      .slice(0, MAX_MARKERS);
  }, [districts, region, selectedId]);

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
      onRegionChangeComplete={setRegion}
      accessibilityLabel="Mapa interactivo de distritos"
    >
      {markers.map(({ id, name, latitude, longitude }) => {
        const risk = risks[id];
        return (
          <Marker
            key={id}
            coordinate={{ latitude, longitude }}
            title={name}
            description={risk ? `Alerta: ${RISK_META[risk].label}` :
              typeof id === 'string' ? 'Distrito de referencia' : 'Sin alerta activa registrada'}
            pinColor={risk ? RISK_META[risk].color : '#64748B'}
            onPress={() => onSelect(id)}
          />
        );
      })}
    </MapView>
  );
}
