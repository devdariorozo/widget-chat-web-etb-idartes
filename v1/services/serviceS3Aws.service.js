// ! ================================================================================================================================================
// !                                                    SERVICIO DE SUBIDA DE LOGS A S3 AWS
// ! ================================================================================================================================================
// @autor Ramón Dario Rozo Torres
// @últimaModificación Ramón Dario Rozo Torres
// @versión 1.0.0
// v1/services/serviceS3Aws.service.js

// ! REQUIRES
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const logger = require('../logger');

// ! CONFIGURACIÓN DE AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'bucket-logs-wigetthomas';

// ! OBTENER RUTA DEL DIRECTORIO DE LOGS
const obtenerDirectorioLogs = () => {
    return path.join(__dirname, '../uploads/logs');
};

// ! LISTAR ARCHIVOS DE LOG
const listarArchivosLog = () => {
    const logsDir = obtenerDirectorioLogs();
    
    if (!fs.existsSync(logsDir)) {
        logger.warn({ 
            contexto: 'service',
            recurso: 'serviceS3Aws.listarArchivosLog',
            directorio: logsDir
        }, 'Directorio de logs no existe');
        return [];
    }
    
    try {
        const files = fs.readdirSync(logsDir);
        // Filtrar solo archivos .log
        return files
            .filter(file => file.endsWith('.log'))
            .map(file => ({
                name: file,
                path: path.join(logsDir, file),
                size: fs.statSync(path.join(logsDir, file)).size
            }))
            .filter(file => file.size > 0); // Solo archivos con contenido
    } catch (error) {
        logger.error({ 
            contexto: 'service',
            recurso: 'serviceS3Aws.listarArchivosLog',
            codigoRespuesta: 500,
            errorMensaje: error.message,
            errorStack: error.stack
        }, 'Error listando archivos de log');
        return [];
    }
};

// ! SUBIR ARCHIVO DE LOG A S3
const subirArchivoLogS3 = async (filePath, fileName) => {
    try {
        // Leer el contenido del archivo
        const fileContent = fs.readFileSync(filePath);
        
        // Crear la ruta en S3 con estructura: logs/{año}/{mes}/{nombre-archivo}
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const s3Key = `logs/${year}/${month}/${fileName}`;
        
        // Preparar el comando de subida
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileContent,
            ContentType: 'application/json',
            ServerSideEncryption: 'AES256',
            Metadata: {
                'servicio': process.env.PROJECT_TIPO || 'widget',
                'ambiente': process.env.PROJECT_ENV || 'PRO',
                'fecha-subida': date.toISOString()
            }
        });
        
        // Subir a S3
        const response = await s3Client.send(command);
        
        logger.info({
            contexto: 'service',
            recurso: 'serviceS3Aws.subirArchivoLogS3',
            archivo: fileName,
            s3Key: s3Key,
            tamaño: fileContent.length,
            etag: response.ETag
        }, `Archivo de log subido exitosamente a S3: ${s3Key}`);
        
        return {
            success: true,
            s3Key: s3Key,
            fileName: fileName,
            etag: response.ETag
        };
    } catch (error) {
        logger.error({
            contexto: 'service',
            recurso: 'serviceS3Aws.subirArchivoLogS3',
            codigoRespuesta: error.$metadata?.httpStatusCode || 500,
            errorMensaje: error.message || error.name || 'Error desconocido',
            errorStack: error.stack,
            archivo: fileName,
            bucket: BUCKET_NAME
        }, `Error subiendo archivo de log a S3: ${fileName}`);
        throw error;
    }
};

// ! SUBIR TODOS LOS LOGS A S3
const subirTodosLosLogsS3 = async (eliminarDespuesSubir = false) => {
    const archivosLog = listarArchivosLog();
    
    if (archivosLog.length === 0) {
        logger.info({ 
            contexto: 'service',
            recurso: 'serviceS3Aws.subirTodosLosLogsS3'
        }, 'No hay archivos de log para subir');
        return { subidos: 0, fallidos: 0, errores: [] };
    }
    
    logger.info({ 
        contexto: 'service',
        recurso: 'serviceS3Aws.subirTodosLosLogsS3',
        cantidad: archivosLog.length
    }, `Iniciando subida de ${archivosLog.length} archivo(s) de log a S3`);
    
    const resultados = {
        subidos: 0,
        fallidos: 0,
        errores: []
    };
    
    // Subir cada archivo
    for (const archivo of archivosLog) {
        try {
            const resultado = await subirArchivoLogS3(archivo.path, archivo.name);
            
            if (resultado.success) {
                resultados.subidos++;
                
                // Eliminar archivo local si se subió exitosamente y está configurado
                if (eliminarDespuesSubir) {
                    try {
                        fs.unlinkSync(archivo.path);
                        logger.info({
                            contexto: 'service',
                            recurso: 'serviceS3Aws.subirTodosLosLogsS3',
                            archivo: archivo.name
                        }, `Archivo local eliminado después de subida exitosa: ${archivo.name}`);
                    } catch (error) {
                        logger.warn({
                            contexto: 'service',
                            recurso: 'serviceS3Aws.subirTodosLosLogsS3',
                            archivo: archivo.name,
                            errorMensaje: error.message
                        }, `Error eliminando archivo local: ${archivo.name}`);
                    }
                }
            }
        } catch (error) {
            resultados.fallidos++;
            resultados.errores.push({
                archivo: archivo.name,
                error: error.message
            });
        }
    }
    
    logger.info({
        contexto: 'service',
        recurso: 'serviceS3Aws.subirTodosLosLogsS3',
        subidos: resultados.subidos,
        fallidos: resultados.fallidos
    }, `Proceso de subida completado: ${resultados.subidos} exitosos, ${resultados.fallidos} fallidos`);
    
    return resultados;
};

// ! EXPORTACIONES
module.exports = {
    subirTodosLosLogsS3,
    subirArchivoLogS3,
    listarArchivosLog,
    obtenerDirectorioLogs
};
