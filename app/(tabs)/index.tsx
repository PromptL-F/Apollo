import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Apollo } from "@/constants/apollo-theme";
import { ActionButton, ApolloLogo, EmptyState, Panel, StatusPill } from "@/components/apollo-ui";
import { useApolloSession } from "@/hooks/use-apollo-session";
import { useApolloTask } from "@/hooks/use-apollo-task";
import type { ApolloEvent } from "@/lib/apollo-api";

function eventLabel(event: ApolloEvent) {
  if (event.tipo === "inicio") return "TASK STARTED";
  if (event.tipo === "paso") return "AGENT STEP";
  if (event.tipo === "aprobacion") return "AUTHORIZATION REQUIRED";
  if (event.tipo === "pregunta") return "INPUT REQUIRED";
  if (event.tipo === "fin") return String(event.estado || "TASK COMPLETE").toUpperCase();
  return String(event.tipo || "EVENT").toUpperCase();
}

function QuestionPanel({ question, onAnswer }: { question: { id: string; pregunta: string }; onAnswer: (value: string) => void }) {
  const [value, setValue] = useState("");
  return <Panel style={styles.alertPanel}><View style={styles.alertHeading}><Ionicons name="help-circle-outline" size={19} color={Apollo.amber} /><Text style={styles.alertTitle}>RESPUESTA NECESARIA</Text></View><Text style={styles.alertBody}>{question.pregunta}</Text><View style={styles.inlineInput}><TextInput value={value} onChangeText={setValue} placeholder="Escribe una respuesta..." placeholderTextColor={Apollo.mutedDark} style={styles.questionInput} /></View><ActionButton label="ENVIAR RESPUESTA" icon="paper-plane-outline" onPress={() => { if (value.trim()) onAnswer(value.trim()); }} disabled={!value.trim()} /></Panel>;
}

