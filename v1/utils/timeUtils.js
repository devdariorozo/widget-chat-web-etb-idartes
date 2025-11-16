// ! ================================================================================================================================================
// !                                                     HERRAMIENTA DE TIEMPO
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (24 de Enero de 2025)
// @lastModified Ramón Dario Rozo Torres (24 de Enero de 2025)
// @version 1.0.0
// v1/utils/timeUtils.js

// ! FUNCIONES
// * FUNCIÓN PARA OBTENER EL TIEMPO HASTA EL FINAL DEL DÍA
function getRemainingTimeUntilEndOfDay() {
    // todo: Obtener la fecha actual
    const now = new Date();
    // todo: Crear una fecha con la hora actual
    const endOfDay = new Date(now);
    // todo: Establecer la hora final del día
    endOfDay.setHours(23, 59, 59, 999);

    // todo: Retornar el tiempo restante hasta el final del día
    return endOfDay - now;
}

// ! EXPORTACIONES
module.exports = { getRemainingTimeUntilEndOfDay };