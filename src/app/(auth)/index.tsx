import { Redirect } from 'expo-router';

/**
 * Sin sesión, el guard de app/_layout.tsx manda al grupo (auth).
 * En el navegador esa dirección queda como "/(auth)" y no tiene pantalla propia,
 * así que se redirige al login.
 */
export default function AuthIndex() {
  return <Redirect href="/login" />;
}
