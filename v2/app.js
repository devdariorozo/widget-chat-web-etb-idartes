// ! ================================================================================================================================================
// !                                                          LEVANTAR SERVIDOR EXPRESS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/app.js

// ! REQUIRES
const express = require('express');
const app = express();
const os = require('os');
const morgan = require('morgan');
const moment = require('moment');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const pkg = require('./package.json');
app.set('pkg', pkg);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') });
const Handlebars = require('./helpers/handlebars.js');
const cors = require('cors');
const logger = require('./logger');
const httpLogger = require('./logger/http');
const uploadLogsToS3 = (process.env.UPLOAD_LOGS_TO_S3 || '').toLowerCase() === 'true';

// ! CONFIGURACIONES
// * CONFIGURACIÓN DE HORA LOCAL
morgan.token('localdate', function () {
    return moment().format('YYYY-MM-DD HH:mm:ss');
});
// * ACEPTAR IP REAL CUANDO HAY PROXY (Nginx/Cloudflare)
//   Necesario para que express-rate-limit use X-Forwarded-For sin error
//   Usa valor de entorno TRUST_PROXY si existe; por defecto 1 salto
const TRUST_PROXY_ENV = process.env.TRUST_PROXY;
if (TRUST_PROXY_ENV === 'true') {
    app.set('trust proxy', true);
} else if (TRUST_PROXY_ENV === 'false') {
    app.set('trust proxy', false);
} else if (TRUST_PROXY_ENV && !Number.isNaN(Number(TRUST_PROXY_ENV))) {
    app.set('trust proxy', Number(TRUST_PROXY_ENV));
} else {
    app.set('trust proxy', 1);
}

// ! CONFIGURACIONES
// * CONFIGURACIÓN DE CORS
// Obtener las URLs permitidas desde el .env
const allowedOriginsRaw = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = allowedOriginsRaw.split(',').map(origin => origin.trim());

const corsOptions = {
    origin: (origin, callback) => {
        logger.info({ contexto: 'cors', origenInicial: origin }, 'Validación de CORS - origen inicial');
        
        // Si ALLOWED_ORIGINS es '*', permitir todos los orígenes
        if (allowedOriginsRaw.trim() === '*') {
            logger.info({ contexto: 'cors' }, 'CORS: Modo abierto (*) - Permitiendo todos los orígenes');
            callback(null, true);
            return;
        }
        
        if (origin == undefined || origin == null) {
            origin = process.env.APP_URL;
        }
        logger.info({ contexto: 'cors', origenFinal: origin }, 'Validación de CORS - origen final');
        
        // Permitir solicitudes desde las URLs especificadas
        if (allowedOrigins.includes(origin)) {
            callback(null, true); // Permitir el origen
        } else {
            // Formatear la fecha y hora
            const now = new Date();
            const formattedDate = `${now.getUTCDate()}/${now.toLocaleString('default', { month: 'short' })}/${now.getUTCFullYear()}:${now.toISOString().substr(11, 8)} +0000`;
            if (origin) {
                logger.warn({ 
                    contexto: 'cors', 
                    origen, 
                    codigoRespuesta: 403, 
                    rta: 'Acceso denegado por CORS' 
                }, `Validación de CORS • Acceso denegado para: ${origin}`);
            } else {
                logger.warn({ 
                    contexto: 'cors', 
                    origen: 'desconocido', 
                    codigoRespuesta: 403, 
                    rta: 'Acceso denegado por CORS' 
                }, 'Validación de CORS • Acceso denegado para el origen desconocido');
            }
            callback(new Error('No se permite el acceso desde el origen especificado...')); // Denegar el origen
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    credentials: true, // Importante para widgets que usen cookies/sesiones
};
app.use(cors(corsOptions));
logger.info({ contexto: 'configuracion', recurso: 'CORS' }, 'Configuración de CORS aplicada correctamente');

// * CONFIGURACIÓN DEL PUERTO
const PORT = parseInt(process.env.APP_PORT) || 4000;
// * CONFIGURACIÓN DEL FORMATO JSON
app.set('json spaces', 2);

// * CONFIGURACION MOTOR DE PLANTILLAS HANDLEBARS
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: Handlebars,
}));
app.set('view engine', '.hbs');

// * CONFIGURACIÓN DE LAS RUTAS ESTÁTICAS
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'widget')));
app.use(express.static(path.join(__dirname, 'uploads')));

// ! MIDDLEWARES
// * MIDDLEWARE MORGAN PARA REGISTRAR SOLICITUDES HTTP
// app.use(morgan('■ ETB - IDARTES :localdate → :method → :status • :url → :response-time ms'));
// * MIDDLEWARE PINO-HTTP PARA REGISTRAR SOLICITUDES HTTP
app.use(httpLogger);

// * MIDDLEWARE PARA ACEPTAR DATOS EN FORMATO JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ! RUTAS
// * MODULO DE WIDGET
// TODO: CHAT WEB
app.use('/widget/chat', require('./routes/widget/chat.routes.js'));
// TODO: MENSAJE
app.use('/widget/mensaje', require('./routes/widget/mensaje.routes.js'));

// * RUTA INICIAL
app.get('/', (req, res) => {
    res.send({
        name: app.get('pkg').name,
        author: app.get('pkg').author,
        description: app.get('pkg').description,
        version: app.get('pkg').version
    });
});

