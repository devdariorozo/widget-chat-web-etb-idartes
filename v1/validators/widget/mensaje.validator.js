// ! ================================================================================================================================================
// !                                                             VALIDADOR DE MENSAJE
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/validators/widget/mensaje.validator.js

// ! REQUIRES
const { body } = require('express-validator');
const { query } = require('express-validator');

// ! VALIDADORES
// * CREAR
const crear = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
        
    // todo: Validar campo 'mensaje'
    body('mensaje')
        .trim()
        .notEmpty().withMessage('El campo "mensaje" no puede estar vacío...'),
];

// * CREAR MENSJAJE DESDE SOUL CHAT
const crearSoulChat = [
    // todo: Vallidar campo 'idChat'
    body('idChat')
        .trim()
        .notEmpty().withMessage('El campo "idChat" no puede estar vacío...')
        .isInt().withMessage('El campo "idChat" debe ser un número entero...'),

    // todo: Validar campo 'remitente'
    body('remitente')
        .trim()
        .notEmpty().withMessage('El campo "remitente" no puede estar vacío...'),

    // todo: Validar campo 'estado'
    body('estado')
        .trim()
        .notEmpty().withMessage('El campo "estado" no puede estar vacío...')
        .isIn(['Enviado']).withMessage('El campo "estado" debe ser "Enviado"'),

    // todo: Validar campo 'tipo'
    body('tipo')
        .trim()
        .notEmpty().withMessage('El campo "tipo" no puede estar vacío...'),

    // todo: Validar campo 'contenido'
    body('contenido')
        .trim()
        .notEmpty().withMessage('El campo "contenido" no puede estar vacío...'),

    // todo: Validar campo 'enlaces'
    body('enlaces')
        .trim()
        .custom(value => {
            if (value === '-') {
                return true;
            }
            return value.length > 0;
        }).withMessage('El campo "enlaces" debe ser un guión (-) o contener un valor válido...'),    
];

// * CREAR MENSJAJE DESDE SOUL CHAT - PASO WIDGET ARBOL ENCUESTA
const encuestaSoulChat = [
    // todo: Vallidar campo 'idChat'
    body('idChat')
        .trim()
        .notEmpty().withMessage('El campo "idChat" no puede estar vacío...')
        .isInt().withMessage('El campo "idChat" debe ser un número entero...'),

    // todo: Validar campo 'remitente'
    body('remitente')
        .trim()
        .notEmpty().withMessage('El campo "remitente" no puede estar vacío...'),

    // todo: Validar campo 'estado'
    body('estado')
        .trim()
        .notEmpty().withMessage('El campo "estado" no puede estar vacío...')
        .isIn(['Enviado']).withMessage('El campo "estado" debe ser "Enviado"'),

    // todo: Validar campo 'tipo'
    body('tipo')
        .trim()
        .notEmpty().withMessage('El campo "tipo" no puede estar vacío...'),

    // todo: Validar campo 'contenido'
    body('contenido')
        .trim()
        .notEmpty().withMessage('El campo "contenido" no puede estar vacío...'),

    // todo: Validar campo 'enlaces'
    body('enlaces')
        .trim()
        .custom(value => {
            if (value === '-') {
                return true;
            }
            return value.length > 0;
        }).withMessage('El campo "enlaces" debe ser un guión (-) o contener un valor válido...'),    
];

// * LISTAR NO LEÍDOS
const listarNoLeido = [
    // todo: Validar campo 'idChatWeb'
    query('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// * LEER
const leer = [
    // todo: Validar campo 'idMensaje'
    body('idMensaje')
        .trim()
        .notEmpty().withMessage('El campo "idMensaje" no puede estar vacío...'),
];

// * ADJUNTAR ARCHIVOS
const adjuntarArchivos = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),

    // todo: Validar campo 'mensaje'
    body('mensaje')
        .trim()
        .notEmpty().withMessage('El campo "mensaje" no puede estar vacío...'),
];

// * LISTAR CONVERSACIÓN COMPLETA
const listarConversacion = [
    // todo: Validar campo 'idChatWeb'
    query('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// * VIGILAR INACTIVIDAD DEL CHAT
const vigilaInactividadChat = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
    
    // todo: Validar campo 'tiempoInactividad'
    body('tiempoInactividad')
        .isInt({ min: 0 })
        .withMessage('El campo "tiempoInactividad" debe ser un número entero positivo...'),
    
    // todo: Validar campo 'resetearInactividad'
    body('resetearInactividad')
        .optional()
        .isBoolean()
        .withMessage('El campo "resetearInactividad" debe ser un valor booleano...'),

    // todo: Validar campo 'dispararAlerta'
    body('dispararAlerta')
        .optional()
        .isBoolean()
        .withMessage('El campo "dispararAlerta" debe ser un valor booleano...'),
];

// * LIMPIAR MENSAJES DE INACTIVIDAD
const limpiarMensajesInactividad = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// ! EXPORTACIONES
module.exports = { 
    crear,
    crearSoulChat,
    encuestaSoulChat,
    listarNoLeido,
    leer,
    adjuntarArchivos,
    listarConversacion,
    vigilaInactividadChat,
    limpiarMensajesInactividad,
};