// ! ================================================================================================================================================
// !                                                      LOGGER
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/logger/index.js

const pino = require('pino');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.PROJECT_ENV === 'PRO';
const uploadLogsToS3 = (process.env.UPLOAD_LOGS_TO_S3 || '').toLowerCase() === 'true';

const baseOptions = {
    level: process.env.LOG_LEVEL || 'info',
    base: {
        servicio: `${process.env.PROJECT_TIPO || 'desconocido'}-${process.env.PROJECT_CLIENT || 'desconocido'}`,
        ambiente: process.env.PROJECT_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime
};

// Configuración de transport según el ambiente
let transport;
let loggerInstance;

if (isProduction && uploadLogsToS3) {
    // En producción con subida a S3 habilitada: escribir logs a archivo en v1/uploads/logs/
    const logsDir = path.join(__dirname, '../uploads/logs');
    
    try {
        // Asegurar que el directorio de logs existe con permisos adecuados
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { 
                recursive: true,
                mode: 0o775 // rwxrwxr-x: propietario y grupo pueden leer/escribir/ejecutar, otros solo lectura/ejecución
            });
        } else {
            // Asegurar permisos en el directorio existente
            try {
                fs.chmodSync(logsDir, 0o775);
            } catch (chmodError) {
                // Si no se pueden cambiar permisos, registrar advertencia pero continuar
                console.warn(`Advertencia: No se pudieron establecer permisos en ${logsDir}:`, chmodError.message);
            }
        }
        
        // Función para obtener el nombre del archivo de log basado en la fecha actual
        const obtenerNombreArchivoLog = () => {
            const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const servicioNombre = `${process.env.PROJECT_TIPO || 'widget'}-${process.env.PROJECT_CLIENT || 'thomasgregysons'}`.toLowerCase().replace(/\s+/g, '-');
            return `${servicioNombre}-${process.env.PROJECT_ENV || 'PRO'}-${fecha}.log`;
        };
        
        // Obtener el archivo inicial
        const logFileName = obtenerNombreArchivoLog();
        let logFilePath = path.join(logsDir, logFileName);
        let currentDate = new Date().toISOString().split('T')[0];
        
        // Función para crear o obtener el stream del archivo actual
        let logStream = null;
        const obtenerStreamLog = () => {
            const fechaActual = new Date().toISOString().split('T')[0];
            
            // Si cambió el día, crear nuevo stream
            if (fechaActual !== currentDate || !logStream) {
                // Cerrar stream anterior si existe
                if (logStream) {
                    try {
                        logStream.end();
                    } catch (error) {
                        // Ignorar errores al cerrar stream anterior
                    }
                }
                
                // Actualizar fecha y ruta
                currentDate = fechaActual;
                logFilePath = path.join(logsDir, obtenerNombreArchivoLog());
                
                // Verificar si el archivo existe para establecer permisos
                const fileExists = fs.existsSync(logFilePath);
                
                // Crear nuevo stream de escritura en modo append con permisos adecuados
                logStream = fs.createWriteStream(logFilePath, { 
                    flags: 'a',
                    mode: 0o664 // rw-rw-r--: propietario y grupo pueden leer/escribir, otros solo lectura
                });
                
                // Si el archivo ya existía, asegurar permisos correctos
                if (fileExists) {
                    try {
                        fs.chmodSync(logFilePath, 0o664);
                    } catch (chmodError) {
                        console.warn(`Advertencia: No se pudieron establecer permisos en ${logFilePath}:`, chmodError.message);
                    }
                }
            }
            
            return logStream;
        };
        
        // Crear un stream wrapper que verifique la fecha antes de escribir
        const rotatingStream = {
            write: (chunk) => {
                try {
                    const stream = obtenerStreamLog();
                    return stream.write(chunk);
                } catch (error) {
                    // Si hay error, intentar escribir a stdout como fallback
                    process.stdout.write(chunk);
                    return false;
                }
            },
            end: () => {
                if (logStream) {
                    logStream.end();
                }
            },
            destroy: () => {
                if (logStream) {
                    logStream.destroy();
                }
            },
            on: () => {},
            once: () => {},
            emit: () => {},
            removeListener: () => {}
        };
        
        // Usar multistream para escribir a múltiples destinos
        const streams = [
            { stream: process.stdout, level: 'info' }, // stdout para Grafana
            { stream: rotatingStream, level: 'info' } // archivo con rotación diaria automática
        ];
        
        loggerInstance = pino(baseOptions, pino.multistream(streams));
    } catch (error) {
        // Si hay error creando directorio o archivo, usar solo stdout
        console.error('Error configurando logger de archivo:', error.message);
        console.error('Usando solo logger stdout (Grafana)');
        loggerInstance = pino(baseOptions);
    }
} else if (isProduction) {
    // En producción sin subida a S3: enviar logs solo a stdout
    loggerInstance = pino(baseOptions);
} else {
    // En desarrollo/QA: formato legible con pino-pretty
    transport = pino.transport({
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            singleLine: true
        }
    });
    
    loggerInstance = pino(baseOptions, transport);
}

module.exports = loggerInstance;