// ! MANEJO DE RUTAS NO ENCONTRADAS
app.use((req, res, next) => {
    const { getOrigen, getDestino, getContextoRecurso } = require('./logger/context');
    logger.warn({
        origen: getOrigen(req),
        destino: getDestino(req),
        contextoRecurso: getContextoRecurso(req),
        codigoRespuesta: 404,
        rta: 'Ruta no encontrada'
    }, `Ruta '${req.url}' no encontrada`);
    res.status(404).json({
        status: 404,
        type: 'error',
        title: 'Error de Ruta',
        message: 'No se encontró la ruta solicitada...',
        error: `Ruta '${req.url}' no encontrada...`
    });
});

// ! MANEJO DE ERRORES
app.use((err, req, res, next) => {
    const { getOrigen, getDestino, getContextoRecurso } = require('./logger/context');
    logger.error({
        origen: getOrigen(req),
        destino: getDestino(req),
        contextoRecurso: getContextoRecurso(req),
        codigoRespuesta: err.statusCode || 500,
        errorMensaje: err.message,
        errorStack: err.stack
    }, 'Error interno del servidor');
    res.status(err.statusCode || 500).json({
        status: err.statusCode || 500,
        type: 'error',
        title: 'Error Interno',
        message: 'Error interno del servidor...',
        error: err.message
    });
});

// ! FUNCIÓN PARA OBTENER LA IP DEL SERVIDOR
function getServerIP() {
    // todo: Obtiene las interfaces de red del servidor
    const networkInterfaces = os.networkInterfaces();
    let serverIP = 'IP no disponible';

    // todo: Lista de interfaces posibles
    const possibleInterfaces = ['Ethernet', 'eno1', 'eth0', 'Wi-Fi'];
    for (const iface of possibleInterfaces) {
        if (networkInterfaces[iface]) {
            const address = networkInterfaces[iface].find(ifaceInfo => ifaceInfo.address && !ifaceInfo.internal);
            if (address) {
                serverIP = address.address;
                break;
            }
        }
    }

    return serverIP;
}

// ! INICIAR EL SERVIDOR
app.listen(PORT, () => {
    // console.log('========================================================================================');
    // console.log('                           ♦♦♦ INICIALIZANDO SISTEMA ♦♦♦');
    // console.log('========================================================================================');

    // // todo: Imprime la IP del servidor
    // console.log('• IP:', getServerIP());
    // // todo: Imprime el nombre del servidor
    // console.log('• SERVIDOR:', os.hostname());
    // // todo: Imprime el sistema operativo y arquitectura
    // console.log('• SISTEMA:', os.type(), os.arch());
    // // todo: Imprime el cliente
    // console.log(`• CLIENTE: ${process.env.PROJECT_CLIENT}`);
    // // todo: Imprime el tipo de aplicación
    // console.log(`• TIPO: ${process.env.PROJECT_TIPO}`);
    // // todo: Imprime el nombre del proyecto
    // console.log(`• PROYECTO: ${process.env.PROJECT_NAME}`);
    // // todo: Imprime la versión del proyecto
    // console.log(`• VERSION: ${process.env.PROJECT_VERSION}`);
    // // todo: Imprime el ambiente del proyecto
    // console.log(`• AMBIENTE: ${process.env.PROJECT_ENV}`);
    // // todo: Imprime el puerto de la aplicación
    // console.log(`• PUERTO: ${process.env.APP_PORT}`);
    // // todo: Imprime la url de la aplicación
    // console.log(`• URL: ${process.env.APP_URL}`);
    // // todo: Imprime nombre de la base de datos
    // console.log(`• BASE DE DATOS: ${process.env.DB_NAME}`);
    // console.log('========================================================================================');
    // console.log('                           ♦♦♦ INICIALIZANDO SISTEMA ♦♦♦');
    // console.log('========================================================================================');
    logger.info({
        contexto: 'inicio',
        servidor: {
            ip: getServerIP(),
            hostname: os.hostname(),
            sistema: `${os.type()} ${os.arch()}`
        },
        proyecto: {
            cliente: process.env.PROJECT_CLIENT,
            tipo: process.env.PROJECT_TIPO,
            nombre: process.env.PROJECT_NAME,
            version: process.env.PROJECT_VERSION,
            ambiente: process.env.PROJECT_ENV,
            puerto: process.env.APP_PORT,
            url: process.env.APP_URL,
            baseDatos: process.env.DB_NAME
        }
    }, '♦♦♦ INICIALIZANDO SISTEMA ♦♦♦');
    
    // ! INICIAR SCHEDULERS
    try {
        const cerrarChatsAntiguosScheduler = require('./schedulers/cerrarChatsAntiguos.scheduler.js');
        cerrarChatsAntiguosScheduler.iniciarScheduler();
        logger.info({ contexto: 'schedulers', nombre: 'cerrarChatsAntiguos' }, 'Scheduler iniciado correctamente');
    } catch (error) {
        logger.error({ 
            contexto: 'schedulers', 
            nombre: 'cerrarChatsAntiguos',
            errorMensaje: error.message 
        }, 'Error al iniciar scheduler');
    }

    if (uploadLogsToS3) {
        try {
            const subidaLogsS3Scheduler = require('./schedulers/subidaLogsS3.scheduler.js');
            subidaLogsS3Scheduler.iniciarScheduler();
            logger.info({ contexto: 'schedulers', nombre: 'subidaLogsS3' }, 'Scheduler iniciado correctamente');
        } catch (error) {
            logger.error({ 
                contexto: 'schedulers', 
                nombre: 'subidaLogsS3',
                errorMensaje: error.message 
            }, 'Error al iniciar scheduler');
        }
    } else {
        logger.info({
            contexto: 'schedulers',
            nombre: 'subidaLogsS3',
            habilitado: false
        }, 'Scheduler de subida de logs a S3 deshabilitado por configuración');
    }
});
