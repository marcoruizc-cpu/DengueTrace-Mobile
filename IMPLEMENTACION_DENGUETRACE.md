# DengueTrace · Frontend web y móvil (integrado con el backend)

Código preparado sobre el repositorio original **Expo SDK 58 + React Native + TypeScript**. El backend de Spring Boot **no fue modificado**. Los contratos indicados abajo se comprobaron con el código del backend.

## Qué corresponde a cada fase

| Fase | Pantalla | Archivo principal | Datos |
|---|---|---|---|
| Web | Panel | `src/screens/DashboardWebScreen.tsx` | Distritos, alertas, casos, modelo, clima externo |
| Web | Mapa interactivo | `src/screens/MapScreen.tsx` + `src/components/map/MapCanvas.web.tsx` | Distritos, coordenadas, alertas |
| Web | Detalle del distrito | `src/screens/DistrictScreen.tsx` | Datos, gráfico de casos, modelo, alertas, clima |
| Web | Autorreporte | `src/screens/ReportScreen.tsx` | Publica síntomas (JWT); ubicación opcional |
| Web | Alertas | `src/screens/AlertsScreen.tsx` | Alertas activas, filtro por distrito |
| Android/iOS | Mapa | `src/components/map/MapCanvas.native.tsx` | React Native Maps y alertas por distrito |
| Android/iOS | Modelo predictivo | `src/screens/ModelScreen.tsx` | Consulta `/latest`, casos y clima; generación solo ADMIN/MODERATOR |
| Web y móvil | Clima externo | `src/services/weatherService.ts` | Open-Meteo, consulta por coordenadas |

### Contratos del backend examinados

- `GET /api/v1/districts` — lista con `id`, `name`, `department`, `province`, `population`, `latitude` y `longitude`.
- `GET /api/v1/districts/{id}` — ficha del distrito.
- `GET /api/v1/historical-cases/district/{id}` — `caseCount`, `weekStartDate`.
- `GET /api/v1/predictive-models/district/{id}/latest` — `projectedWeek1..4`, `riskLevel`, `confidenceLevel`, etc. Si no hay predicción el servidor devuelve **404** y el servicio del frontend devuelve `null`.
- `POST /api/v1/predictive-models/district/{id}/generate` — **solo ADMIN/MODERATOR** y exige al menos 4 semanas con casos históricos; el frontend oculta esta acción a roles USER.
- `GET /api/v1/alerts` y `/alerts/district/{id}` — alertas activas y por distrito.
- `POST /api/v1/reports` — **requiere JWT**; cuerpo `{districtId, latitude?, longitude?, symptoms}`. Síntomas enviados como texto, no como array.
- `GET /api/v1/reports/me` — reportes del usuario autenticado.
- `GET /api/v1/climate-data/district/{id}` — datos climáticos almacenados, consulta autenticada.

**Interpretación de datos:** Los marcadores usan riesgo de alertas reales del backend, sin deducir que no haya riesgo en distritos sin alerta. La predicción viene exclusivamente del backend y no es diagnóstico. `confidenceLevel` es un valor de **0 a 1**, mostrado como porcentaje en la pantalla. El clima de Open-Meteo se presenta por separado; no actualiza el modelo.

### APIs externas

- **Web:** mapa interactivo Leaflet 1.9.4 (CDN Unpkg) con mosaicos de **OpenStreetMap**. Presenta todos los distritos con coordenadas y permite seleccionar marcadores. Requiere internet y conexión al CDN/servidor de mapas. No representa polígonos ni un mapa de calor.
- **Android/iOS:** `react-native-maps` con marcadores. La configuración `app.config.ts` del repo original lee `GOOGLE_MAPS_ANDROID_KEY` para las compilaciones Android que la requieran. No publiques esa clave en el código fuente; restringe la clave en Google Cloud.
- **Clima:** API pública HTTPS de **Open-Meteo**, variables actuales `temperature_2m`, `relative_humidity_2m` y `precipitation`, sin clave. Requiere latitud y longitud del distrito.
- **Backend:** conserva su integración propia con Google Maps Geocoding para ubicar reportes, por lo que el frontend normalmente envía `districtId` conocido y GPS solo como opción.

## Instalar en IntelliJ y ejecutar

1. Abre el repositorio **DengueTrace-Mobile** original en IntelliJ.
2. Abre la rama que contiene la integración.
3. Crea el archivo `.env` (si ya existe, consérvalo y edítalo):

```env
EXPO_PUBLIC_API_URL=https://TU-DOMINIO-REAL/api/v1
```

Usa la URL **real** del backend desplegado, con `/api/v1` (sin barra final). No pongas el dominio inventado del ejemplo en producción. La variable `EXPO_PUBLIC_` es pública, así que no debe contener secretos.

4. Desde la raíz del proyecto ejecuta:

```bash
npm ci
node scripts/check-backend.mjs https://TU-DOMINIO-REAL/api/v1
npx tsc --noEmit
npm run web
```

Para la app móvil: `npm start` y abre un simulador/dispositivo. Si vas a compilar Android/iOS en EAS, configura las credenciales de mapas/Firebase por separado en el entorno de build.

5. Verifica el login y las rutas **Panel**, **Mapa**, **Detalle del distrito**, **Autorreporte**, **Alertas** (web) y **Mapa**, **Modelo**, **Clima** (mobile). Los GET públicos se prueban con `scripts/check-backend.mjs`; reportes, climas privados y generación necesitan JWT/permisos para validarlos.
6. Revisa **CORS** del backend para el dominio donde publicarás la web. En el ZIP del backend, la variable de entorno `CORS_ORIGINS` controla los orígenes admitidos; el valor por defecto incluye solo `localhost:3000` y `localhost:5173`. Si en producción ya se configuró, no necesitas tocarlo.
