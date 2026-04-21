// ! ================================================================================================================================================
// !                                                      MIDDLEWARE RATE LIMITING
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');
const logger = require('../logger');
const { getOrigen, getDestino, getContextoRecurso } = require('../logger/context');

// * OBTENER VALORES DEL .ENV CON PARSEO SEGURO
const getEnvInt = (varName, defaultValue) => {
    const value = parseInt(process.env[varName]);
    return isNaN(value) ? defaultValue : value;
};

// * CONFIGURACIÓN BASE DESDE .ENV
const LIMITE_MINUTOS = getEnvInt('LIMITE_MINUTOS'); // Solo valor del .env
const LIMITE_MAX_PETICIONES = getEnvInt('LIMITE_MAX_PETICIONES'); // Solo valor del .env

const BASE_WINDOW_MS = LIMITE_MINUTOS * 60 * 1000; // Convertir minutos a ms
const BASE_MAX = LIMITE_MAX_PETICIONES;

// * LOGS PARA DEBUGGING
logger.info({
    contexto: 'middleware',
    recurso: 'rateLimiter',
    configuracion: {
        limiteMinutos: LIMITE_MINUTOS,
        limiteMaxPeticiones: LIMITE_MAX_PETICIONES,
        windowMs: BASE_WINDOW_MS,
        windowSegundos: BASE_WINDOW_MS / 1000,
        retryAfterSegundos: BASE_WINDOW_MS / 1000
    }
}, 'Rate Limiter configurado');

