import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export interface AccelerationSample { x: number; y: number; z: number }
type State = 'idle' | 'starting' | 'active' | 'denied' | 'unavailable' | 'error';

/** Lectura puntual en primer plano. No guarda ni envía mediciones al servidor. */
export function useAccelerometer() {
  const [sample, setSample] = useState<AccelerationSample | null>(null);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);
  const subscription = useRef<{ remove: () => void } | null>(null);
  const requestId = useRef(0);

  const stop = useCallback(() => {
    requestId.current += 1;
    subscription.current?.remove();
    subscription.current = null;
    setSample(null);
    setState('idle');
    setError(null);
  }, []);

  const start = useCallback(async () => {
    if (subscription.current || state === 'starting') return;
    const id = ++requestId.current;
    setState('starting');
    setError(null);
    try {
      // En iOS o navegadores puede requerirse consentimiento del usuario.
      const permission = await Accelerometer.requestPermissionsAsync();
      if (requestId.current !== id) return;
      if (!permission.granted) {
        setState('denied');
        setError('No se autorizó el sensor. Puedes habilitarlo en los ajustes de tu dispositivo.');
        return;
      }
      const available = await Accelerometer.isAvailableAsync();
      if (requestId.current !== id) return;
      if (!available) {
        setState('unavailable');
        setError('Este dispositivo o navegador no dispone de un acelerómetro accesible.');
        return;
      }
      // 4 muestras por segundo: suficientes para una demostración sin consumo excesivo.
      Accelerometer.setUpdateInterval(250);
      subscription.current = Accelerometer.addListener(({ x, y, z }) => {
        if ([x, y, z].every(Number.isFinite)) setSample({ x, y, z });
      });
      setState('active');
    } catch {
      if (requestId.current !== id) return;
      setState('error');
      setError('No fue posible iniciar el acelerómetro. Intenta de nuevo en un teléfono físico.');
    }
  }, [state]);

  useEffect(() => {
    const appSubscription = AppState.addEventListener('change', next => {
      if (next !== 'active') stop();
    });
    return () => {
      requestId.current += 1;
      subscription.current?.remove();
      subscription.current = null;
      appSubscription.remove();
    };
  }, [stop]);

  return { sample, state, error, start, stop };
}
