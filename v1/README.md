# widget-chat-web-etb-idartes

**Autor:** Ramón Dario Rozo Torres

---

## Descripción

Widget chat web para la empresa ETB IDARTES. Permite a los usuarios iniciar conversaciones a través de un widget embebible en cualquier sitio web, con soporte para árbol de atención automatizado, paso a asesor humano (Soul Chat), encuesta de satisfacción, adjuntos y logging centralizado.

---

## 📦 Stack tecnológico

| Tecnología              | Versión           | Descripción                                         |
|-------------------------|-------------------|-----------------------------------------------------|
| **Node.js**             | 22.3.0            | Entorno de ejecución para JavaScript                |
| **Express**             | ^4.19.2           | Framework web para Node.js                          |
| **express-handlebars**  | ^8.0.1            | Motor de plantillas para vistas                     |
| **mysql2**              | ^3.11.0           | Cliente MySQL para Node.js (con soporte promesas)   |
| **jsonwebtoken**        | ^9.0.2            | Generación y validación de tokens JWT               |
| **dotenv**              | ^16.4.5           | Manejo de variables de entorno                      |
| **moment**              | ^2.30.1           | Manejo de fechas y horas                            |
| **axios**               | ^1.7.9            | Cliente HTTP para Node.js                           |
| **express-fileupload**  | ^1.5.1            | Middleware para subir archivos                      |
| **multer**              | ^1.4.5-lts.1      | Middleware para manejo de archivos multipart        |
| **cors**                | ^2.8.5            | Middleware para habilitar CORS                      |
| **express-validator**   | ^7.1.0            | Validación de datos en Express                      |
| **express-rate-limit**  | ^8.1.0            | Limitación de peticiones por IP                     |
| **morgan**              | ^1.10.0           | Logger de peticiones HTTP                           |
| **node-cron**           | ^4.2.1            | Scheduler de tareas periódicas (cron)               |
| **pino**                | ^10.1.0           | Logger estructurado de alto rendimiento             |
| **pino-http**           | ^11.0.0           | Middleware pino para logging de peticiones HTTP     |
| **pino-pretty**         | ^13.1.2           | Formateo legible de logs pino (dev)                 |
| **@aws-sdk/client-s3**  | ^3.922.0          | SDK AWS S3 para subida de logs                      |
| **Materialize CSS**     | 1.0.0 (CDN)       | Framework CSS para UI                               |
| **Docker**              | 24+               | Contenerización de la aplicación                    |
| **Docker Compose**      | v2 (plugin)       | Orquestación de contenedores                        |

---

## ✅ Requisitos previos

- Node.js 22.x
- npm 10.x
- MySQL 8.x corriendo localmente (o accesible en red)
- Docker Desktop (solo si se va a usar el modo contenedor)

---

## 🛠 Instalación

```bash
# 1. Clonar el repositorio
git clone https://dev.azure.com/MontecheloPipelines/SquadMiosV2/_git/WidgetWeb_IDEARTES

# 2. Entrar a la carpeta del proyecto
cd WidgetWeb_IDEARTES/v1

# 3. Instalar dependencias
npm install
```

> **Nota:** La carpeta `v1/uploads/` debe tener permisos de escritura, ya que en ella se crean subcarpetas para almacenar los archivos adjuntos enviados desde el chat.

---

## ⚙️ Configuración de entorno (`v1/.env`)

Copia el archivo de ejemplo y completa los valores según el ambiente:

```bash
cp .env.example .env
```

### Variables disponibles

```env
# Proyecto
PROJECT_CLIENT=etb-idartes
PROJECT_TIPO=widget-chat-web
PROJECT_NAME=widget-chat-web-etb-idartes
PROJECT_VERSION=1.0.0
PROJECT_ENV=DEV          # DEV | QA | PRO

# Servidor
APP_PORT=3000
APP_URL=http://localhost:3000

# Sesión
SESSION_NAME=widget_session
APP_SECRET=tu_secreto_aqui

# Base de datos
DB_HOST=localhost        # En Docker: host.docker.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD='tu_password'
DB_NAME=widget_idartes
DB_POOL_SIZE=10

# CORS (URLs permitidas separadas por coma)
ALLOWED_ORIGINS=http://localhost:3000,https://tu-sitio.com

# Horario de atención (formato HH:MM)
INICIO_HORARIO_ATENCION=07:00
FIN_HORARIO_ATENCION=16:30

# Soul Chat
URL_API_SOUL_CHAT=https://url-soul-chat.com/api

# Rate limiting por IP
LIMITE_MINUTOS=15
LIMITE_MAX_PETICIONES=100

# Cierre automático de chats inactivos (en horas)
TIEMPO_LIMITE_CHAT_ABIERTOS=24

# Cron: cierre de chats antiguos (cada 30 min por defecto)
CRON_CERRAR_CHATS_ANTIGUOS=*/30 * * * *

# AWS S3 para logs
UPLOAD_LOGS_TO_S3=false
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET_NAME=tu_bucket

# Cron: subida de logs a S3 (cada hora por defecto)
S3_UPLOAD_CRON_SCHEDULE=0 * * * *
S3_DELETE_AFTER_UPLOAD=false
```

