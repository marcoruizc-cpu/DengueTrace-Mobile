export interface CurrentWeather {
  temperature: number;
  humidity: number;
  precipitationMm: number;
  observedAt: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    precipitation?: number;
    time?: string;
  };
}

export const weatherService = {
  async getCurrent(latitude: number, longitude: number, signal?: AbortSignal): Promise<CurrentWeather> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new Error('Coordenadas no válidas para consultar el clima.');
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,relative_humidity_2m,precipitation&timezone=America%2FLima';
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`No se pudo consultar Open-Meteo (${response.status}).`);
    const body: OpenMeteoResponse = await response.json();
    const { temperature_2m, relative_humidity_2m, precipitation, time } = body.current ?? {};
    if (![temperature_2m, relative_humidity_2m, precipitation].every(v => typeof v === 'number') || !time) {
      throw new Error('Open-Meteo devolvió datos incompletos.');
    }
    return { temperature: temperature_2m!, humidity: relative_humidity_2m!, precipitationMm: precipitation!, observedAt: time };
  },
};
