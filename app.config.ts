import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Lo fijo va en app.json; aquí solo lo que viene de variables de entorno de EAS al compilar
 * (nunca se escriben keys en el repo).
 */
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    android: {
      ...config.android,
      package: 'com.denguetrace.app',
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
      config: {
        ...config.android?.config,
        googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_KEY },
      },
    },
  }) as ExpoConfig;
