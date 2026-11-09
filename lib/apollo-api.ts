export type ApolloCredentials = {
  baseUrl: string;
  token: string;
};

export type ApolloHealth = {
  estado: string;
  ocupado?: boolean;
};

export type ApolloTask = {
  id: string;
  peticion: string;
  estado: string;
  resultado?: string | null;
  creada?: number;
  terminada?: number | null;
  eventos?: number;
};

export type ApolloHistoryRecord = {
  id: number;
  timestamp: string;
  action: string;
  resource: string;
  authorization: "approved" | "rejected" | "not_required";
  result: "success" | "error" | "cancelled";
  details?: string | null;
};

export type ApolloEvent = {
  n: number;
  ts?: number;
  tipo: string;
  texto?: string;
  estado?: string;
  resultado?: string | null;
  pregunta?: string;
  id?: string;
  operacion?: Record<string, unknown>;
  vista_previa?: string | null;
  usa_sudo?: boolean;
  peticion?: string;
  [key: string]: unknown;
};

export type ApolloApproval = {
  id: string;
  operacion: Record<string, unknown>;
  vista_previa?: string | null;
  creada?: number;
  usa_sudo?: boolean;
};

export type ApolloQuestion = {
  id: string;
  pregunta: string;
};

export class ApolloApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApolloApiError";
    this.status = status;
  }
}

export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function buildUrl(credentials: ApolloCredentials, path: string): string {
  return `${normalizeBaseUrl(credentials.baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readError(response: Response): Promise<string> {
  const raw = await response.text().catch(() => "");
  if (!raw) return `${response.status} ${response.statusText || "Error del servidor"}`;
  try {
    const data = JSON.parse(raw) as { detail?: string; error?: string; message?: string };
    return data.detail || data.error || data.message || raw;
  } catch {
    return raw;
  }
}

export async function apolloRequest<T>(
  credentials: ApolloCredentials,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(buildUrl(credentials, path), {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.token}`,
        ...(init.headers || {}),
      },
    });
  } catch (error) {
    throw new ApolloApiError(
      error instanceof Error ? `No se pudo contactar con APOLLO: ${error.message}` : "No se pudo contactar con APOLLO.",
    );
  }

  if (!response.ok) {
    throw new ApolloApiError(await readError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function checkHealth(credentials: ApolloCredentials) {
  return apolloRequest<ApolloHealth>(credentials, "/salud");
}

export function createTask(credentials: ApolloCredentials, peticion: string) {
  return apolloRequest<ApolloTask>(credentials, "/tareas", {
    method: "POST",
    body: JSON.stringify({ peticion }),
  });
}

export function getTask(credentials: ApolloCredentials, taskId: string) {
  return apolloRequest<ApolloTask>(credentials, `/tareas/${encodeURIComponent(taskId)}`);
}

export function getHistory(credentials: ApolloCredentials, limit = 50) {
  return apolloRequest<ApolloHistoryRecord[]>(credentials, `/historial?limite=${limit}`);
}

export function getApprovals(credentials: ApolloCredentials) {
  return apolloRequest<ApolloApproval[]>(credentials, "/aprobaciones");
}

export function decideApproval(credentials: ApolloCredentials, id: string, aprobar: boolean) {
  return apolloRequest<{ aprobada: boolean }>(credentials, `/aprobaciones/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ aprobar }),
  });
}

export function getQuestions(credentials: ApolloCredentials) {
  return apolloRequest<ApolloQuestion[]>(credentials, "/preguntas");
}

export function answerQuestion(credentials: ApolloCredentials, id: string, respuesta: string) {
  return apolloRequest<{ ok: boolean }>(credentials, `/preguntas/${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ respuesta }),
  });
}

export function cancelCurrentTask(credentials: ApolloCredentials) {
  return apolloRequest<{ cancelando: boolean }>(credentials, "/tareas/actual/cancelar", {
    method: "POST",
  });
}

export function newConversation(credentials: ApolloCredentials) {
  return apolloRequest<{ ok: boolean }>(credentials, "/conversacion/nueva", {
    method: "POST",
  });
}

export async function* streamTask(
  credentials: ApolloCredentials,
  taskId: string,
  signal: AbortSignal,
  desde = 0,
): AsyncGenerator<ApolloEvent> {
  let response: Response;
  try {
    response = await fetch(buildUrl(credentials, `/tareas/${encodeURIComponent(taskId)}/stream?desde=${desde}`), {
      headers: { Accept: "text/event-stream", Authorization: `Bearer ${credentials.token}` },
      signal,
    });
  } catch (error) {
    if (signal.aborted) return;
    throw error instanceof Error ? error : new Error("No se pudo abrir el flujo de eventos.");
  }

  if (!response.ok) throw new ApolloApiError(await readError(response), response.status);
  if (!response.body) throw new Error("El servidor no ofrece un flujo de eventos compatible.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split(/\r?\n\r?\n/);
      buffer = chunks.pop() || "";
      for (const chunk of chunks) {
        const data = chunk
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data) continue;
        try {
          yield JSON.parse(data) as ApolloEvent;
        } catch {
          // Ignora un evento malformado sin tumbar la supervisión.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function getEvents(
  credentials: ApolloCredentials,
  taskId: string,
  desde: number,
): Promise<{ estado: string; eventos: ApolloEvent[] }> {
  return apolloRequest(credentials, `/tareas/${encodeURIComponent(taskId)}/eventos?desde=${desde}&esperar=15`);
}
