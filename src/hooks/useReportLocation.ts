import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export interface ReportCoordinates {
  latitude: number;
  longitude: number;
  /** Precisión horizontal estimada, en metros. */
  accuracy: number | null;
}

/** Solicita GPS únicamente por acción explícita del usuario; no rastrea en segundo plano. */
export function useReportLocation() {
  const [coordinates, setCoordinates] = useState<ReportCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      if (!(await Location.hasServicesEnabledAsync())) {
        setError('El GPS está desactivado. Activa la ubicación en tu teléfono o selecciona el distrito manualmente.');
        return;
      }
      const current = await Location.getForegroundPermissionsAsync();
      const permission = current.granted ? current : await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('No se concedió permiso de ubicación. Puedes enviar el reporte sin GPS, indicando tu distrito.');
        return;
      }
      const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!Number.isFinite(result.coords.latitude) || !Number.isFinite(result.coords.longitude)) {
        throw new Error('Coordenadas inválidas');
      }
      setCoordinates({
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
      });
    } catch {
      setError('No se pudo obtener la ubicación. Puedes seleccionar tu distrito manualmente y seguir con el reporte.');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clear = useCallback(() => {
    setCoordinates(null);
    setError(null);
  }, []);

  return { coordinates, loading, error, locate, clear };
}
