// ! ================================================================================================================================================
// !                                              SCHEDULER PARA LIMPIEZA DE ADJUNTOS POR TIEMPO DE VIDA
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/schedulers/limpiezaAdjuntos.scheduler.js

// ! REQUIRES
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const logger = require('../logger');

// * CONFIGURACIÓN DEL SCHEDULER
const CRON_SCHEDULE = process.env.CRON_LIMPIEZA_ADJUNTOS || '0 3 * * *';
const TIEMPO_VIDA_DIAS = parseInt(process.env.TIEMPO_VIDA_ADJUNTOS) || 30;
const UPLOADS_DIR = path.join(__dirname, '../uploads/files');

// * FUNCIÓN PRINCIPAL DE LIMPIEZA
const ejecutarLimpieza = async () => {
    const ahora = Date.now();
    const limiteMs = TIEMPO_VIDA_DIAS * 24 * 60 * 60 * 1000;
    let carpetasRevisadas = 0;
    let archivosEliminados = 0;
    let carpetasEliminadas = 0;
    let errores = [];

    if (!fs.existsSync(UPLOADS_DIR)) {
        logger.warn({
            contexto: 'scheduler',
            recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
            directorio: UPLOADS_DIR
        }, 'Directorio uploads/files no existe, omitiendo limpieza');
        return { carpetasRevisadas, archivosEliminados, carpetasEliminadas, errores };
    }

    let chatDirs;
    try {
        chatDirs = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
    } catch (err) {
        logger.error({
            contexto: 'scheduler',
            recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
            errorMensaje: err.message
        }, 'Error leyendo directorio uploads/files');
        return { carpetasRevisadas: 0, archivosEliminados: 0, carpetasEliminadas: 0, errores: [err.message] };
    }

    for (const chatDir of chatDirs) {
        const chatPath = path.join(UPLOADS_DIR, chatDir);
        carpetasRevisadas++;

        try {
            // Revisar subcarpetas received/ y send/
            const subcarpetas = ['received', 'send'];
            let totalArchivosEnChat = 0;
            let archivosEliminadosEnChat = 0;

            for (const sub of subcarpetas) {
                const subPath = path.join(chatPath, sub);
                if (!fs.existsSync(subPath)) continue;

                const archivos = fs.readdirSync(subPath, { withFileTypes: true })
                    .filter(f => f.isFile() && f.name !== '.gitkeep');

                for (const archivo of archivos) {
                    totalArchivosEnChat++;
                    const archivoPath = path.join(subPath, archivo.name);
                    try {
                        const stat = fs.statSync(archivoPath);
                        // Se usa birthtimeMs (fecha de creación); en sistemas Linux donde
                        // birthtime no está disponible el kernel retorna 0, por lo que se
                        // usa mtimeMs como respaldo.
                        const creadoMs = stat.birthtimeMs > 0 ? stat.birthtimeMs : stat.mtimeMs;
                        const edadMs = ahora - creadoMs;
                        if (edadMs >= limiteMs) {
                            fs.unlinkSync(archivoPath);
                            archivosEliminados++;
                            archivosEliminadosEnChat++;
                            logger.info({
                                contexto: 'scheduler',
                                recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
                                archivo: archivoPath,
                                edadDias: Math.floor(edadMs / (1000 * 60 * 60 * 24)),
                                limiteConfiguradoDias: TIEMPO_VIDA_DIAS
                            }, `Archivo eliminado: edad >= ${TIEMPO_VIDA_DIAS} días`);
                        }
                    } catch (errArchivo) {
                        errores.push(`${archivoPath}: ${errArchivo.message}`);
                        logger.warn({
                            contexto: 'scheduler',
                            recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
                            archivo: archivoPath,
                            errorMensaje: errArchivo.message
                        }, 'Error procesando archivo en limpieza');
                    }
                }
            }

            // Si todos los archivos del chat fueron eliminados, borrar la carpeta raíz del chat
            if (totalArchivosEnChat > 0 && archivosEliminadosEnChat === totalArchivosEnChat) {
                try {
                    fs.rmSync(chatPath, { recursive: true, force: true });
                    carpetasEliminadas++;
                    logger.info({
                        contexto: 'scheduler',
                        recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
                        carpeta: chatPath
                    }, 'Carpeta de chat eliminada completamente (sin archivos vigentes)');
                } catch (errDir) {
                    errores.push(`${chatPath}: ${errDir.message}`);
                    logger.warn({
                        contexto: 'scheduler',
                        recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
                        carpeta: chatPath,
                        errorMensaje: errDir.message
                    }, 'Error eliminando carpeta de chat vacía');
                }
            }
        } catch (errChat) {
            errores.push(`${chatPath}: ${errChat.message}`);
            logger.warn({
                contexto: 'scheduler',
                recurso: 'limpiezaAdjuntos.ejecutarLimpieza',
                carpeta: chatPath,
                errorMensaje: errChat.message
            }, 'Error procesando carpeta de chat en limpieza');
        }
    }

    return { carpetasRevisadas, archivosEliminados, carpetasEliminadas, errores };
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
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch (error) {
        return 'No se pudo calcular';
    }
};

// * FUNCIÓN PARA INICIAR EL SCHEDULER
const iniciarScheduler = () => {
    logger.info({
        contexto: 'scheduler',
        recurso: 'limpiezaAdjuntos.iniciarScheduler',
        configuracion: {
            cronSchedule: CRON_SCHEDULE,
            tiempoVidaDias: TIEMPO_VIDA_DIAS,
            directorioUploads: UPLOADS_DIR,
            proximaEjecucion: getNextExecutionTime(),
            timezone: process.env.TZ || 'America/Bogota'
        }
    }, 'SCHEDULER: Limpieza de Adjuntos - Iniciando');

    if (!cron.validate(CRON_SCHEDULE)) {
        logger.error({
            contexto: 'scheduler',
            recurso: 'limpiezaAdjuntos.iniciarScheduler',
            codigoRespuesta: 500,
            errorMensaje: `El formato del CRON schedule es inválido: ${CRON_SCHEDULE}`,
            cronSchedule: CRON_SCHEDULE
        }, 'Error: formato CRON inválido');
        return;
    }

    const task = cron.schedule(CRON_SCHEDULE, async () => {
        logger.info({
            contexto: 'scheduler',
            recurso: 'limpiezaAdjuntos.ejecutarTarea',
            accion: 'iniciando_tarea',
            tiempoVidaDias: TIEMPO_VIDA_DIAS
        }, 'Iniciando tarea programada: Limpieza de adjuntos');

        try {
            const resultado = await ejecutarLimpieza();
            logger.info({
                contexto: 'scheduler',
                recurso: 'limpiezaAdjuntos.ejecutarTarea',
                codigoRespuesta: 200,
                rta: 'Limpieza completada',
                carpetasRevisadas: resultado.carpetasRevisadas,
                archivosEliminados: resultado.archivosEliminados,
                carpetasEliminadas: resultado.carpetasEliminadas,
                totalErrores: resultado.errores.length,
                proximaEjecucion: getNextExecutionTime()
            }, 'Tarea de limpieza de adjuntos completada');
        } catch (error) {
            logger.error({
                contexto: 'scheduler',
                recurso: 'limpiezaAdjuntos.ejecutarTarea',
                codigoRespuesta: 500,
                errorMensaje: error.message,
                errorStack: error.stack
            }, 'Error ejecutando tarea de limpieza de adjuntos');
        }
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'America/Bogota'
    });

    task.start();

    return task;
};

// ! EXPORTACIONES
module.exports = {
    iniciarScheduler,
    ejecutarLimpieza
};