> La diferencia entre los ambientes **QA** y **PRO** está en el valor de `PROJECT_ENV` y las URLs/credenciales configuradas en cada `.env`. El comando que levanta el servidor (`node app.js`) es el mismo en ambos casos; el logger y otros comportamientos cambian automáticamente según `PROJECT_ENV`.

---

## 🗄 Base de datos — Migraciones

Ejecutar los archivos SQL en el siguiente orden desde `v1/migrations/`:

```bash
# 1. Crear la base de datos y tablas principales (tbl_chat, tbl_historico_chat, triggers)
mysql -u root -p < migrations/create_database.sql

# 2. Agregar soporte de adjuntos
mysql -u root -p < migrations/add_adjuntos_feature.sql
```

> Antes de ejecutar, verificar que `create_database.sql` apunte a la base de datos correcta según el ambiente.

---

## 🚀 Ejecución

### Desarrollo local
```bash
npm run dev
```
Levanta `app.js` con **nodemon** (hot reload). Usa las variables de `v1/.env`.

### Ambiente QA
```bash
npm run qa
```
Ejecuta `node app.js`. Configurar `PROJECT_ENV=QA` en el `.env`.

### Ambiente producción
```bash
npm run pro
```
Ejecuta `node app.js`. Configurar `PROJECT_ENV=PRO` en el `.env`.

### Modo Docker (app + MySQL local)
```bash
npm run docker:up      # Construir y levantar
npm run docker:logs    # Seguir logs en tiempo real
npm run docker:down    # Detener y limpiar contenedores
```
La app corre en contenedor pero se conecta a **MySQL local** (fuera de Docker). Asegurarse de que `DB_HOST=host.docker.internal` en el `.env`.

---

## 🧾 Scripts npm

| Script                | Comando                        | Uso                                           |
|-----------------------|--------------------------------|-----------------------------------------------|
| `npm run dev`         | `nodemon app.js`               | Desarrollo — recarga automática ante cambios  |
| `npm run qa`          | `node app.js`                  | Ambiente QA / pruebas manuales                |
| `npm run pro`         | `node app.js`                  | Producción                                    |
| `npm run test`        | `node testing/testSoulChat.js` | Probar integración Soul Chat / logger         |
| `npm run docker:view` | `docker compose ps`            | Ver estado de contenedores                    |
| `npm run docker:up`   | `docker compose up --build`    | Construir y levantar en Docker                |
| `npm run docker:logs` | `docker compose logs -f`       | Seguir logs del contenedor                    |
| `npm run docker:down` | `docker compose down`          | Detener y eliminar contenedores               |

---

## 🗂 Estructura principal del proyecto

```
v1/
├── app.js                          # Punto de entrada Express
├── .env / .env.example             # Variables de entorno
├── controllers/
│   └── widget/
│       ├── chat.controller.js      # Creación/cierre de chats, monitor, filtros
│       └── mensaje.controller.js   # Recepción de mensajes, integración árbol y Soul Chat
├── models/
│   └── widget/
│       ├── chat.model.js           # Operaciones sobre tbl_chat
│       ├── mensaje.model.js        # Operaciones sobre tbl_mensaje
│       └── arbolChatBot.model.js   # Árbol de atención, encuesta, Soul Chat
├── routes/                         # Rutas Express para /widget/chat y endpoints del widget
├── seeds/
│   └── dataEstatica.js             # Textos del árbol, mensajes y configuración del flujo
├── migrations/                     # SQL para tablas, triggers y migraciones
├── logger/
│   └── index.js                    # Logger pino con rotación diaria y subida a S3
├── assets/
│   ├── js/widget/chat.js           # Lógica frontend del chat (renderizado, adjuntos, etc.)
│   └── css/widget/chat.css         # Estilos del widget de chat
├── widget/
│   └── chatWeb.js                  # Script de integración del widget en sitios externos
└── uploads/                        # Archivos adjuntos y logs (requiere permisos de escritura)
```

---

## 🔁 Flujo de alto nivel

