# Plan de APOLLO Mobile

## Objetivo

Construir una app Android gestionada para controlar el núcleo APOLLO existente mediante su API FastAPI. La primera versión debe resolver la conexión, el envío de peticiones, la supervisión de tareas, las aprobaciones, las preguntas del agente, la cancelación y el historial.

## Implementación

- Mantener el starter fijo Expo Router / React Native / TypeScript / NativeWind.
- Usar almacenamiento seguro de Expo SecureStore para la URL del servidor y el token Bearer; en Web usar un fallback local acotado para poder previsualizar.
- Crear un cliente APOLLO con `fetch` para `/salud`, `/tareas`, `/tareas/{id}`, `/tareas/{id}/stream`, `/aprobaciones`, `/preguntas`, `/historial` y cancelación.
- Modelar el estado de conexión, tarea activa, eventos, solicitudes de aprobación y preguntas con React state y hooks propios.
- Mantener una pantalla de login/conexión separada de la consola principal. La sesión de APOLLO es la credencial Bearer del servidor existente; no se sustituye por Manus OAuth.
- Implementar SSE con `fetch`/lectura de stream cuando esté disponible y fallback de sondeo para Web o servidores que no soporten lectura incremental.
- Usar datos de demostración solo cuando el usuario active el modo demo; nunca inventar una conexión exitosa.
- Mantener las operaciones sensibles visibles con comando exacto y botones aprobar/rechazar.

## Diseño

### Opciones consideradas

- **Terminal industrial ámbar** (0.06): paneles oscuros, tipografía técnica y señales de estado cálidas.
- **Centro de control blanco clínico** (0.04): superficies claras, azul frío y jerarquía hospitalaria.
- **Retrocomputación verde fósforo** (0.08): fósforo verde, scanlines y estética de monitor antiguo.

Se elige **Terminal industrial ámbar**.

### Movimiento y principios

Una consola corporativa retroindustrial original: sobria, legible y funcional, con una tensión ligera de sistema que opera al límite. Sus principios son jerarquía de información primero, estados siempre visibles, contraste alto para uso nocturno y controles grandes para uso con una mano.

### Color

Fondo casi negro carbón (`#0A0D0C`), superficies de grafito (`#121816`), bordes verde petróleo (`#23312C`) y ámbar APOLLO (`#F3B562`) como color distintivo. Verde apagado comunica listo, amarillo ámbar requiere atención y rojo coral se reserva para bloqueos o errores.

### Layout

Cabecera de telemetría compacta, contenido apilado tipo consola y una barra de entrada fija abajo. El chat usa tarjetas con una línea lateral de estado en lugar de burbujas redondeadas genéricas. Las pantallas secundarias usan filas de registro y paneles con esquinas discretas.

### Elementos distintivos

1. Wordmark APOLLO con un pequeño indicador orbital formado por dos arcos y un punto.
2. Etiquetas monoespaciadas `SYS`, `LINK`, `TASK` y `AUTH` para telemetría.
3. Líneas finas, separadores segmentados y una textura de scanline muy sutil, sin perjudicar la legibilidad.

### Interacción y animación

Los estados cambian con transiciones rápidas de opacidad y desplazamiento corto. Una tarea activa muestra un pulso ámbar discreto; los eventos nuevos aparecen como registros sin animación exagerada. Las aprobaciones usan modal controlado y siempre muestran la acción exacta.

### Tipografía

Usar una sans técnica legible para títulos y una monoespaciada del sistema para datos, comandos y estados. Títulos compactos en mayúsculas con espaciado moderado; texto explicativo en tamaño cómodo y alto contraste.

### Voz y marca

APOLLO habla con precisión operativa, sin frases promocionales. Ejemplos: `ENLACE ESTABLECIDO · ESPERANDO INSTRUCCIÓN` y `AUTORIZACIÓN REQUERIDA · REVISAR OPERACIÓN`.

### Logo e icono

Crear un símbolo original de doble arco orbital alrededor de un punto ámbar, acompañado del wordmark APOLLO. No usar logotipos, tipografías, imágenes ni textos de Seegson o *Alien: Isolation*.

## Estructura prevista

- `app/index.tsx`: entrada y conexión/login.
- `app/(tabs)/index.tsx`: consola y chat.
- `app/(tabs)/history.tsx`: historial.
- `app/(tabs)/settings.tsx`: servidor, token y modo demo.
- `components/apollo-ui.tsx`: paneles, etiquetas, botones, tarjetas y logo.
- `lib/apollo-api.ts`: cliente HTTP, tipos y SSE/sondeo.
- `hooks/use-apollo-session.ts`: persistencia de credenciales y estado de conexión.
- `hooks/use-apollo-task.ts`: tarea activa, eventos, aprobaciones y preguntas.
- `constants/apollo-theme.ts`: tokens visuales.
- `assets/images/*`: iconos y splash con identidad APOLLO.

## Alcance de la primera entrega

Incluye una app navegable en Preview, con login por URL/token, modo demo visible para revisar la interfaz, cliente real preparado para la API APOLLO, consola, tarea activa, aprobaciones, preguntas, cancelación e historial. La generación de un APK firmado se deja para la acción de build del Dashboard después de validar la app.
