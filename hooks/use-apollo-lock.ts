import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const HASH_KEY = "apollo.local-lock.hash.v1";
const SALT_KEY = "apollo.local-lock.salt.v1";

async function getValue(key: string) {
  return Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string) {
  if (Platform.OS === "web") await AsyncStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

async function readLock() {
  try {
    const [hash, salt] = await Promise.all([getValue(HASH_KEY), getValue(SALT_KEY)]);
    return hash && salt ? { hash, salt } : null;
  } catch {
    return null;
  }
}

export function useApolloLock() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readLock().then((stored) => {
      setConfigured(Boolean(stored));
      setLoading(false);
    });
  }, []);

  const setupPassword = useCallback(async (password: string) => {
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
    const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
    const hash = await hashPassword(password, salt);
    await Promise.all([setValue(HASH_KEY, hash), setValue(SALT_KEY, salt)]);
    setConfigured(true);
    setUnlocked(true);
    setError(null);
  }, []);

  const unlock = useCallback(async (password: string) => {
    const stored = await readLock();
    if (!stored) {
      setConfigured(false);
      throw new Error("No hay una contraseña local configurada.");
    }
    const candidate = await hashPassword(password, stored.salt);
    if (candidate !== stored.hash) {
      setError("Contraseña incorrecta.");
      throw new Error("Contraseña incorrecta.");
    }
    setUnlocked(true);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, configured, unlocked, error, setupPassword, unlock, clearError };
}
