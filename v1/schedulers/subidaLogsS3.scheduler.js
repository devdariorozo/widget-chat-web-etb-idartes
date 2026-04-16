// ! ================================================================================================================================================
// !                                              SCHEDULER PARA SUBIDA DE LOGS A S3 AWS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/schedulers/subidaLogsS3.scheduler.js

// ! REQUIRES
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const serviceS3Aws = require('../services/serviceS3Aws.service.js');
const logger = require('../logger');

// * CONFIGURACIÓN DEL SCHEDULER
// Ejecutar cada hora (0 minutos de cada hora) por defecto
// Formato cron: minuto hora día mes día-semana
// '0 * * * *' = cada hora en el minuto 0
const CRON_SCHEDULE = process.env.S3_UPLOAD_CRON_SCHEDULE || '0 * * * *';
const DELETE_AFTER_UPLOAD = process.env.S3_DELETE_AFTER_UPLOAD === 'true' || false;

// * FUNCIÓN PARA OBTENER LA PRÓXIMA EJECUCIÓN
const getNextExecutionTime = () => {
    const ahora = new Date();
    const proxima = new Date(ahora);
    proxima.setHours(proxima.getHours() + 1, 0, 0, 0);
    return proxima.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
};

// * FUNCIÓN PARA INICIAR EL SCHEDULER
const iniciarScheduler = () => {
    // Solo iniciar en producción
    if (process.env.PROJECT_ENV !== 'PRO') {
        logger.info({ 
            contexto: 'scheduler',
            recurso: 'subidaLogsS3.iniciarScheduler'
        }, 'Scheduler de subida de logs a S3 deshabilitado (no es ambiente PRO)');
        return;
    }

    logger.info({
        contexto: 'scheduler',
        recurso: 'subidaLogsS3.iniciarScheduler',
        configuracion: {
            cronSchedule: CRON_SCHEDULE,
            proximaEjecucion: getNextExecutionTime(),
            deleteAfterUpload: DELETE_AFTER_UPLOAD,
            timezone: process.env.TZ || 'America/Bogota'
        }
    }, 'SCHEDULER: Subida de Logs a S3 - Iniciando');

    // * Validar que el cron schedule sea válido
    if (!cron.validate(CRON_SCHEDULE)) {
        logger.error({
            contexto: 'scheduler',
            recurso: 'subidaLogsS3.iniciarScheduler',
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
            recurso: 'subidaLogsS3.ejecutarTarea',
            accion: 'iniciando_tarea'
        }, 'Iniciando tarea programada: Subida de logs a S3');

        try {
            // Ejecutar la función del servicio
            const resultado = await serviceS3Aws.subirTodosLosLogsS3(DELETE_AFTER_UPLOAD);

            // Mostrar resultado
            if (resultado.subidos > 0 || resultado.fallidos === 0) {
                logger.info({
                    contexto: 'scheduler',
                    recurso: 'subidaLogsS3.ejecutarTarea',
                    codigoRespuesta: 200,
                    rta: 'Tarea completada exitosamente',
                    subidos: resultado.subidos,
                    fallidos: resultado.fallidos,
                    proximaEjecucion: getNextExecutionTime()
                }, 'Tarea completada exitosamente');
            } else {
                logger.warn({
                    contexto: 'scheduler',
                    recurso: 'subidaLogsS3.ejecutarTarea',
                    codigoRespuesta: 500,
                    rta: 'Tarea completada con errores',
                    subidos: resultado.subidos,
                    fallidos: resultado.fallidos,
                    errores: resultado.errores
                }, 'Tarea completada con errores');
            }
        } catch (error) {
            logger.error({
                contexto: 'scheduler',
                recurso: 'subidaLogsS3.ejecutarTarea',
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
};

// ! EXPORTACIONES
module.exports = {
    iniciarScheduler
};
