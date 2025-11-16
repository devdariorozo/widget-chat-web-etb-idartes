// ! ================================================================================================================================================
// !                                              SCHEDULER PARA CERRAR CHATS ABIERTOS ANTIGUOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (24 de Enero de 2025)
// @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
// @version 1.0.0
// v1/schedulers/cerrarChatsAntiguos.scheduler.js

// ! REQUIRES
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chatController = require('../controllers/widget/chat.controller.js');
const logger = require('../logger');

// * CONFIGURACIÓN DEL SCHEDULER
// Ejecutar cada hora (0 minutos de cada hora)
// Formato cron: minuto hora día mes día-semana
// '0 * * * *' = cada hora en el minuto 0
const CRON_SCHEDULE = process.env.CRON_CERRAR_CHATS_ANTIGUOS || '0 * * * *';

// * FUNCIÓN PARA INICIAR EL SCHEDULER
const iniciarScheduler = () => {
    logger.info({
        contexto: 'scheduler',
        recurso: 'cerrarChatsAntiguos.iniciarScheduler',
        configuracion: {
            cronSchedule: CRON_SCHEDULE,
            proximaEjecucion: getNextExecutionTime(),
            tiempoLimiteHoras: process.env.TIEMPO_LIMITE_CHAT_ABIERTOS || '24',
            timezone: process.env.TZ || 'America/Bogota'
        }
    }, 'SCHEDULER: Cerrar Chats Abiertos Antiguos - Iniciando');

    // * Validar que el cron schedule sea válido
    if (!cron.validate(CRON_SCHEDULE)) {
        logger.error({
            contexto: 'scheduler',
            recurso: 'cerrarChatsAntiguos.iniciarScheduler',
            codigoRespuesta: 500,
            errorMensaje: `El formato del CRON schedule es inválido: ${CRON_SCHEDULE}`,
            cronSchedule: CRON_SCHEDULE
        }, 'Error: formato CRON inválido');
        return;
    }

    // * Configurar el scheduler
    const task = cron.schedule(CRON_SCHEDULE, async () => {
        logger.info({
            contexto: 'scheduler',
            recurso: 'cerrarChatsAntiguos.ejecutarTarea',
            accion: 'iniciando_tarea'
        }, 'Iniciando tarea programada: Cerrar chats antiguos');

        try {
            // Ejecutar la función del controlador
            const resultado = await chatController.cerrarChatsAbiertosAntiguos();

            // Mostrar resultado
            if (resultado.success) {
                logger.info({
                    contexto: 'scheduler',
                    recurso: 'cerrarChatsAntiguos.ejecutarTarea',
                    codigoRespuesta: 200,
                    rta: 'Tarea completada exitosamente',
                    chatsCerrados: resultado.chatsCerrados,
                    totalChatsEncontrados: resultado.totalChatsEncontrados,
                    tiempoLimiteHoras: resultado.tiempoLimiteHoras,
                    proximaEjecucion: getNextExecutionTime()
                }, 'Tarea completada exitosamente');
            } else {
                logger.warn({
                    contexto: 'scheduler',
                    recurso: 'cerrarChatsAntiguos.ejecutarTarea',
                    codigoRespuesta: 500,
                    rta: resultado.message,
                    error: resultado.error
                }, 'Tarea completada con errores');
            }
        } catch (error) {
            logger.error({
                contexto: 'scheduler',
                recurso: 'cerrarChatsAntiguos.ejecutarTarea',
                codigoRespuesta: 500,
                errorMensaje: error.message,
                errorStack: error.stack
            }, 'Error ejecutando tarea programada');
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'America/Bogota'
    });

    // * Iniciar el scheduler
    task.start();

    // * EJECUTAR INMEDIATAMENTE AL INICIAR (opcional pero recomendado)
    
    // Ejecutar inmediatamente al iniciar el servidor
    setTimeout(async () => {
        try {
            logger.info({
                contexto: 'scheduler',
                recurso: 'cerrarChatsAntiguos.ejecucionInicial',
                accion: 'iniciando_ejecucion_inicial'
            }, 'Ejecutando verificación inicial de chats antiguos');
            
            const resultado = await chatController.cerrarChatsAbiertosAntiguos();
            
            if (resultado.success) {
                logger.info({
                    contexto: 'scheduler',
                    recurso: 'cerrarChatsAntiguos.ejecucionInicial',
                    codigoRespuesta: 200,
                    rta: 'Ejecución inicial completada',
                    chatsCerrados: resultado.chatsCerrados,
                    totalChatsEncontrados: resultado.totalChatsEncontrados,
                    tiempoLimiteHoras: resultado.tiempoLimiteHoras
                }, 'Ejecución inicial completada');
            } else {
                logger.warn({
                    contexto: 'scheduler',
                    recurso: 'cerrarChatsAntiguos.ejecucionInicial',
                    codigoRespuesta: 500,
                    rta: resultado.message,
                    error: resultado.error
                }, 'Ejecución inicial con errores');
            }
        } catch (error) {
            logger.error({
                contexto: 'scheduler',
                recurso: 'cerrarChatsAntiguos.ejecucionInicial',
                codigoRespuesta: 500,
                errorMensaje: error.message,
                errorStack: error.stack
            }, 'Error en ejecución inicial');
        }
    }, 5000); // Ejecutar después de 5 segundos de iniciar el servidor

    return task;
};

// * FUNCIÓN AUXILIAR PARA OBTENER LA PRÓXIMA EJECUCIÓN
const getNextExecutionTime = () => {
    try {
        const cronFields = CRON_SCHEDULE.split(' ');
        const minute = cronFields[0];
        const hour = cronFields[1];
        
        const now = new Date();
        let next = new Date(now);
        
        if (hour === '*') {
            // Se ejecuta cada hora
            next.setHours(now.getHours() + 1);
            next.setMinutes(parseInt(minute) || 0);
            next.setSeconds(0);
        } else {
            next.setHours(parseInt(hour));
            next.setMinutes(parseInt(minute) || 0);
            next.setSeconds(0);
            
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
        }
        
        return next.toLocaleString('es-CO', {
            timeZone: process.env.TZ || 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (error) {
        return 'No se pudo calcular';
    }
};

// ! EXPORTACIONES
module.exports = {
    iniciarScheduler
};

