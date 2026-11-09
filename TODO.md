# APOLLO Mobile — resultados

## Conexión e inicio de sesión

- [x] La app muestra una pantalla de conexión con dirección configurable del servidor APOLLO y token Bearer.
- [x] Las credenciales se guardan con almacenamiento seguro en Android y pueden eliminarse desde Ajustes.
- [x] La app comprueba la salud del servidor antes de entrar en la consola y muestra errores de red, autorización o servidor de forma clara.
- [x] Existe un modo demo explícito para revisar la interfaz sin presentar una conexión ficticia como real.

## Consola APOLLO

- [x] La pantalla principal permite enviar peticiones de texto al agente APOLLO.
- [x] La interfaz presenta respuestas, estado de tarea y eventos de forma legible en una pantalla de móvil.
- [x] La app consume la API FastAPI existente usando Bearer token.
- [x] La app mantiene una identidad visual APOLLO original, retroindustrial y corporativa de ciencia ficción, sin copiar activos ni elementos protegidos de Seegson o Alien: Isolation.

## Supervisión y control

- [x] La app sigue tareas en tiempo real mediante SSE cuando está disponible y utiliza sondeo como fallback.
- [x] Las operaciones sensibles aparecen en un diálogo con el comando o acción exacta y permiten aprobar o rechazar.
- [x] Las preguntas del agente aparecen en una interfaz para responderlas y continuar la tarea.
- [x] La cancelación de una tarea activa se refleja inmediatamente y detiene el seguimiento.

## Historial y ajustes

- [x] La app muestra el historial de conversaciones y tareas con peticiones, respuestas, eventos y resultados.
- [x] Ajustes permite cambiar servidor, borrar token, activar/desactivar demo y volver a comprobar el enlace.
- [x] La navegación funciona en orientación vertical y con controles cómodos para uso con una mano.

## Entrega técnica

- [x] El proyecto conserva Expo Router, React Native, TypeScript, NativeWind e identificadores generados del starter.
- [x] Los iconos nativos y splash llevan la identidad APOLLO antes del primer checkpoint de aplicación.
- [x] TypeScript, lint y pruebas pasan o cualquier limitación queda documentada.
- [x] El proyecto queda listo para lanzar el build Android desde Dashboard; no se afirma que exista un APK hasta que el build real termine.
