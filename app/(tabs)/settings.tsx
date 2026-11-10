import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Apollo } from "@/constants/apollo-theme";
import { ActionButton, ApolloLogo, Panel, SectionLabel, StatusPill } from "@/components/apollo-ui";
import { useApolloLock } from "@/hooks/use-apollo-lock";
import { useApolloAmbient } from "@/hooks/use-apollo-ambient";
import { useApolloSession } from "@/hooks/use-apollo-session";
import { ApolloCredentials, checkHealth } from "@/lib/apollo-api";

function SettingsBody({ credentials, demo, connecting, connect, disconnect }: { credentials: ApolloCredentials | null; demo: boolean; connecting: boolean; connect: (baseUrl: string, token: string, remember?: boolean) => Promise<ApolloCredentials>; disconnect: () => Promise<void> }) {
  const router = useRouter();
  const lock = useApolloLock();
  const ambient = useApolloAmbient();
  const [baseUrl, setBaseUrl] = useState(credentials?.baseUrl || "");
  const [token, setToken] = useState(credentials?.token || "");
  const [status, setStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [message, setMessage] = useState(demo ? "La consola demo no ejecuta llamadas ni comandos reales." : "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const check = async () => { if (!credentials) return; try { await checkHealth(credentials); setStatus("ok"); setMessage("Enlace operativo y autenticado."); } catch (reason) { setStatus("error"); setMessage(reason instanceof Error ? reason.message : "No se pudo comprobar el enlace."); } };
  const save = async () => { try { await connect(baseUrl, token, true); setStatus("ok"); setMessage("Configuración guardada."); } catch (reason) { setStatus("error"); setMessage(reason instanceof Error ? reason.message : "No se pudo guardar."); } };
  const changePassword = async () => {
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) { setPasswordMessage("Las nuevas contraseñas no coinciden."); return; }
    setPasswordBusy(true);
    try { await lock.changePassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordMessage("Contraseña local actualizada correctamente."); }
    catch (reason) { setPasswordMessage(reason instanceof Error ? reason.message : "No se pudo cambiar la contraseña."); }
    finally { setPasswordBusy(false); }
  };
  const leave = () => { const run = async () => { await disconnect(); router.replace("/"); }; if (Platform.OS === "web") { if (window.confirm("¿Eliminar las credenciales guardadas?")) void run(); } else Alert.alert("Cerrar enlace", "Se eliminará el token de este dispositivo.", [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => void run() }]); };
  const passwordField = (label: string, value: string, setValue: (value: string) => void, placeholder: string) => <><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={setValue} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder={placeholder} placeholderTextColor={Apollo.mutedDark} style={styles.input} /></>;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><ApolloLogo compact /><Text style={styles.headerTitle}>CONFIGURATION</Text></View>
    {demo ? <Panel style={styles.panel}><SectionLabel right={<StatusPill label="DEMO" tone="amber" />}>SIMULATION MODE</SectionLabel><Text style={styles.diagnostic}>La simulación permite revisar la navegación y la telemetría sin conectarse al servidor ni ejecutar ninguna acción real.</Text><ActionButton label="CONFIGURAR ENLACE REAL" icon="link-outline" variant="ghost" onPress={() => void disconnect().then(() => router.replace("/"))} /></Panel> : <Panel style={styles.panel}><SectionLabel>LINK PARAMETERS</SectionLabel>{passwordField("SERVIDOR APOLLO", baseUrl, setBaseUrl, "http://192.168.1.20:8765")}<Text style={styles.label}>TOKEN BEARER</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="apollo token" placeholderTextColor={Apollo.mutedDark} style={styles.input} /><ActionButton label={connecting ? "GUARDANDO..." : "GUARDAR CONFIGURACIÓN"} onPress={() => void save()} disabled={connecting || !baseUrl || !token} /></Panel>}
    <Panel style={styles.panel}><SectionLabel right={<StatusPill label={demo ? "SIMULATION" : status === "ok" ? "ONLINE" : status === "error" ? "FAULT" : "UNKNOWN"} tone={status === "ok" ? "green" : status === "error" ? "red" : "amber"} />}>LINK DIAGNOSTICS</SectionLabel><Text style={styles.diagnostic}>{message || "Comprueba el enlace para obtener el estado del servidor."}</Text>{!demo && <ActionButton label="COMPROBAR SALUD" icon="pulse-outline" variant="ghost" onPress={() => void check()} />}</Panel>
    <Panel style={styles.panel}><SectionLabel>AMBIENT SYSTEM</SectionLabel><View style={styles.preferenceRow}><View style={styles.preferenceCopy}><Text style={styles.preferenceTitle}>RUIDO DE TERMINAL RETRO</Text><Text style={styles.preferenceDetail}>Zumbido CRT y cinta magnética a volumen bajo.</Text></View><Switch value={ambient.enabled} onValueChange={(value) => void ambient.setEnabled(value)} trackColor={{ false: Apollo.border, true: Apollo.amberDim }} thumbColor={ambient.enabled ? Apollo.amber : Apollo.muted} /></View></Panel>
    {!lock.loading && lock.configured && <Panel style={styles.panel}><SectionLabel>LOCAL SECURITY</SectionLabel><Text style={styles.diagnostic}>Modifica la contraseña que protege el acceso local a la aplicación. Esta contraseña nunca se envía al servidor.</Text>{passwordField("CONTRASEÑA ACTUAL", currentPassword, setCurrentPassword, "Contraseña actual")}{passwordField("NUEVA CONTRASEÑA", newPassword, setNewPassword, "Mínimo 6 caracteres")}{passwordField("CONFIRMAR NUEVA CONTRASEÑA", confirmPassword, setConfirmPassword, "Repite la nueva contraseña")}{passwordMessage && <Text style={[styles.passwordMessage, { color: passwordMessage.includes("correctamente") ? Apollo.green : Apollo.coral }]}>{passwordMessage}</Text>}<ActionButton label={passwordBusy ? "ACTUALIZANDO..." : "CAMBIAR CONTRASEÑA LOCAL"} icon="key-outline" onPress={() => void changePassword()} disabled={passwordBusy || !currentPassword || !newPassword || !confirmPassword} /></Panel>}
    <Panel style={styles.panel}><SectionLabel>SESSION CONTROL</SectionLabel><Text style={styles.diagnostic}>El token se guarda en el almacén seguro del dispositivo y solo se envía a la dirección configurada. Para volver a ver el login, elimina la sesión guardada.</Text><Pressable onPress={leave} style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.65 : 1 }]}><Ionicons name="log-out-outline" size={18} color={Apollo.coral} /><Text style={styles.logoutText}>{demo ? "SALIR DEL MODO DEMO" : "CERRAR SESIÓN Y VOLVER AL LOGIN"}</Text></Pressable></Panel>
    <Text style={styles.version}>APOLLO MOBILE // REMOTE CONSOLE // v1.0</Text>
  </ScrollView>;
}