1. **Usuario abre el widget**
   - Se consume el endpoint para crear chat (`chat.controller.js → crear`), se crea registro en `tbl_chat` y se envían:
     - Mensaje de saludo.
     - Mensaje solicitando *Nombres y Apellidos* (primer paso del árbol).

2. **Usuario envía un mensaje**
   - `mensaje.controller.js → crear`:
     - Guarda el mensaje en `tbl_mensaje`.
     - Llama a `arbolChatBot.arbolChatBot(remitente, contenido)`:
       - Evalúa el paso actual del árbol (saludo, datos, paso asesor, encuesta, cierre, etc.).
       - Actualiza `tbl_chat` con el nuevo paso y datos capturados.
       - Crea respuestas en `tbl_mensaje` según el flujo configurado en `dataEstatica.js`.

3. **Paso a asesor / Soul Chat**
   - Cuando corresponde, el árbol envía los datos consolidados del cliente a **Soul Chat** mediante `serviceSoulChat.service.js`.

4. **Encuesta de satisfacción**
   - Al finalizar la atención, el árbol dispara la encuesta:
     - Calificación de servicio, amabilidad, tiempo, calidad, conocimiento y solución.
     - Comentario final (cierra el chat y envía mensaje de despedida).

5. **Monitor y logs**
   - El módulo de monitor (`chat.controller.js → monitor`) permite consultar chats con filtros.
   - Los logs en archivo / S3 permiten trazabilidad técnica y auditoría.

---

## 🧾 Logging (Pino + rotación diaria + S3)

El logger se encuentra en `v1/logger/index.js` y usa **pino**.

### Configuración base
- Nivel de log: variable `LOG_LEVEL` (por defecto `info`).
- Campos base en cada línea de log:
  - `servicio`: `${PROJECT_TIPO}-${PROJECT_CLIENT}`
  - `ambiente`: `PROJECT_ENV` (`DEV`, `QA`, `PRO`)

### En desarrollo / QA (`PROJECT_ENV` distinto de `PRO`)
- Usa **pino-pretty**.
- Logs legibles a color por consola (stdout).

### En producción (`PROJECT_ENV === 'PRO'`)
- Escribe logs a archivo con **rotación diaria automática** en:
  ```
  v1/uploads/logs/<servicio>-<ENV>-YYYY-MM-DD.log
  ```
- También envía logs a stdout (para agregadores tipo Grafana / CloudWatch).
- Ejemplo de rotación:
  ```
  Día 1 → widget-chat-web-etb-idartes-PRO-2026-04-16.log
  Día 2 → widget-chat-web-etb-idartes-PRO-2026-04-17.log  (el del día anterior se cierra correctamente)
  ```

### Subida a S3
- Un scheduler (`node-cron`) y el servicio `serviceS3Aws.service.js` suben periódicamente los archivos de log a **AWS S3** según el cron configurado en `S3_UPLOAD_CRON_SCHEDULE`.
- `S3_DELETE_AFTER_UPLOAD=true` elimina el archivo local tras subirlo; `false` lo conserva.
- Para probar el logger: `npm run test`.

---

## 🐳 Modo Docker (App + MySQL Local)

Permite ejecutar la aplicación en un contenedor Docker conectándose a tu MySQL local. Ideal para desarrollo y pruebas sin duplicar servidores de base de datos.

### Requisitos
- Docker Desktop instalado (incluye Docker Compose v2)
- MySQL local corriendo en tu máquina (fuera de Docker)

### Configuración previa
1. Asegúrate de que tu MySQL local esté corriendo y accesible.
2. En tu `.env`, configura `DB_HOST=host.docker.internal` para que el contenedor acceda a MySQL local.

### Comandos

```bash
# Ver estado de contenedores
npm run docker:view        # o: docker compose ps

# Construir y levantar la app en Docker
npm run docker:up          # o: docker compose up --build

# Seguir logs en tiempo real
npm run docker:logs        # o: docker compose logs -f

# Detener la app
npm run docker:down        # o: docker compose down

# Eliminar contenedores, redes y volúmenes huérfanos
docker compose down -v --remove-orphans
```

---

## 🌐 Integración externa (widget en sitios de terceros)

Para embeber el widget en cualquier sitio web externo:

### 1. Agregar Google Fonts en `<head>`
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### 2. Agregar el contenedor en `<body>`
```html
<div id="contenedorWidget"></div>
```

### 3. Agregar el script de carga antes de `</body>`

Reemplazar `APP_URL` con la URL base del servidor donde está desplegada la aplicación:

