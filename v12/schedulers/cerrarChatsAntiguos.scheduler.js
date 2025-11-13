// ! ================================================================================================================================================
// !                                              SCHEDULER PARA CERRAR CHATS ABIERTOS ANTIGUOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/schedulers/cerrarChatsAntiguos.scheduler.js

// ! REQUIRES
const cron = require('node-cron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const chatController = require('../controllers/widget/chat.controller.js');

// * CONFIGURACIÓN DEL SCHEDULER
// Ejecutar cada hora (0 minutos de cada hora)
// Formato cron: minuto hora día mes día-semana
// '0 * * * *' = cada hora en el minuto 0
const CRON_SCHEDULE = process.env.CRON_CERRAR_CHATS_ANTIGUOS || '0 * * * *';

// * FUNCIÓN PARA INICIAR EL SCHEDULER
const iniciarScheduler = () => {
    console.log('📅 ===================================================');
    console.log('📅 SCHEDULER: Cerrar Chats Abiertos Antiguos');
    console.log('📅 ===================================================');
    console.log(`⏰ Programación: ${CRON_SCHEDULE}`);
    console.log(`🕐 Próxima ejecución: ${getNextExecutionTime()}`);
    console.log(`⚙️  Tiempo límite: ${process.env.TIEMPO_LIMITE_CHAT_ABIERTOS || '24'} horas`);
    console.log('📅 ===================================================\n');

    // * Validar que el cron schedule sea válido
    if (!cron.validate(CRON_SCHEDULE)) {
        console.error(`❌ El formato del CRON schedule es inválido: ${CRON_SCHEDULE}`);
        return;
    }

    // * Configurar el scheduler
    const task = cron.schedule(CRON_SCHEDULE, async () => {
        console.log('🚀 ===================================================');
        console.log(`🚀 Iniciando tarea programada: Cerrar chats antiguos`);
        console.log('🚀 ===================================================');

        try {
            // Ejecutar la función del controlador
            const resultado = await chatController.cerrarChatsAbiertosAntiguos();

            // Mostrar resultado
            if (resultado.success) {
                console.log('✅ ===================================================');
                console.log(`✅ Tarea completada exitosamente`);
                console.log(`✅ Chats cerrados: ${resultado.chatsCerrados}/${resultado.totalChatsEncontrados}`);
                console.log(`✅ Próxima ejecución: ${getNextExecutionTime()}`);
                console.log('✅ ===================================================\n');
            } else {
                console.log('⚠️  ===================================================');
                console.log(`⚠️  Tarea completada con errores`);
                console.log(`⚠️  Error: ${resultado.message}`);
                console.log('⚠️  ===================================================\n');
            }
        } catch (error) {
            console.log('❌ ===================================================');
            console.log(`❌ Error ejecutando tarea programada`);
            console.log(`❌ Error: ${error.message}`);
            console.log('❌ ===================================================\n');
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
            const resultado = await chatController.cerrarChatsAbiertosAntiguos();
            
            if (resultado.success) {
                console.log('✅ ===================================================');
                console.log(`✅ Ejecución inicial completada`);
                console.log(`✅ Chats cerrados: ${resultado.chatsCerrados}/${resultado.totalChatsEncontrados}`);
                console.log('✅ ===================================================\n');
            } else {
                console.log('⚠️  ===================================================');
                console.log(`⚠️  Ejecución inicial con errores`);
                console.log(`⚠️  Error: ${resultado.message}`);
                console.log('⚠️  ===================================================\n');
            }
        } catch (error) {
            console.log('❌ ===================================================');
            console.log(`❌ Error en ejecución inicial`);
            console.log(`❌ Error: ${error.message}`);
            console.log('❌ ===================================================\n');
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

