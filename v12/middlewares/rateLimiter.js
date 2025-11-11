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
const LIMITE_MINUTOS = getEnvInt('LIMITE_MINUTOS'); // Solo valor del .env
const LIMITE_MAX_PETICIONES = getEnvInt('LIMITE_MAX_PETICIONES'); // Solo valor del .env

const BASE_WINDOW_MS = LIMITE_MINUTOS * 60 * 1000; // Convertir minutos a ms
const BASE_MAX = LIMITE_MAX_PETICIONES;

// * LOGS PARA DEBUGGING
console.log('🔧 Rate Limiter Configuración:');
console.log('   LIMITE_MINUTOS:', LIMITE_MINUTOS, 'minutos →', BASE_WINDOW_MS / 1000, 'segundos');
console.log('   LIMITE_MAX_PETICIONES:', LIMITE_MAX_PETICIONES, 'peticiones');
console.log('   RetryAfter calculado:', BASE_WINDOW_MS / 1000, 'segundos');

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
            console.log('🆕 CREAR CHAT LIMITER: Nuevo usuario IP:', ip, 'Endpoint:', endpoint);
            
            global.rateLimitStore.set(key, userData);
        }
        
        // console.log('📋 CREAR CHAT LIMITER: Estado actual - Count:', userData.count, 'Blocked:', userData.blocked, 'BlockStartTime:', userData.blockStartTime);
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            console.log('⏰ CREAR CHAT LIMITER: Tiempo desde bloqueo:', Math.round(timeSinceBlock / 1000), 'segundos');
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                console.log('🔄 CREAR CHAT LIMITER: Bloqueo completado para IP:', ip, 'Endpoint:', endpoint,
                           'Tiempo bloqueado:', Math.round(timeSinceBlock / 1000), 'segundos');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                console.log('✅ CREAR CHAT LIMITER: Contador reiniciado para IP:', ip, 'Endpoint:', endpoint,
                           'Contador: 0/', maxRequests);
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                console.log('⏳ CREAR CHAT LIMITER: IP aún bloqueada:', ip, 'Endpoint:', endpoint,
                           'Tiempo restante:', Math.round(timeRemaining / 1000), 'segundos');
                
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
            console.log('📊 CREAR CHAT LIMITER: IP:', ip, 'Endpoint:', endpoint,
                       'Petición:', userData.count, '/', maxRequests,
                       'Restantes:', maxRequests - userData.count);
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                console.log('🚫 CREAR CHAT LIMITER: Límite alcanzado para IP:', ip, 'Endpoint:', endpoint,
                           'Peticiones:', userData.count, '/', maxRequests,
                           'Bloqueado por:', LIMITE_MINUTOS, 'minutos');
                
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
            console.log('⚠️ CREAR CHAT LIMITER: Estado inconsistente');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en crearChatLimiter:', error);
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
        
        // console.log('🔑 CHAT LIMITER: Clave única:', key, 'Límite:', maxRequests, 'bloqueo:', LIMITE_MINUTOS, 'minutos');
        
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
            console.log('🆕 FORM LIMITER: Nuevo usuario IP:', ip, 'Endpoint:', endpoint);
            
            global.rateLimitStore.set(key, userData);
        }
        
        // console.log('📋 FORM LIMITER: Estado actual - Count:', userData.count, 'Blocked:', userData.blocked, 'BlockStartTime:', userData.blockStartTime);
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            console.log('⏰ FORM LIMITER: Tiempo desde bloqueo:', Math.round(timeSinceBlock / 1000), 'segundos');
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                console.log('🔄 FORM LIMITER: Bloqueo completado para IP:', ip, 'Endpoint:', endpoint,
                           'Tiempo bloqueado:', Math.round(timeSinceBlock / 1000), 'segundos');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                console.log('✅ FORM LIMITER: Contador reiniciado para IP:', ip, 'Endpoint:', endpoint,
                           'Contador: 0/', maxRequests);
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                console.log('⏳ FORM LIMITER: IP aún bloqueada:', ip, 'Endpoint:', endpoint,
                           'Tiempo restante:', Math.round(timeRemaining / 1000), 'segundos');
                
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
            console.log('📊 FORM LIMITER: IP:', ip, 'Endpoint:', endpoint,
                       'Petición:', userData.count, '/', maxRequests,
                       'Restantes:', maxRequests - userData.count);
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                console.log('🚫 FORM LIMITER: Límite alcanzado para IP:', ip, 'Endpoint:', endpoint,
                           'Peticiones:', userData.count, '/', maxRequests,
                           'Bloqueado por:', LIMITE_MINUTOS, 'minutos');
                
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
            console.log('⚠️ FORM LIMITER: Estado inconsistente');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en formLimiter:', error);
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
        
        // console.log('🔑 CREAR MENSAJE LIMITER: Clave única:', key, 'Límite:', maxRequests, 'bloqueo:', LIMITE_MINUTOS, 'minutos');
        
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
            console.log('🆕 CREAR MENSAJE LIMITER: Nuevo usuario IP:', ip, 'Endpoint:', endpoint);
            
            global.rateLimitStore.set(key, userData);
        }
        
        // console.log('📋 CREAR MENSAJE LIMITER: Estado actual - Count:', userData.count, 'Blocked:', userData.blocked, 'BlockStartTime:', userData.blockStartTime);
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            console.log('⏰ CREAR MENSAJE LIMITER: Tiempo desde bloqueo:', Math.round(timeSinceBlock / 1000), 'segundos');
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                console.log('🔄 CREAR MENSAJE LIMITER: Bloqueo completado para IP:', ip, 'Endpoint:', endpoint,
                           'Tiempo bloqueado:', Math.round(timeSinceBlock / 1000), 'segundos');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                console.log('✅ CREAR MENSAJE LIMITER: Contador reiniciado para IP:', ip, 'Endpoint:', endpoint,
                           'Contador: 0/', maxRequests);
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                console.log('⏳ CREAR MENSAJE LIMITER: IP aún bloqueada:', ip, 'Endpoint:', endpoint,
                           'Tiempo restante:', Math.round(timeRemaining / 1000), 'segundos');
                
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
            console.log('📊 CREAR MENSAJE LIMITER: IP:', ip, 'Endpoint:', endpoint,
                       'Petición:', userData.count, '/', maxRequests,
                       'Restantes:', maxRequests - userData.count);
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                console.log('🚫 CREAR MENSAJE LIMITER: Límite alcanzado para IP:', ip, 'Endpoint:', endpoint,
                           'Peticiones:', userData.count, '/', maxRequests,
                           'Bloqueado por:', LIMITE_MINUTOS, 'minutos');
                
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
            console.log('⚠️ CREAR MENSAJE LIMITER: Estado inconsistente');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en crearMensajeLimiter:', error);
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
        
        // console.log('🔑 CREAR MENSAJE SOUL CHAT LIMITER: Clave única:', key, 'Límite:', maxRequests, 'bloqueo:', LIMITE_MINUTOS, 'minutos');
        
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
            console.log('🆕 CREAR MENSAJE SOUL CHAT LIMITER: Nuevo usuario IP:', ip, 'Endpoint:', endpoint);
            
            global.rateLimitStore.set(key, userData);
        }
        
        // console.log('📋 CREAR MENSAJE SOUL CHAT LIMITER: Estado actual - Count:', userData.count, 'Blocked:', userData.blocked, 'BlockStartTime:', userData.blockStartTime);
        
        // VERIFICAR SI ESTÁ BLOQUEADO
        if (userData.blocked && userData.blockStartTime) {
            const timeSinceBlock = now - userData.blockStartTime;
            console.log('⏰ CREAR MENSAJE SOUL CHAT LIMITER: Tiempo desde bloqueo:', Math.round(timeSinceBlock / 1000), 'segundos');
            
            if (timeSinceBlock >= blockTimeMs) {
                // ¡BLOQUEO COMPLETADO! REINICIAR CONTADOR
                console.log('🔄 CREAR MENSAJE SOUL CHAT LIMITER: Bloqueo completado para IP:', ip, 'Endpoint:', endpoint,
                           'Tiempo bloqueado:', Math.round(timeSinceBlock / 1000), 'segundos');
                
                userData.count = 0;
                userData.blocked = false;
                userData.blockStartTime = null;
                
                console.log('✅ CREAR MENSAJE SOUL CHAT LIMITER: Contador reiniciado para IP:', ip, 'Endpoint:', endpoint,
                           'Contador: 0/', maxRequests);
                
                global.rateLimitStore.set(key, userData);
                
            } else {
                // AÚN ESTÁ BLOQUEADO - CALCULAR TIEMPO RESTANTE
                const timeRemaining = blockTimeMs - timeSinceBlock;
                console.log('⏳ CREAR MENSAJE SOUL CHAT LIMITER: IP aún bloqueada:', ip, 'Endpoint:', endpoint,
                           'Tiempo restante:', Math.round(timeRemaining / 1000), 'segundos');
                
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
            console.log('📊 CREAR MENSAJE SOUL CHAT LIMITER: IP:', ip, 'Endpoint:', endpoint,
                       'Petición:', userData.count, '/', maxRequests,
                       'Restantes:', maxRequests - userData.count);
            
            // SI SE ALCANZÓ EL LÍMITE, BLOQUEAR
            if (userData.count >= maxRequests) {
                userData.blocked = true;
                userData.blockStartTime = now;
                
                console.log('🚫 CREAR MENSAJE SOUL CHAT LIMITER: Límite alcanzado para IP:', ip, 'Endpoint:', endpoint,
                           'Peticiones:', userData.count, '/', maxRequests,
                           'Bloqueado por:', LIMITE_MINUTOS, 'minutos');
                
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
            console.log('⚠️ CREAR MENSAJE SOUL CHAT LIMITER: Estado inconsistente');
            return res.status(429).json({
                status: 429,
                message: 'Demasiados mensajes enviados. Intenta nuevamente más tarde.',
                retryAfter: LIMITE_MINUTOS
            });
        }
        
        next();
    } catch (error) {
        console.error('❌ Error en crearMensajeSoulChatLimiter:', error);
        next();
    }
};

module.exports = {
    crearChatLimiter,
    formLimiter,
    crearMensajeLimiter,
    crearMensajeSoulChatLimiter,
};