```html
<script>
    const URL_BASE = 'APP_URL';
    const URL_CSS  = `${URL_BASE}/chatWeb.css`;
    const URL_JS   = `${URL_BASE}/chatWeb.js`;

    function cargarConTimeout(cargarFn, src, timeout = 1500) {
        return new Promise((resolve, reject) => {
            let el;
            const timer = setTimeout(() => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
                reject(new Error('Timeout al cargar: ' + src));
            }, timeout);
            cargarFn(src)
                .then(() => { clearTimeout(timer); resolve(); })
                .catch((err) => { clearTimeout(timer); reject(err); });
            if (cargarFn === cargarCSS) el = document.querySelector(`link[href='${src}']`);
            if (cargarFn === cargarJS)  el = document.querySelector(`script[src='${src}']`);
        });
    }

    function cargarCSS(src) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = src;
            link.onload = resolve; link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    function cargarJS(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve; script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function intentarCarga(tiempoInicio) {
        const intervalo = 15000;
        const maximo    = 300000;
        if (Date.now() - tiempoInicio >= maximo) {
            console.error('❌ Tiempo máximo de reintentos alcanzado');
            return;
        }
        console.log('🔄 Reintentando cargar el widget...');
        cargarConTimeout(cargarCSS, URL_CSS, 1500)
            .then(() => cargarConTimeout(cargarJS, URL_JS, 1500))
            .then(() => {
                if (window.WidgetChat?.init && document.getElementById('contenedorWidget')) {
                    window.WidgetChat.init();
                    console.log('✅ Widget cargado exitosamente');
                } else {
                    throw new Error('El widget o el contenedor no están disponibles');
                }
            })
            .catch(() => setTimeout(() => intentarCarga(tiempoInicio), intervalo));
    }

    cargarConTimeout(cargarCSS, URL_CSS, 1500)
        .then(() => cargarConTimeout(cargarJS, URL_JS, 1500))
        .then(() => {
            if (window.WidgetChat?.init && document.getElementById('contenedorWidget')) {
                window.WidgetChat.init();
                console.log('✅ Widget cargado exitosamente');
            } else {
                console.error('❌ El widget o el contenedor no están disponibles.');
            }
        })
        .catch((error) => {
            console.error('❌ Error al cargar recursos del widget:', error);
            setTimeout(() => intentarCarga(Date.now()), 15000);
        });
</script>
```

### Consideraciones
- Los archivos `chatWeb.css` y `chatWeb.js` deben ser accesibles desde la red donde está alojada la página de destino.
- Verificar que no existan conflictos con otros estilos o scripts del sitio que puedan afectar el widget.
- Realizar pruebas en ambiente DEV/QA antes de pasar a producción.

---

## 🔗 URLs de acceso

| Ambiente    | App                                                      | Monitor                                                                      |
|-------------|----------------------------------------------------------|------------------------------------------------------------------------------|
| Desarrollo  | `http://localhost:{APP_PORT}`                            | `http://localhost:{APP_PORT}/widget/chat/monitor`                            |
| QA          | https://widget-chat-web-etb-idartes-dev.rpagroupcos.com | https://widget-chat-web-etb-idartes-dev.rpagroupcos.com/widget/chat/monitor  |
| Producción  | [PENDIENTE]                                              | [PENDIENTE]/widget/chat/monitor                                              |

---

## 📋 Módulos y funcionalidades

- Árbol de atención automatizado
- Consumo de APIs externas (Soul Chat)
- Mensaje de cierre por inactividad
- Alerta de inactividad al usuario
- Soporte de archivos adjuntos (jpg, png, pdf, doc, docx, xls, xlsx)
- Previsualización de adjuntos en el chat (miniaturas de imagen + lightbox, tarjetas por tipo de archivo)
- Monitor de conversaciones con filtros
- Rate limiting por IP
- Cierre automático de chats inactivos (cron configurable)
- Logging estructurado con rotación diaria y subida a AWS S3

---

## 🤝 Contribuyendo

Repositorio: https://dev.azure.com/MontecheloPipelines/SquadMiosV2/_git/WidgetWeb_IDEARTES

1. Desde la rama `main`, crear una rama con el nombre de la funcionalidad.
2. Clonar el proyecto: `git clone <url-repositorio>`.
3. Crear la rama: `git checkout -b nombre_tu_rama`.
4. Realizar los cambios y hacer commit: `git commit -m 'descripción del cambio'`.
5. Subir la rama: `git push origin nombre_tu_rama`.
6. Solicitar merge a la rama `quality`.
7. Una vez aprobado en `quality`, solicitar merge a `main`.
8. Solicitar el deploy desde `main`.

---

## 📄 Licencia

Todos los derechos reservados a Montechelo.
