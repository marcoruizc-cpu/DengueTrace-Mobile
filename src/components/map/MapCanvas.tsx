import { Text, View } from 'react-native';
import type { District, RiskLevel } from '../../types/api';

export interface MapCanvasProps {
  districts: District[];
  selectedId: number | null;
  risks: Record<number, RiskLevel>;
  onSelect: (id: number) => void;
}

export function MapCanvas(_props: MapCanvasProps) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Mapa no disponible en esta plataforma.</Text></View>;
}