export default function SettingsScreen() {
  const { credentials, demo, loading, connecting, connect, disconnect } = useApolloSession();
  if (loading) return <View style={styles.loading}><ActivityIndicator color={Apollo.amber} /></View>;
  return <SettingsBody key={`${demo}-${credentials?.baseUrl || "none"}`} credentials={credentials} demo={demo} connecting={connecting} connect={connect} disconnect={disconnect} />;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: Apollo.background }, content: { padding: 15, paddingBottom: 40, maxWidth: 620, width: "100%", alignSelf: "center" }, loading: { flex: 1, backgroundColor: Apollo.background, alignItems: "center", justifyContent: "center" }, header: { paddingTop: 38, paddingBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { color: Apollo.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.7 }, panel: { marginBottom: 12 }, label: { color: Apollo.muted, fontSize: 10, letterSpacing: 1.4, fontWeight: "800", marginTop: 13, marginBottom: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: Apollo.borderBright, borderRadius: 4, backgroundColor: Apollo.ink, color: Apollo.text, paddingHorizontal: 12, fontSize: 13, marginBottom: 2 }, diagnostic: { color: Apollo.muted, fontSize: 13, lineHeight: 20, marginBottom: 14 }, preferenceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, preferenceCopy: { flex: 1 }, preferenceTitle: { color: Apollo.text, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, preferenceDetail: { color: Apollo.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }, passwordMessage: { fontSize: 12, lineHeight: 18, marginVertical: 10 }, logout: { borderWidth: 1, borderColor: Apollo.coral, borderRadius: 4, minHeight: 44, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, logoutText: { color: Apollo.coral, fontSize: 11, fontWeight: "800", letterSpacing: 1 }, version: { color: Apollo.mutedDark, fontSize: 9, letterSpacing: 1.3, textAlign: "center", marginTop: 10 }, });
