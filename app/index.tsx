import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { Apollo } from "@/constants/apollo-theme";
import { ApolloLogo, ActionButton, Panel, StatusPill } from "@/components/apollo-ui";
import { useApolloSession } from "@/hooks/use-apollo-session";

export default function LoginScreen() {
  const router = useRouter();
  const { credentials, loading, demo, connecting, error, connect, enableDemo, clearError } = useApolloSession();
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [showToken, setShowToken] = useState(false);

  const handleConnect = async () => {
    try { await connect(baseUrl, token, remember); router.replace("/(tabs)"); }
    catch { /* el hook muestra el diagnóstico */ }
  };

  useEffect(() => { if (!loading && (demo || credentials)) router.replace("/(tabs)"); }, [credentials, demo, loading, router]);

  if (loading) return <View style={styles.loading}><ActivityIndicator color={Apollo.amber} /><Text style={styles.loadingText}>INICIALIZANDO ENLACE...</Text></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><ApolloLogo /><StatusPill label="OFFLINE" tone="red" /></View>
      <View style={styles.hero}><Text style={styles.kicker}>APOLLO // REMOTE CONSOLE</Text><Text style={styles.title}>Establecer enlace</Text><Text style={styles.subtitle}>Conecta con el núcleo APOLLO que se ejecuta en tu equipo Linux. Las credenciales se guardan de forma segura en este dispositivo.</Text></View>
      <Panel style={styles.formPanel}>
        <Text style={styles.fieldLabel}>DIRECCIÓN DEL SERVIDOR</Text>
        <View style={styles.inputShell}><Ionicons name="globe-outline" size={18} color={Apollo.amberDim} /><TextInput value={baseUrl} onChangeText={(value) => { setBaseUrl(value); clearError(); }} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://192.168.1.20:8765" placeholderTextColor={Apollo.mutedDark} style={styles.input} /></View>
        <Text style={[styles.fieldLabel, { marginTop: 18 }]}>TOKEN BEARER</Text>
        <View style={styles.inputShell}><Ionicons name="key-outline" size={18} color={Apollo.amberDim} /><TextInput value={token} onChangeText={(value) => { setToken(value); clearError(); }} autoCapitalize="none" autoCorrect={false} secureTextEntry={!showToken} placeholder="Pega el token de apollo token" placeholderTextColor={Apollo.mutedDark} style={styles.input} /><Pressable onPress={() => setShowToken((value) => !value)}><Ionicons name={showToken ? "eye-off-outline" : "eye-outline"} size={18} color={Apollo.muted} /></Pressable></View>
        <View style={styles.rememberRow}><Text style={styles.rememberText}>Recordar en este dispositivo</Text><Switch value={remember} onValueChange={setRemember} trackColor={{ false: Apollo.border, true: Apollo.amberDim }} thumbColor={remember ? Apollo.amber : Apollo.muted} /></View>
        {error && <View style={styles.errorBox}><Ionicons name="warning-outline" size={18} color={Apollo.coral} /><Text style={styles.errorText}>{error}</Text></View>}
        <ActionButton label={connecting ? "VALIDANDO ENLACE..." : "CONECTAR CON APOLLO"} icon={connecting ? undefined : "arrow-forward-outline"} onPress={() => void handleConnect()} disabled={connecting || !baseUrl.trim() || !token.trim()} />
        <Pressable onPress={() => { void enableDemo().then(() => router.replace("/(tabs)")); }} style={styles.demoButton}><Ionicons name="flask-outline" size={16} color={Apollo.amber} /><Text style={styles.demoText}>ABRIR CONSOLA DE DEMOSTRACIÓN</Text></Pressable>
      </Panel>
      <View style={styles.footer}><Text style={styles.footerCode}>SYS.AUTH // TOKEN NEVER TRANSMITTED OUTSIDE THE CONFIGURED SERVER</Text><Text style={styles.footerHint}>En Android usa la IP del equipo Linux, por ejemplo http://192.168.1.20:8765. No uses 127.0.0.1 salvo que hayas ejecutado `adb reverse tcp:8765 tcp:8765`.</Text></View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Apollo.background },
  content: { flexGrow: 1, padding: 22, paddingTop: 58, paddingBottom: 40, maxWidth: 620, width: "100%", alignSelf: "center" },
  loading: { flex: 1, backgroundColor: Apollo.background, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: Apollo.muted, fontSize: 11, letterSpacing: 1.6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hero: { marginTop: 48, marginBottom: 28 },
  kicker: { color: Apollo.amber, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  title: { color: Apollo.text, fontSize: 34, fontWeight: "800", marginTop: 12, letterSpacing: -0.8 },
  subtitle: { color: Apollo.muted, fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 480 },
  formPanel: { padding: 18 },
  fieldLabel: { color: Apollo.muted, fontSize: 10, letterSpacing: 1.6, fontWeight: "800", marginBottom: 8 },
  inputShell: { backgroundColor: Apollo.ink, minHeight: 50, borderWidth: 1, borderColor: Apollo.borderBright, borderRadius: 4, flexDirection: "row", alignItems: "center", paddingHorizontal: 13, gap: 10 },
  input: { flex: 1, color: Apollo.text, fontSize: 14, paddingVertical: 12, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
  rememberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 18 },
  rememberText: { color: Apollo.muted, fontSize: 13 },
  errorBox: { borderWidth: 1, borderColor: Apollo.coral, backgroundColor: "#251513", padding: 11, borderRadius: 4, flexDirection: "row", gap: 9, marginBottom: 14 },
  errorText: { color: "#FFB3A5", flex: 1, fontSize: 12, lineHeight: 18 },
  demoButton: { minHeight: 44, marginTop: 10, borderWidth: 1, borderColor: Apollo.border, borderRadius: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  demoText: { color: Apollo.amber, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  footer: { marginTop: "auto", paddingTop: 32, gap: 8 },
  footerCode: { color: Apollo.mutedDark, fontSize: 9, letterSpacing: 1, lineHeight: 15 },
  footerHint: { color: Apollo.mutedDark, fontSize: 11, lineHeight: 17 },
});
