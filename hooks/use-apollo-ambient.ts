import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const KEY = "apollo.ambient.v1";
const listeners = new Set<(enabled: boolean) => void>();

async function readAmbient() {
  try { return (await AsyncStorage.getItem(KEY)) !== "0"; } catch { return true; }
}

export function useApolloAmbient() {
  const [enabled, setEnabledState] = useState(true);
  useEffect(() => {
    let active = true;
    void readAmbient().then((value) => { if (active) setEnabledState(value); });
    const listener = (value: boolean) => setEnabledState(value);
    listeners.add(listener);
    return () => { active = false; listeners.delete(listener); };
  }, []);
  const setEnabled = async (value: boolean) => {
    setEnabledState(value);
    try { await AsyncStorage.setItem(KEY, value ? "1" : "0"); } catch { /* preferencia no crítica */ }
    listeners.forEach((listener) => listener(value));
  };
  return { enabled, setEnabled };
}
