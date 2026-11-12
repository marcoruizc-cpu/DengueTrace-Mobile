# DengueTrace — App Móvil

Aplicación móvil (React Native + Expo) de DengueTrace, la plataforma de vigilancia y predicción del dengue en Perú. Consume exclusivamente la API REST de [DengueTrace-Backend](https://github.com/elireyes-web/DengueTrace-Backend).

- **Build de Android (EAS):** https://expo.dev/accounts/marcoruizc/projects/denguetrace/builds/31d3d616-996f-4c8b-827d-9836f737da31 (APK para Android)
- **Web:** [DengueTrace-Web](https://github.com/marcoruizc-cpu/DengueTrace-Web)

## Stack

Expo SDK 58 · React Native · TypeScript · Expo Router · Axios · expo-secure-store · React Hook Form + Zod · react-native-maps · expo-location · expo-sensors · expo-notifications · NetInfo

## Funcionalidades

- Registro, inicio de sesión y perfil, con la sesión guardada en **SecureStore** (Keychain/Keystore) y renovación automática del token.
- Cliente Axios centralizado con interceptores, `AbortController` y reintentos con backoff en GET.
- Pestañas: Mapa de riesgo, Modelo predictivo, Reporte de síntomas, Alertas/Noticias y Perfil.
- **Sensores:** GPS (expo-location) para ubicar al usuario y asociar el reporte a su distrito, y acelerómetro (expo-sensors), con manejo de permisos y alternativas si no están disponibles.
- **APIs externas:** mapas (react-native-maps) y clima actual (Open-Meteo).
- Notificaciones push con Firebase Cloud Messaging (en builds de EAS).
- Detección de conexión con banner "Sin conexión", estados de carga, error con reintento y vacío.

## Cómo correrlo

Requisitos: Node 20 o superior y la app **Expo Go** en el celular.

```bash
npm install
cp .env.example .env   # en Windows: copy .env.example .env
npx expo start --clear
```

Escanear el código QR con Expo Go. El celular y la computadora deben estar en la misma red si el backend es local.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base de la API, por ejemplo `http://<ip-del-backend>:8080/api/v1`. Desde el celular no se puede usar `localhost`: va la IP de la computadora o del servidor. |

En los builds de EAS, las variables se configuran con `eas env:create` (entorno `preview`); la key de Google Maps para Android y `google-services.json` también van como variables secretas de EAS, nunca en el repositorio.

## Estructura

```text
src/
  app/         rutas de Expo Router: (auth), (tabs), district/[id]
  api/         cliente Axios, SecureStore y errores
  services/    una capa por recurso del backend
  contexts/    estado global de la sesión
  hooks/       useAuth, useFetch, red, push, ubicación, sensores
  components/  componentes reutilizables
  screens/     pantallas
  types/       tipos que reflejan los DTOs del backend
  utils/       constantes, geolocalización, tema
```

## Build y publicación

```bash
npx eas-cli@latest build -p android --profile preview   # genera el APK instalable
npx eas-cli@latest update --branch preview --message "fix: ..."   # corrige JS sin recompilar
```
