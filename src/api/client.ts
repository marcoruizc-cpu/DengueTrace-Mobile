import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import type { AuthResponse } from '../types/api';
import { tokenStorage } from './tokenStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

if (!API_URL) {
  // Sin esto, axios llama a una dirección vacía y solo se ve "No pudimos conectar".
  console.error(
    '[DengueTrace] Falta EXPO_PUBLIC_API_URL en el archivo .env (ejemplo: http://172.20.10.3:8080/api/v1). ' +
      'Guárdalo y reinicia con: npx expo start --clear',
  );
} else {
  console.log(`[DengueTrace] API: ${API_URL}`);
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Instancia "limpia" solo para el refresh: sin interceptores, para evitar bucles.
const refreshClient = axios.create({ baseURL: API_URL, timeout: 15000 });

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

const isAuthCall = (url?: string) => !!url && url.startsWith('/auth/');

function isExpiringSoon(token: string, skewSeconds = 30) {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    return exp * 1000 < Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

// ---- Logout forzado: AuthProvider se suscribe para enterarse ----
const logoutListeners = new Set<() => void>();

export function onForcedLogout(listener: () => void) {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

async function forceLogout() {
  await tokenStorage.clear();
  logoutListeners.forEach(listener => listener());
}

// ---- Refresh single-flight ----
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await tokenStorage.getRefresh();
      if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');
      const { data } = await refreshClient.post<AuthResponse>('/auth/refresh', null, { params: { refreshToken } });
      await tokenStorage.save(data.accessToken, data.refreshToken);
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---- Request: adjunta el token, refrescándolo antes si está por vencer ----
api.interceptors.request.use(async config => {
  if (isAuthCall(config.url)) return config;
  let token = await tokenStorage.getAccess();
  if ((await tokenStorage.getRefresh()) && (!token || isExpiringSoon(token))) {
    try {
      token = await refreshAccessToken();
    } catch {
      await forceLogout();
      token = null;
    }
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- Response: 401 → refresh + reintento; GET recuperable → backoff ----
const MAX_RETRIES = 2;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (!config || axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status;

    if (status === 401 && !isAuthCall(config.url) && !config._retry && (await tokenStorage.getRefresh())) {
      config._retry = true;
      try {
        config.headers.Authorization = `Bearer ${await refreshAccessToken()}`;
        return api(config);
      } catch {
        await forceLogout();
        return Promise.reject(error);
      }
    }

    const isGet = (config.method ?? 'get').toLowerCase() === 'get';
    const recoverable = !error.response || error.code === 'ECONNABORTED' || [502, 503, 504].includes(status ?? 0);
    config._retryCount = config._retryCount ?? 0;
    if (isGet && recoverable && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      await sleep(500 * 2 ** (config._retryCount - 1));
      return api(config);
    }
    return Promise.reject(error);
  },
);
