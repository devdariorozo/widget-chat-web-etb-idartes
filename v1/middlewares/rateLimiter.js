// ! ================================================================================================================================================
// !                                                      MIDDLEWARE RATE LIMITING
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (24 de Enero de 2025)
// @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
// @version 1.0.0
// v1/middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');

// * OBTENER VALORES DEL .ENV CON PARSEO SEGURO
const getEnvInt = (varName, defaultValue) => {
    const value = parseInt(process.env[varName]);
    return isNaN(value) ? defaultValue : value;
};

// * CONFIGURACIÓN BASE DESDE .ENV
// Estos valores se aplican a TODOS los limiters que no especifiquen windowMs o max
const BASE_WINDOW_MS = getEnvInt('LIMITE_MINUTOS') * 60 * 1000; // Convertir minutos a ms
const BASE_MAX = getEnvInt('LIMITE_MAX_PETICIONES');

// * LOGS PARA DEBUGGING
console.log('🔧 Rate Limiter Configuración:');
console.log('   LIMITE_MINUTOS:', process.env.LIMITE_MINUTOS, '→', BASE_WINDOW_MS / 1000, 'segundos');
console.log('   LIMITE_MAX_PETICIONES:', process.env.LIMITE_MAX_PETICIONES, '→', BASE_MAX, 'requests');
console.log('   RetryAfter calculado:', BASE_WINDOW_MS / 1000, 'segundos');

// * CONFIGURACIÓN GENERAL DE RATE LIMITING
const createRateLimit = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || BASE_WINDOW_MS,
        max: options.max || BASE_MAX,
        message: {
            status: 429,
            message: options.message || 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.',
            retryAfter: Math.ceil((options.windowMs || BASE_WINDOW_MS) / 1000)
        },
        standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
        legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
        handler: (req, res) => {
            const retryAfter = Math.ceil((options.windowMs || BASE_WINDOW_MS) / 1000);
            console.log('🚫 Rate Limit activado para:', req.path, 'IP:', req.ip, 'RetryAfter:', retryAfter, 'segundos');
            
            res.status(429).json({
                status: 429,
                message: options.message || 'Demasiadas solicitudes desde esta IP, por favor intenta nuevamente más tarde.',
                retryAfter: retryAfter
            });
        },
        skip: (req) => {
            // Opcional: saltar rate limiting en desarrollo
            // return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
            return false; // NO saltar rate limiting para poder probarlo
        },
        ...options
    });
};

// * RATE LIMITING PARA ENDPOINTS CRÍTICOS
const criticalEndpointsLimiter = createRateLimit({
    message: 'Límite de solicitudes críticas excedido. Intenta nuevamente más tarde.'
});

// * RATE LIMITING PARA FORMULARIOS
const formLimiter = createRateLimit({
    message: 'Demasiados envíos de formulario. Intenta nuevamente más tarde.'
});

// * RATE LIMITING PARA MENSAJES DE CHAT
const chatLimiter = createRateLimit({
    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.'
});

// * RATE LIMITING PARA SUBIDA DE ARCHIVOS
const uploadLimiter = createRateLimit({
    message: 'Límite de subida de archivos excedido. Intenta nuevamente más tarde.'
});

// * RATE LIMITING PARA API EN GENERAL
const apiLimiter = createRateLimit({
    message: 'Límite de API excedido. Intenta nuevamente más tarde.'
});

// * RATE LIMITING ESTRICTO PARA ENDPOINTS DE AUTENTICACIÓN
const authLimiter = createRateLimit({
    message: 'Demasiados intentos de autenticación. Intenta nuevamente más tarde.'
});

// * RATE LIMITING PARA VIGILANCIA DE INACTIVIDAD
const inactivityLimiter = createRateLimit({
    message: 'Demasiadas verificaciones de inactividad. Intenta nuevamente más tarde.'
});

module.exports = {
    createRateLimit,
    criticalEndpointsLimiter,
    formLimiter,
    chatLimiter,
    uploadLimiter,
    apiLimiter,
    authLimiter,
    inactivityLimiter
};