// * RATE LIMITING ESPECÍFICO PARA CREAR CHAT
const crearChatLimiter = (req, res, next) => {
    
    try {
        const ip = req.ip;
        const now = Date.now();
        const blockTimeMs = BASE_WINDOW_MS; // Tiempo de bloqueo en ms
        const maxRequests = BASE_MAX; // Máximo de peticiones
        
        // Crear clave única para esta IP Y ENDPOINT ESPECÍFICO
        const endpoint = req.path.split('/').pop();
        const key = `crearChat_${ip}_${endpoint}`;
        
        // console.log('🔑 CREAR CHAT LIMITER: Clave única:', key, 'Límite:', maxRequests, 'bloqueo:', LIMITE_MINUTOS, 'minutos');
        
        // Inicializar el store global si no existe
        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map();
        }
        
        // Obtener datos existentes o crear nuevos
        let userData = global.rateLimitStore.get(key);
        
        if (!userData) {
            // Primera vez para esta IP en este endpoint
            userData = {
                count: 0,
                blocked: false,
                blockStartTime: null
            };
            logger.info({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearChatLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                ip,
                endpoint,
                accion: 'nuevo_usuario'
            }, 'Nuevo usuario en rate limiter crear chat');
            
            global.rateLimitStore.set(key, userData);
        }
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                logger.info({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    ip,
                    endpoint,
                    tiempoBloqueadoSegundos: Math.round(timeSinceBlock / 1000),
                    accion: 'bloqueo_completado'
                }, 'Bloqueo completado - contador reiniciado');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    tiempoRestanteSegundos: Math.round(timeRemaining / 1000),
                    retryAfter: LIMITE_MINUTOS
                }, 'IP aún bloqueada en rate limiter crear chat');
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
        }
        
        // SI NO ESTÁ BLOQUEADO, INCREMENTAR CONTADOR Y VERIFICAR LÍMITE
        if (!userData.blocked) {
            userData.count++;
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    peticiones: userData.count,
                    maxPeticiones: maxRequests,
                    bloqueadoPorMinutos: LIMITE_MINUTOS
                }, 'Límite alcanzado - IP bloqueada');
                
                global.rateLimitStore.set(key, userData);
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
            
            global.rateLimitStore.set(key, userData);
            
        } else {
            // ESTE CASO NO DEBERÍA OCURRIR, PERO POR SEGURIDAD
            logger.warn({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearChatLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 429,
                rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                ip,
                endpoint,
                accion: 'estado_inconsistente'
            }, 'Estado inconsistente en rate limiter');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        logger.error({
            contexto: 'middleware',
            recurso: 'rateLimiter.crearChatLimiter',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en crearChatLimiter');
        next();
    }
};

// * RATE LIMITING ESPECÍFICO PARA FORMULARIO INICIAL
const formLimiter = (req, res, next) => {
    
    try {
        const ip = req.ip;
        const now = Date.now();
        const blockTimeMs = BASE_WINDOW_MS; // Tiempo de bloqueo en ms
        const maxRequests = BASE_MAX; // Máximo de peticiones
        
        // Crear clave única para esta IP Y ENDPOINT ESPECÍFICO
        const endpoint = req.path.split('/').pop();
        const key = `form_${ip}_${endpoint}`;
        
        // Inicializar el store global si no existe
        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map();
        }
        
        // Obtener datos existentes o crear nuevos
        let userData = global.rateLimitStore.get(key);
        
        if (!userData) {
            // Primera vez para esta IP en este endpoint
            userData = {
                count: 0,
                blocked: false,
                blockStartTime: null
            };
            logger.info({
                contexto: 'middleware',
                recurso: 'rateLimiter.formLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                ip,
                endpoint,
                accion: 'nuevo_usuario'
            }, 'Nuevo usuario en rate limiter formulario');
            
            global.rateLimitStore.set(key, userData);
        }
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                logger.info({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.formLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    ip,
                    endpoint,
                    tiempoBloqueadoSegundos: Math.round(timeSinceBlock / 1000),
                    accion: 'bloqueo_completado'
                }, 'Bloqueo completado - contador reiniciado');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.formLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    tiempoRestanteSegundos: Math.round(timeRemaining / 1000),
                    retryAfter: LIMITE_MINUTOS
                }, 'IP aún bloqueada en rate limiter formulario');
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
        }
        
        // SI NO ESTÁ BLOQUEADO, INCREMENTAR CONTADOR Y VERIFICAR LÍMITE
        if (!userData.blocked) {
            userData.count++;
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.formLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    peticiones: userData.count,
                    maxPeticiones: maxRequests,
                    bloqueadoPorMinutos: LIMITE_MINUTOS
                }, 'Límite alcanzado - IP bloqueada');
                
                global.rateLimitStore.set(key, userData);
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
            
            global.rateLimitStore.set(key, userData);
            
        } else {
            // ESTE CASO NO DEBERÍA OCURRIR, PERO POR SEGURIDAD
            logger.warn({
                contexto: 'middleware',
                recurso: 'rateLimiter.formLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 429,
                rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                ip,
                endpoint,
                accion: 'estado_inconsistente'
            }, 'Estado inconsistente en rate limiter');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        logger.error({
            contexto: 'middleware',
            recurso: 'rateLimiter.formLimiter',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en formLimiter');
        next();
    }
};

// * RATE LIMITING ESPECÍFICO PARA CREAR MENSAJE
const crearMensajeLimiter = (req, res, next) => {
    
    try {
        const ip = req.ip;
        const now = Date.now();
        const blockTimeMs = BASE_WINDOW_MS; // Tiempo de bloqueo en ms
        const maxRequests = BASE_MAX; // Máximo de peticiones
        
        // Crear clave única para esta IP Y ENDPOINT ESPECÍFICO
        const endpoint = req.path.split('/').pop();
        const key = `crearMensaje_${ip}_${endpoint}`;
        
        // Inicializar el store global si no existe
        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map();
        }
        
        // Obtener datos existentes o crear nuevos
        let userData = global.rateLimitStore.get(key);
        
        if (!userData) {
            // Primera vez para esta IP en este endpoint
            userData = {
                count: 0,
                blocked: false,
                blockStartTime: null
            };
            logger.info({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                ip,
                endpoint,
                accion: 'nuevo_usuario'
            }, 'Nuevo usuario en rate limiter crear mensaje');
            
            global.rateLimitStore.set(key, userData);
        }
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                logger.info({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    ip,
                    endpoint,
                    tiempoBloqueadoSegundos: Math.round(timeSinceBlock / 1000),
                    accion: 'bloqueo_completado'
                }, 'Bloqueo completado - contador reiniciado');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    tiempoRestanteSegundos: Math.round(timeRemaining / 1000),
                    retryAfter: LIMITE_MINUTOS
                }, 'IP aún bloqueada en rate limiter crear mensaje');
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
        }
        
        // SI NO ESTÁ BLOQUEADO, INCREMENTAR CONTADOR Y VERIFICAR LÍMITE
        if (!userData.blocked) {
            userData.count++;
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    peticiones: userData.count,
                    maxPeticiones: maxRequests,
                    bloqueadoPorMinutos: LIMITE_MINUTOS
                }, 'Límite alcanzado - IP bloqueada');
                
                global.rateLimitStore.set(key, userData);
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
            
            global.rateLimitStore.set(key, userData);
            
        } else {
            // ESTE CASO NO DEBERÍA OCURRIR, PERO POR SEGURIDAD
            logger.warn({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 429,
                rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                ip,
                endpoint,
                accion: 'estado_inconsistente'
            }, 'Estado inconsistente en rate limiter');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        logger.error({
            contexto: 'middleware',
            recurso: 'rateLimiter.crearMensajeLimiter',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en crearMensajeLimiter');
        next();
    }
};

// * RATE LIMITING ESPECÍFICO PARA CREAR MENSAJE DESDE SOUL CHAT
const crearMensajeSoulChatLimiter = (req, res, next) => {
    
    try {
        const ip = req.ip;
        const now = Date.now();
        const blockTimeMs = BASE_WINDOW_MS; // Tiempo de bloqueo en ms
        const maxRequests = BASE_MAX; // Máximo de peticiones
        
        // Crear clave única para esta IP Y ENDPOINT ESPECÍFICO
        const endpoint = req.path.split('/').pop();
        const key = `crearMensajeSoulChat_${ip}_${endpoint}`;
        
        // Inicializar el store global si no existe
        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map();
        }
        
        // Obtener datos existentes o crear nuevos
        let userData = global.rateLimitStore.get(key);
        
        if (!userData) {
            // Primera vez para esta IP en este endpoint
            userData = {
                count: 0,
                blocked: false,
                blockStartTime: null
            };
            logger.info({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                ip,
                endpoint,
                accion: 'nuevo_usuario'
            }, 'Nuevo usuario en rate limiter crear mensaje soul chat');
            
            global.rateLimitStore.set(key, userData);
        }
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                logger.info({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    ip,
                    endpoint,
                    tiempoBloqueadoSegundos: Math.round(timeSinceBlock / 1000),
                    accion: 'bloqueo_completado'
                }, 'Bloqueo completado - contador reiniciado');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    tiempoRestanteSegundos: Math.round(timeRemaining / 1000),
                    retryAfter: LIMITE_MINUTOS
                }, 'IP aún bloqueada en rate limiter crear mensaje soul chat');
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
        }
        
        // SI NO ESTÁ BLOQUEADO, INCREMENTAR CONTADOR Y VERIFICAR LÍMITE
        if (!userData.blocked) {
            userData.count++;
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    peticiones: userData.count,
                    maxPeticiones: maxRequests,
                    bloqueadoPorMinutos: LIMITE_MINUTOS
                }, 'Límite alcanzado - IP bloqueada');
                
                global.rateLimitStore.set(key, userData);
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
            
            global.rateLimitStore.set(key, userData);
            
        } else {
            // ESTE CASO NO DEBERÍA OCURRIR, PERO POR SEGURIDAD
            logger.warn({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 429,
                rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                ip,
                endpoint,
                accion: 'estado_inconsistente'
            }, 'Estado inconsistente en rate limiter');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        logger.error({
            contexto: 'middleware',
            recurso: 'rateLimiter.crearMensajeSoulChatLimiter',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en crearMensajeSoulChatLimiter');
        next();
    }
};

// * RATE LIMITING ESPECÍFICO PARA CREAR MENSAJE DESDE SOUL CHAT - PASO WIDGET ARBOL ENCUESTA
const crearMensajeSoulChatEncuestaLimiter = (req, res, next) => {
    
    try {
        const ip = req.ip;
        const now = Date.now();
        const blockTimeMs = BASE_WINDOW_MS; // Tiempo de bloqueo en ms
        const maxRequests = BASE_MAX; // Máximo de peticiones
        
        // Crear clave única para esta IP Y ENDPOINT ESPECÍFICO
        const endpoint = req.path.split('/').pop();
        const key = `crearMensajeSoulChatEncuesta_${ip}_${endpoint}`;
        
        // Inicializar el store global si no existe
        if (!global.rateLimitStore) {
            global.rateLimitStore = new Map();
        }
        
        // Obtener datos existentes o crear nuevos
        let userData = global.rateLimitStore.get(key);
        
        if (!userData) {
            // Primera vez para esta IP en este endpoint
            userData = {
                count: 0,
                blocked: false,
                blockStartTime: null
            };
            logger.info({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                ip,
                endpoint,
                accion: 'nuevo_usuario'
            }, 'Nuevo usuario en rate limiter crear mensaje soul chat encuesta');
            
            global.rateLimitStore.set(key, userData);
        }
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                logger.info({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    ip,
                    endpoint,
                    tiempoBloqueadoSegundos: Math.round(timeSinceBlock / 1000),
                    accion: 'bloqueo_completado'
                }, 'Bloqueo completado - contador reiniciado');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    tiempoRestanteSegundos: Math.round(timeRemaining / 1000),
                    retryAfter: LIMITE_MINUTOS
                }, 'IP aún bloqueada en rate limiter crear mensaje soul chat encuesta');
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
        }
        
        // SI NO ESTÁ BLOQUEADO, INCREMENTAR CONTADOR Y VERIFICAR LÍMITE
        if (!userData.blocked) {
            userData.count++;
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                logger.warn({
                    contexto: 'middleware',
                    recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
                    origen: getOrigen(req),
                    destino: getDestino(req),
                    contextoRecurso: getContextoRecurso(req),
                    codigoRespuesta: 429,
                    rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    ip,
                    endpoint,
                    peticiones: userData.count,
                    maxPeticiones: maxRequests,
                    bloqueadoPorMinutos: LIMITE_MINUTOS
                }, 'Límite alcanzado - IP bloqueada');
                
                global.rateLimitStore.set(key, userData);
                
                return res.status(429).json({
                    status: 429,
                    message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                    retryAfter: LIMITE_MINUTOS
                });
            }
            
            global.rateLimitStore.set(key, userData);
            
        } else {
            // ESTE CASO NO DEBERÍA OCURRIR, PERO POR SEGURIDAD
            logger.warn({
                contexto: 'middleware',
                recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
                origen: getOrigen(req),
                destino: getDestino(req),
                contextoRecurso: getContextoRecurso(req),
                codigoRespuesta: 429,
                rta: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                ip,
                endpoint,
                accion: 'estado_inconsistente'
            }, 'Estado inconsistente en rate limiter');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        logger.error({
            contexto: 'middleware',
            recurso: 'rateLimiter.crearMensajeSoulChatEncuestaLimiter',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error en crearMensajeSoulChatEncuestaLimiter');
        next();
    }
};

module.exports = {
    crearChatLimiter,
    formLimiter,
    crearMensajeLimiter,
    crearMensajeSoulChatLimiter,
    crearMensajeSoulChatEncuestaLimiter,
};