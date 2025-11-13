// ! ================================================================================================================================================
// !                                                             VALIDADOR DE CHAT WEB
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/validators/widget/chatWeb.validator.js

// ! REQUIRES
const { body, query } = require('express-validator');

// ! VALIDADORES
// * CREAR
const crear = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// * FORMULARIO INICIAL
const formularioInicial = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),

    body('camposFormulario.nombres')
        .trim()
        .notEmpty().withMessage('El campo "Nombres" no puede estar vacío...'),

    body('camposFormulario.apellidos')
        .trim()
        .notEmpty().withMessage('El campo "Apellidos" no puede estar vacío...'),

    body('camposFormulario.numeroCedula')
        .trim()
        .notEmpty().withMessage('El campo "Número de Cédula" no puede estar vacío...'),

    body('camposFormulario.paisResidencia')
        .trim()
        .notEmpty().withMessage('El campo "País de Residencia" no puede estar vacío...'),

    body('camposFormulario.ciudadResidencia')
        .trim()
        .notEmpty().withMessage('El campo "Ciudad de Residencia" no puede estar vacío...'),

    body('camposFormulario.indicativoPais')
        .trim()
        .notEmpty().withMessage('El campo "Indicativo País" no puede estar vacío...'),

    body('camposFormulario.numeroCelular')
        .trim()
        .notEmpty().withMessage('El campo "Número Celular" no puede estar vacío...'),

    body('camposFormulario.correoElectronico')
        .trim()
        .notEmpty().withMessage('El campo "Correo Electrónico" no puede estar vacío...'),

    body('camposFormulario.autorizacionDatosPersonales')
        .trim()
        .notEmpty().withMessage('El campo "Autorización de Datos Personales" no puede estar vacío...'),
];

// * OPCIONES CONTROL API
const opcionesControlApi = [
    // todo: No se valida nada
];

// * MONITOR
const monitor = [
    // todo: Validar campo 'fechaInicial'
    body('fechaInicial')
        .trim()
        .notEmpty().withMessage('El campo "Fecha Inicial" no puede estar vacío...')
        .custom(value => {
            if (value !== '-' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                throw new Error('El campo "Fecha Inicial" debe estar en el formato yyyy-mm-dd hh:mm:ss o ser "-".');
            }
            return true;
        }),

    // todo: Validar campo 'fechaFinal'
    body('fechaFinal')
        .trim()
        .notEmpty().withMessage('El campo "Fecha Final" no puede estar vacío...')
        .custom((value, { req }) => {
            if (value !== '-' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
                throw new Error('El campo "Fecha Final" debe estar en el formato yyyy-mm-dd hh:mm:ss o ser "-".');
            }
            if (value !== '-' && req.body.fechaInicial !== '-') {
                const fechaInicial = new Date(req.body.fechaInicial);
                const fechaFinal = new Date(value);
                if (fechaFinal < fechaInicial) {
                    throw new Error('La fecha final no puede ser menor que la fecha inicial.');
                }
            }
            return true;
        }),

    // todo: Validar campo 'opcionControlApi'
    body('opcionControlApi')
        .trim()
        .notEmpty().withMessage('El campo "Control Arbol" no puede estar vacío...')
        .isLength({ min: 1, max: 44 }).withMessage('El campo "Control Arbol" debe tener entre 1 y 44 caracteres.'),

    // todo Validar campo 'numeroLimite'
    body('numeroLimite')
        .trim()
        .optional()
        .isInt({ gt: 0 }).withMessage('El campo "Límite" debe ser un número mayor que cero.'),

    // todo Validar campo 'numeroDesplazamiento'
    body('numeroDesplazamiento')
        .trim()
        .optional()
        .isInt({ gte: 0 }).withMessage('El campo "Desplazamiento" debe ser un número mayor o igual a cero.')
];

// * LISTAR ARCHIVOS ADJUNTOS
const listarArchivosAdjuntos = [
    // todo: Validar campo 'idChat'
    query('idChat')
        .trim()
        .notEmpty().withMessage('El campo "idChat" no puede estar vacío...'),
];

// * FILTRAR
const filtrar = [
    // todo: Validar campo 'idChatWeb'
    query('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// * CERRAR
const cerrar = [
    // todo: Validar campo 'idChatWeb'
    body('idChatWeb')
        .trim()
        .notEmpty().withMessage('El campo "idChatWeb" no puede estar vacío...'),
];

// * CERRAR CHAT DESDE SOUL CHAT
const cerrarSoulChat = [
    // todo: Validar campo 'idChat'
    body('idChat')
        .trim()
        .notEmpty().withMessage('El campo "idChat" no puede estar vacío...')
        .isInt({ gt: 0 }).withMessage('El campo "idChat" debe ser un número entero mayor que cero.'),

    // todo: Validar campo 'remitente'
    body('remitente')
        .trim()
        .notEmpty().withMessage('El campo "remitente" no puede estar vacío...')
];

// ! EXPORTACIONES
module.exports = { 
    crear, 
    formularioInicial,
    opcionesControlApi,
    monitor,
    listarArchivosAdjuntos,
    filtrar,
    cerrar,
    cerrarSoulChat,
};
