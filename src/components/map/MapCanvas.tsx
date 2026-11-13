import { Text, View } from 'react-native';
import type { District, RiskLevel } from '../../types/api';

export interface MapCanvasProps<Id extends number | string> {
  districts: (Pick<District, 'name' | 'latitude' | 'longitude'> & { id: Id })[];
  selectedId: Id | null;
  risks: Partial<Record<Id, RiskLevel>>;
  onSelect: (id: Id) => void;
}

export function MapCanvas<Id extends number | string>(_props: MapCanvasProps<Id>) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Mapa no disponible en esta plataforma.</Text></View>;
}
