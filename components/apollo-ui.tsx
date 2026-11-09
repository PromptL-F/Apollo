import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Apollo } from "@/constants/apollo-theme";

export function ApolloLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <View style={styles.orbit}>
        <View style={styles.orbitArcOne} />
        <View style={styles.orbitArcTwo} />
        <View style={styles.orbitCore} />
      </View>
      <View>
        <Text style={[styles.logoText, compact && styles.logoTextCompact]}>APOLLO</Text>
        {!compact && <Text style={styles.logoSub}>AUTONOMOUS SYSTEMS // CONTROL</Text>}
      </View>
    </View>
  );
}

export function StatusPill({ label, tone = "amber" }: { label: string; tone?: "amber" | "green" | "red" | "blue" }) {
  const color = tone === "green" ? Apollo.green : tone === "red" ? Apollo.coral : tone === "blue" ? Apollo.blue : Apollo.amber;
  return <View style={[styles.statusPill, { borderColor: color }]}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return <View style={styles.sectionRow}><Text style={styles.sectionLabel}>{children}</Text>{right}</View>;
}

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function ActionButton({ label, onPress, icon, variant = "primary", disabled = false }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; variant?: "primary" | "ghost" | "danger"; disabled?: boolean }) {
  const backgroundColor = variant === "primary" ? Apollo.amber : variant === "danger" ? Apollo.coral : "transparent";
  const color = variant === "ghost" ? Apollo.amber : Apollo.ink;
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.actionButton, { backgroundColor, borderColor: variant === "ghost" ? Apollo.borderBright : backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 }]}><>{icon && <Ionicons name={icon} size={16} color={color} />}</><Text style={[styles.actionText, { color }]}>{label}</Text></Pressable>;
}

export function EmptyState({ title, detail, icon = "radio-outline" }: { title: string; detail: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.empty}><Ionicons name={icon} size={28} color={Apollo.amberDim} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyDetail}>{detail}</Text></View>;
}

export const styles = StyleSheet.create({
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  orbit: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Apollo.amber, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-22deg" }] },
  orbitArcOne: { position: "absolute", width: 29, height: 15, borderTopWidth: 2, borderColor: Apollo.amberBright, borderRadius: 20, top: 5 },
  orbitArcTwo: { position: "absolute", width: 29, height: 15, borderBottomWidth: 2, borderColor: Apollo.amberDim, borderRadius: 20, bottom: 5 },
  orbitCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: Apollo.amberBright },
  logoText: { color: Apollo.text, fontSize: 25, letterSpacing: 4, fontWeight: "800" },
  logoTextCompact: { fontSize: 18, letterSpacing: 3 },
  logoSub: { color: Apollo.muted, fontSize: 8, letterSpacing: 1.3, marginTop: 2 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, letterSpacing: 1.2, fontWeight: "700" },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  sectionLabel: { color: Apollo.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  panel: { backgroundColor: Apollo.panel, borderWidth: 1, borderColor: Apollo.border, borderRadius: 5, padding: 15 },
  actionButton: { minHeight: 44, borderWidth: 1, borderRadius: 4, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionText: { fontSize: 12, letterSpacing: 1.1, fontWeight: "800" },
  empty: { minHeight: 190, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 22 },
  emptyTitle: { color: Apollo.text, fontWeight: "800", fontSize: 15, letterSpacing: 1 },
  emptyDetail: { color: Apollo.muted, textAlign: "center", lineHeight: 20, fontSize: 13 },
});
