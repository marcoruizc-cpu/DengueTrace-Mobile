import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Celular: SecureStore = Keychain (iOS) / Keystore (Android), cifrado (AsyncStorage guarda texto plano).
 * Web (expo start → w): SecureStore no existe, así que se usa sessionStorage, igual que en la web del proyecto.
 */
const ACCESS_KEY = 'dt_access';
const REFRESH_KEY = 'dt_refresh';
const isWeb = Platform.OS === 'web';
let accessCache: string | null = null; // evita leer el keychain en cada request

type WebStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
const webStorage = (globalThis as unknown as { sessionStorage?: WebStorage }).sessionStorage;

const storage = {
  get: (key: string): Promise<string | null> =>
    isWeb ? Promise.resolve(webStorage?.getItem(key) ?? null) : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    isWeb ? Promise.resolve(webStorage?.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> =>
    isWeb ? Promise.resolve(webStorage?.removeItem(key)) : SecureStore.deleteItemAsync(key),
};

export const tokenStorage = {
  async getAccess() {
    if (!accessCache) accessCache = await storage.get(ACCESS_KEY);
    return accessCache;
  },
  getRefresh: () => storage.get(REFRESH_KEY),
  async save(access: string, refresh: string) {
    accessCache = access;
    await Promise.all([storage.set(ACCESS_KEY, access), storage.set(REFRESH_KEY, refresh)]);
  },
  async clear() {
    accessCache = null;
    await Promise.all([storage.remove(ACCESS_KEY), storage.remove(REFRESH_KEY)]);
  },
};