export default function ConsoleScreen() {
  const router = useRouter();
  const { credentials, demo, loading } = useApolloSession();
  const { task, events, approval, question, busy, error, start, approve, answer, cancel } = useApolloTask(credentials, demo);
  const [prompt, setPrompt] = useState("");

  useEffect(() => { if (!loading && !credentials && !demo) router.replace("/"); }, [credentials, demo, loading, router]);

  const taskActive = Boolean(task && !["terminada", "error", "cancelada"].includes(task.estado));
  const canSend = Boolean((credentials || demo) && prompt.trim() && !busy && !taskActive);
  const statusTone = task?.estado === "error" ? "red" : task?.estado === "ejecutando" ? "amber" : "green";
  const statusLabel = task?.estado ? task.estado.toUpperCase() : "STANDBY";

  const submit = async () => {
    const value = prompt.trim();
    if (!value || !canSend) return;
    setPrompt("");
    try { await start(value); } catch { /* el hook muestra el error */ }
  };

  const header = useMemo(() => <View style={styles.header}><ApolloLogo compact /><View style={styles.headerRight}><StatusPill label={statusLabel} tone={statusTone} /><Pressable onPress={() => router.push("/settings")} hitSlop={12}><Ionicons name="settings-outline" size={20} color={Apollo.muted} /></Pressable></View></View>, [router, statusLabel, statusTone]);

  if (loading || (!credentials && !demo)) return <View style={styles.loading}><ActivityIndicator color={Apollo.amber} /><Text style={styles.loadingText}>RECUPERANDO SESIÓN...</Text></View>;

  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
    {header}
    <View style={styles.telemetry}><Text style={styles.telemetryText}>LINK <Text style={styles.telemetryValue}>{demo ? "SIMULATION" : "SECURE"}</Text></Text><Text style={styles.telemetryText}>HOST <Text style={styles.telemetryValue}>{demo ? "LOCAL DEMO" : credentials?.baseUrl.replace(/^https?:\/\//, "")}</Text></Text><Text style={styles.telemetryText}>EVENTS <Text style={styles.telemetryValue}>{events.length.toString().padStart(2, "0")}</Text></Text></View>
    <FlatList style={{ flex: 1 }} keyboardShouldPersistTaps="handled" data={events} keyExtractor={(item, index) => `${item.n}-${index}`} contentContainerStyle={styles.feed} ListHeaderComponent={<View style={styles.feedIntro}><Text style={styles.kicker}>APOLLO // OPERATIONS CONSOLE</Text><Text style={styles.headline}>{task ? "Task telemetry" : "Awaiting instruction"}</Text><Text style={styles.intro}>{task ? `Seguimiento de ${task.id}. El núcleo informará aquí de cada paso.` : "Envía una instrucción para iniciar una secuencia de trabajo supervisada."}</Text></View>} ListEmptyComponent={<EmptyState title="NO ACTIVE SEQUENCE" detail="El enlace está listo. APOLLO espera una instrucción operativa." icon="pulse-outline" />} renderItem={({ item }) => <View style={styles.eventRow}><View style={styles.eventRail}><View style={[styles.eventDot, { backgroundColor: item.tipo === "fin" ? Apollo.green : item.tipo === "aprobacion" || item.tipo === "pregunta" ? Apollo.coral : Apollo.amber }]} /></View><View style={styles.eventBody}><View style={styles.eventMeta}><Text style={styles.eventType}>{eventLabel(item)}</Text>{typeof item.n === "number" && <Text style={styles.eventNo}>#{String(item.n).padStart(2, "0")}</Text>}</View><Text style={styles.eventText}>{String(item.texto || item.pregunta || item.resultado || item.peticion || "Evento recibido.")}</Text></View></View>} ListFooterComponent={<View style={{ height: 160 }} />} />
    <Modal visible={Boolean(approval)} transparent animationType="fade" onRequestClose={() => void approve(false)}>{approval && <View style={styles.modalBackdrop}><Panel style={styles.modalCard}><View style={styles.alertHeading}><Ionicons name="shield-checkmark-outline" size={19} color={Apollo.coral} /><Text style={styles.alertTitle}>AUTORIZACIÓN REQUERIDA</Text></View><Text style={styles.alertBody}>APOLLO solicita permiso para ejecutar una operación sensible.</Text><View style={styles.commandBox}><Text style={styles.commandText}>{JSON.stringify(approval.operacion, null, 2)}</Text>{approval.vista_previa && <Text style={styles.previewText}>{approval.vista_previa}</Text>}</View><View style={styles.alertActions}><ActionButton label="RECHAZAR" variant="ghost" onPress={() => void approve(false)} /><ActionButton label="APROBAR" onPress={() => void approve(true)} /></View></Panel></View>}</Modal>
    {question && <QuestionPanel question={question} onAnswer={(value) => void answer(value)} />}
    {error && <View style={styles.errorStrip}><Ionicons name="warning-outline" size={16} color={Apollo.coral} /><Text style={styles.errorText}>{error}</Text></View>}
    <View style={styles.composer}><TextInput value={prompt} onChangeText={setPrompt} onSubmitEditing={() => void submit()} returnKeyType="send" multiline maxLength={4000} placeholder="Escribe una instrucción para APOLLO..." placeholderTextColor={Apollo.mutedDark} style={styles.composerInput} /><Pressable onPress={() => void submit()} disabled={!canSend} style={({ pressed }) => [styles.sendButton, { opacity: !canSend ? 0.35 : pressed ? 0.65 : 1 }]}><Ionicons name="arrow-up" size={20} color={Apollo.ink} /></Pressable>{taskActive && <Pressable onPress={() => void cancel()} style={styles.cancelButton}><Ionicons name="stop" size={16} color={Apollo.coral} /></Pressable>}</View>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Apollo.background },
  loading: { flex: 1, backgroundColor: Apollo.background, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { color: Apollo.muted, fontSize: 11, letterSpacing: 1.5 },
  header: { paddingHorizontal: 18, paddingTop: Platform.OS === "web" ? 18 : 54, paddingBottom: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Apollo.border },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 15 },
  telemetry: { paddingHorizontal: 18, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: Apollo.border, backgroundColor: Apollo.panel },
  telemetryText: { color: Apollo.mutedDark, fontSize: 9, letterSpacing: 1 },
  telemetryValue: { color: Apollo.green, fontWeight: "800" },
  feed: { paddingHorizontal: 18, paddingTop: 22 },
  feedIntro: { marginBottom: 21 },
  kicker: { color: Apollo.amber, fontSize: 9, letterSpacing: 1.8, fontWeight: "800" },
  headline: { color: Apollo.text, fontSize: 25, fontWeight: "800", marginTop: 7 },
  intro: { color: Apollo.muted, fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 520 },
  eventRow: { flexDirection: "row", marginBottom: 17 },
  eventRail: { width: 20, alignItems: "center", paddingTop: 3 },
  eventDot: { width: 7, height: 7, borderRadius: 4 },
  eventBody: { flex: 1, borderLeftWidth: 1, borderLeftColor: Apollo.border, paddingLeft: 14, paddingBottom: 2 },
  eventMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  eventType: { color: Apollo.amberDim, fontSize: 9, fontWeight: "800", letterSpacing: 1.3 },
  eventNo: { color: Apollo.mutedDark, fontSize: 10, fontFamily: "monospace" },
  eventText: { color: Apollo.text, fontSize: 13, lineHeight: 19 },
  alertPanel: { marginHorizontal: 14, marginBottom: 10, borderColor: Apollo.coral, backgroundColor: "#1D1413" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 16 },
  modalCard: { borderColor: Apollo.coral, backgroundColor: "#1D1413" },
  alertHeading: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  alertTitle: { color: Apollo.coral, fontSize: 11, fontWeight: "900", letterSpacing: 1.3 },
  alertBody: { color: Apollo.text, fontSize: 13, lineHeight: 19, marginBottom: 11 },
  commandBox: { backgroundColor: Apollo.ink, borderWidth: 1, borderColor: Apollo.border, borderRadius: 3, padding: 10, marginBottom: 12 },
  commandText: { color: Apollo.amberBright, fontSize: 11, lineHeight: 16, fontFamily: "monospace" },
  previewText: { color: Apollo.muted, fontSize: 11, lineHeight: 16, marginTop: 8, fontFamily: "monospace" },
  alertActions: { flexDirection: "row", gap: 9 },
  inlineInput: { backgroundColor: Apollo.ink, borderWidth: 1, borderColor: Apollo.borderBright, borderRadius: 4, marginBottom: 10 },
  questionInput: { minHeight: 45, paddingHorizontal: 12, color: Apollo.text, fontSize: 13 },
  errorStrip: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#251513", borderTopWidth: 1, borderTopColor: Apollo.coral },
  errorText: { flex: 1, color: "#FFB3A5", fontSize: 11 },
  composer: { margin: 12, marginTop: 4, minHeight: 58, borderWidth: 1, borderColor: Apollo.borderBright, borderRadius: 5, backgroundColor: Apollo.panel, flexDirection: "row", alignItems: "flex-end", padding: 8, gap: 8 },
  composerInput: { flex: 1, color: Apollo.text, minHeight: 40, maxHeight: 100, paddingHorizontal: 8, paddingVertical: 8, fontSize: 13 },
  sendButton: { width: 40, height: 40, borderRadius: 3, backgroundColor: Apollo.amber, alignItems: "center", justifyContent: "center" },
  cancelButton: { width: 40, height: 40, borderWidth: 1, borderColor: Apollo.coral, borderRadius: 3, alignItems: "center", justifyContent: "center" },
});
