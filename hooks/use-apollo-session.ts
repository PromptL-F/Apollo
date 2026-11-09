import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { ApolloCredentials, checkHealth, normalizeBaseUrl } from "@/lib/apollo-api";

const STORAGE_KEY = "apollo.connection.v1";
const DEMO_KEY = "apollo.demo.v1";

async function readStored(): Promise<ApolloCredentials | null> {
  try {
    const raw = Platform.OS === "web" ? await AsyncStorage.getItem(STORAGE_KEY) : await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApolloCredentials;
    if (!parsed.baseUrl || !parsed.token) return null;
    return { baseUrl: normalizeBaseUrl(parsed.baseUrl), token: parsed.token };
  } catch {
    return null;
  }
}

async function writeStored(credentials: ApolloCredentials) {
  const value = JSON.stringify(credentials);
  if (Platform.OS === "web") await AsyncStorage.setItem(STORAGE_KEY, value);
  else await SecureStore.setItemAsync(STORAGE_KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

async function removeStored() {
  if (Platform.OS === "web") await AsyncStorage.removeItem(STORAGE_KEY);
  else await SecureStore.deleteItemAsync(STORAGE_KEY);
}

async function readDemo() {
  try {
    const value = Platform.OS === "web" ? await AsyncStorage.getItem(DEMO_KEY) : await SecureStore.getItemAsync(DEMO_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

async function writeDemo(enabled: boolean) {
  if (Platform.OS === "web") {
    if (enabled) await AsyncStorage.setItem(DEMO_KEY, "1");
    else await AsyncStorage.removeItem(DEMO_KEY);
  } else if (enabled) await SecureStore.setItemAsync(DEMO_KEY, "1");
  else await SecureStore.deleteItemAsync(DEMO_KEY);
}

export function useApolloSession() {
  const [credentials, setCredentials] = useState<ApolloCredentials | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([readStored(), readDemo()]).then(([stored, demoEnabled]) => {
      setCredentials(stored);
      setDemo(Boolean(demoEnabled && !stored));
      setLoading(false);
    });
  }, []);

  const connect = useCallback(async (baseUrl: string, token: string, remember = true) => {
    const next = { baseUrl: normalizeBaseUrl(baseUrl), token: token.trim() };
    if (!next.baseUrl || !next.token) throw new Error("Indica el servidor y el token de APOLLO.");
    setConnecting(true);
    setError(null);
    try {
      await checkHealth(next);
      await writeDemo(false);
      if (remember) await writeStored(next);
      setCredentials(next);
      setDemo(false);
      return next;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo validar el enlace.";
      setError(message);
      throw new Error(message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await removeStored();
    await writeDemo(false);
    setCredentials(null);
    setDemo(false);
    setError(null);
  }, []);

  const enableDemo = useCallback(async () => {
    await removeStored();
    await writeDemo(true);
    setCredentials(null);
    setDemo(true);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { credentials, demo, loading, connecting, error, connect, disconnect, enableDemo, clearError };
}
