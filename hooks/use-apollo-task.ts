import { useCallback, useEffect, useRef, useState } from "react";
import {
  answerQuestion,
  ApolloApproval,
  ApolloCredentials,
  ApolloEvent,
  ApolloQuestion,
  ApolloTask,
  cancelCurrentTask,
  createTask,
  decideApproval,
  getApprovals,
  getEvents,
  getQuestions,
  getTask,
  streamTask,
} from "@/lib/apollo-api";

export function useApolloTask(credentials: ApolloCredentials | null, demo = false) {
  const [task, setTask] = useState<ApolloTask | null>(null);
  const [events, setEvents] = useState<ApolloEvent[]>([]);
  const [approval, setApproval] = useState<ApolloApproval | null>(null);
  const [question, setQuestion] = useState<ApolloQuestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stopMonitoring = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    demoTimers.current.forEach((timer) => clearTimeout(timer));
    demoTimers.current = [];
  }, []);

  useEffect(() => () => stopMonitoring(), [stopMonitoring]);

  const addEvent = useCallback((event: ApolloEvent) => {
    setEvents((current) => (current.some((item) => item.n === event.n) ? current : [...current, event]));
    if (event.tipo === "fin") {
      setTask((current) => current ? { ...current, estado: String(event.estado || current.estado), resultado: event.resultado as string | null } : current);
      setApproval(null);
      setQuestion(null);
    }
    if (event.tipo === "aprobacion") setApproval(event as ApolloApproval);
    if (event.tipo === "pregunta") setQuestion({ id: String(event.id || ""), pregunta: String(event.pregunta || "") });
  }, []);

  const refreshPending = useCallback(async (activeCredentials: ApolloCredentials) => {
    const [approvals, questions] = await Promise.all([getApprovals(activeCredentials), getQuestions(activeCredentials)]);
    setApproval(approvals[0] || null);
    setQuestion(questions[0] || null);
  }, []);

  const monitor = useCallback(async (activeCredentials: ApolloCredentials, taskId: string) => {
    stopMonitoring();
    const controller = new AbortController();
    abortRef.current = controller;
    let cursor = 0;
    let finished = false;
    try {
      for await (const event of streamTask(activeCredentials, taskId, controller.signal, cursor)) {
        cursor = Math.max(cursor, event.n + 1);
        addEvent(event);
        if (event.tipo === "fin") { finished = true; break; }
      }
    } catch {
      // SSE no está disponible en todos los runtimes; el sondeo mantiene la tarea viva.
    }
    if (!finished && !controller.signal.aborted) {
      try {
        while (!controller.signal.aborted) {
          const result = await getEvents(activeCredentials, taskId, cursor);
          for (const event of result.eventos) {
            cursor = Math.max(cursor, event.n + 1);
            addEvent(event);
            if (event.tipo === "fin") finished = true;
          }
          await refreshPending(activeCredentials);
          if (finished || ["terminada", "error", "cancelada"].includes(result.estado)) break;
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Se perdió el seguimiento de la tarea.");
      }
    }
    if (!controller.signal.aborted) {
      try { setTask(await getTask(activeCredentials, taskId)); } catch { /* ya tenemos el resultado del evento final */ }
    }
  }, [addEvent, refreshPending, stopMonitoring]);

  const start = useCallback(async (peticion: string) => {
    const activeCredentials = credentials;
    if (!activeCredentials && !demo) throw new Error("No hay enlace con APOLLO.");
    setBusy(true);
    setError(null);
    setApproval(null);
    setQuestion(null);
    setEvents([]);
    try {
      if (demo) {
        const created: ApolloTask = { id: `DEMO-${Date.now().toString(36).toUpperCase()}`, peticion, estado: "ejecutando", resultado: null, eventos: 0 };
        setTask(created);
        const demoEvents: ApolloEvent[] = [
          { n: 0, tipo: "inicio", peticion },
          { n: 1, tipo: "paso", texto: "Modo simulación activo. Analizando la instrucción." },
          { n: 2, tipo: "paso", texto: "Consola demo: no se ha ejecutado ningún comando real." },
          { n: 3, tipo: "fin", estado: "terminada", resultado: "Simulación completada correctamente." },
        ];
        demoEvents.forEach((event, index) => {
          const timer = setTimeout(() => addEvent(event), 500 + index * 650);
          demoTimers.current.push(timer);
        });
        return created;
      }
      if (!activeCredentials) throw new Error("No hay enlace con APOLLO.");
      const created = await createTask(activeCredentials, peticion);
      setTask(created);
      void monitor(activeCredentials, created.id);
      return created;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "No se pudo iniciar la tarea.";
      setError(message);
      throw new Error(message);
    } finally {
      setBusy(false);
    }
  }, [addEvent, credentials, demo, monitor]);

  const approve = useCallback(async (approveIt: boolean) => {
    if (!credentials || !approval) return;
    try { await decideApproval(credentials, approval.id, approveIt); setApproval(null); await refreshPending(credentials); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo resolver la aprobación."); }
  }, [approval, credentials, refreshPending]);

  const answer = useCallback(async (value: string) => {
    if (!credentials || !question) return;
    try { await answerQuestion(credentials, question.id, value); setQuestion(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo enviar la respuesta."); }
  }, [credentials, question]);

  const cancel = useCallback(async () => {
    if (!credentials && !demo) return;
    try {
      if (credentials) await cancelCurrentTask(credentials);
      stopMonitoring();
      setTask((current) => current ? { ...current, estado: "cancelada", resultado: "Cancelada desde APOLLO Mobile." } : current);
      setApproval(null);
      setQuestion(null);
      setError(null);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo cancelar la tarea."); }
  }, [credentials, demo, stopMonitoring]);

  return { task, events, approval, question, busy, error, setError, start, approve, answer, cancel, stopMonitoring };
}
