// ! ================================================================================================================================================
// !                                                          SEEDS DE DATOS ESTATICOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// v1/seeds/dataEstatica.js

// ! VALORES ESTATICOS
// * TIPO DE GESTION
const tipoGestion = {
    inbound: 'Inbound',
    outbound: 'Outbound'
};

// * ESTADO DE CHAT
const estadoChat = {
    recibido: 'Recibido',
    enviado: 'Enviado'
};

// * ESTADO DE GESTION
const estadoGestion = {
    abierto: 'Abierto',
    cerrado: 'Cerrado'
};

// * ARBOL
const arbol = {
    saludo: 'Saludo',
    solicitarNombresApellidos: 'Solicitar Nombres Apellidos',
    solicitarGenero: 'Solicitar Genero',
    solicitarCorreoElectronico: 'Solicitar Correo Electrónico',
    solicitarNumeroTelefono: 'Solicitar Numero Telefono',
    solicitarLocalidad: 'Solicitar Localidad',
    solicitarEnQuePodemosAyudarle: 'Solicitar En Que Podemos Ayudarle',
    solicitarRangoEdad: 'Solicitar Rango Edad',
    solicitarAutorizacionTratamientoDatos: 'Solicitar Autorizacion Tratamiento Datos',
    solicitarPasoAsesor: 'Solicitar Paso Asesor',
    solicitoInicioEncuesta: 'Solicito Inicio Encuesta',
    solicitarCalificarServicio: 'Solicitar Calificar Servicio',
    solicitarCalificarAmabilidad: 'Solicitar Calificar Amabilidad',
    solicitarCalificarTiempo: 'Solicitar Calificar Tiempo',
    solicitarCalificarCalidad: 'Solicitar Calificar Calidad',
    solicitarCalificarConocimiento: 'Solicitar Calificar Conocimiento',
    solicitarCalificarSolucion: 'Solicitar Calificar Solucion',
    escucharComentario: 'Escuchar Comentario',
    alertaNoEntiendo: 'Alerta No Entiendo',
    clienteDesiste: 'Cliente Desiste',
    errorApi: 'Error API',
    alertaInactividad: 'Alerta Inactividad',
    cerradoPorInactividad: 'Cerrado Por Inactividad',
    despedida: 'Despedida'
};

// * CONTROL DE ARBOL
const controlApi = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
};

// * MENSAJES
// TODO: MENSAJE DE SALUDO
const saludo = `<p class="saludoChat">
                    🙋‍♂️ Hola, saludo pendiente por definir...
                </p>`;

// TODO: MENSAJE SOLICITANDO NOMBRES Y APELLIDOS
const solicitarNombresApellidos = `  <p class="solicitarNombresApellidosArbol">👉 <b>Nombres y Apellidos.</b><br/><br/>
                                        <i>Por favor, ingrese sus nombres y apellidos completos.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO GENERO
const solicitarGenero = `  <p class="solicitarGeneroArbol">👉 <b>Género.</b><br/><br/>

                                <b>1.</b> Femenino<br/>
                                <b>2.</b> Masculino<br/>
                                <b>3.</b> Transgénero<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CORREO ELECTRONICO
const solicitarCorreoElectronico = `  <p class="solicitarCorreoElectronicoArbol">👉 <b>Correo Electrónico.</b><br/><br/>
                                        <i>Por favor, ingrese su correo electrónico.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO NUMERO DE TELEFONO
const solicitarNumeroTelefono = `  <p class="solicitarNumeroTelefonoArbol">👉 <b>Número de Teléfono.</b><br/><br/>
                                        <i>Por favor, ingrese su número de teléfono.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO LOCALIDAD
const solicitarLocalidad = `  <p class="solicitarLocalidadArbol">👉 <b>Localidad.</b><br/><br/>
                                        <i>Por favor, ingrese en que localidad vive.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO EN QUE PODEMOS AYUDARLE
const solicitarEnQuePodemosAyudarle = `  <p class="solicitarEnQuePodemosAyudarleArbol">👉 <b>En que podemos ayudarle?</b><br/><br/>
                                        <i>Por favor, ingrese su solicitud.</i>
                                    </p>`;

// TODO: MENSAJE SOLICITANDO RANGO DE EDAD
const solicitarRangoEdad = `  <p class="solicitarRangoEdadArbol">👉 <b>Rango de Edad.</b><br/><br/>

                                <b>1.</b> 0 a 11 años<br/>
                                <b>2.</b> 12 a 18 años<br/>
                                <b>3.</b> 19 a 29 años<br/>
                                <b>4.</b> 30 a 50 años<br/>
                                <b>5.</b> Más de 50 años<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO AUTORIZACION DE TRATAMIENTO DE DATOS
const solicitarAutorizacionTratamientoDatos = `  <p class="solicitarAutorizacionTratamientoDatosArbol">👉 <b>Autorización Tratamiento de Datos.</b><br/><br/>

                                                    Idartes tratará su información con fines exclusivos para el trámite del servicio; en cumplimiento de lo establecido en la Ley 1581 de 2012 y demás normas, sobre el tratamiento de datos.<br/><br/>

                                                    1. Sí<br/>
                                                    2. No<br/><br/>
                                                    
                                                    <i>Por favor, seleccione una opción para continuar.</i>
                                                </p>`;

// TODO: MENSAJE SOLICITANDO PASO ASESOR
const solicitarPasoAsesor = `  <p class="solicitarPasoAsesorArbol">👉 <b>Paso Asesor.</b><br/><br/>
                                <i>En este momento le estaremos asignando un asesor para atenderle.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO ENCUESTA
const solicitoInicioEncuesta = `  <p class="solicitoInicioEncuestaArbol">👉 <b>Encuesta.</b><br/><br/>
                                <i>A continuación te invitamos a responder una breve encuesta 😉</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR SERVICIO
const solicitarCalificarServicio = `  <p class="solicitarCalificarServicioArbol">👉 <b>¿Cómo valora nuestro servicio?</b><br/><br/>

                                <b>1.</b> Malo<br/>
                                <b>2.</b> Regular<br/>
                                <b>3.</b> Ni bueno ni malo<br/>
                                <b>4.</b> Bueno<br/>
                                <b>5.</b> Excelente<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR AMABILIDAD
const solicitarCalificarAmabilidad = `  <p class="solicitarCalificarAmabilidadArbol">👉 <b>¿Cómo valora nuestra amabilidad de la respuesta?</b><br/><br/>

                                <b>1.</b> Mala<br/>
                                <b>2.</b> Regular<br/>
                                <b>3.</b> Ni buena ni mala<br/>
                                <b>4.</b> Buena<br/>
                                <b>5.</b> Excelente<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR TIEMPO
const solicitarCalificarTiempo = `  <p class="solicitarCalificarTiempoArbol">👉 <b>¿Cómo valora nuestro tiempo en recibir respuesta a su solicitud?</b><br/><br/>

                                <b>1.</b> Malo<br/>
                                <b>2.</b> Regular<br/>
                                <b>3.</b> Ni bueno ni malo<br/>
                                <b>4.</b> Buena<br/>
                                <b>5.</b> Excelente<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR CALIDAD
const solicitarCalificarCalidad = `  <p class="solicitarCalificarCalidadArbol">👉 <b>¿Cómo valora nuestra calidad de la información recibida?</b><br/><br/>

                                <b>1.</b> Mala<br/>
                                <b>2.</b> Regular<br/>
                                <b>3.</b> Ni buena ni mala<br/>
                                <b>4.</b> Buena<br/>
                                <b>5.</b> Excelente<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR CONOCIMIENTO
const solicitarCalificarConocimiento = `  <p class="solicitarCalificarConocimientoArbol">👉 <b>¿Cómo valora nuestro conocimiento del tema por parte de la o el funcionario?</b><br/><br/>

                                <b>1.</b> Malo<br/>
                                <b>2.</b> Regular<br/>
                                <b>3.</b> Ni bueno ni malo<br/>
                                <b>4.</b> Buena<br/>
                                <b>5.</b> Excelente<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR SOLUCION
const solicitarCalificarSolucion = `  <p class="solicitarCalificarSolucionArbol">👉 <b>¿Su solicitud fue solucionada?</b><br/><br/>

                                <b>1.</b> Sí<br/>
                                <b>2.</b> No<br/><br/>
                                
                                <i>Por favor, seleccione una opción para continuar.</i>
                            </p>`;
                            
// TODO: MENSAJE ESCUCHAR COMENTARIO
const escucharComentario = `  <p class="escucharComentarioArbol">👉 <b>¿Tiene algún comentario de la atención recibida que nos ayude a la mejora de nuestro servicio?</b><br/><br/>
                                <i>Por favor, ingrese sus comentarios o sugerencias.</i>
                            </p>`;  



// // TODO: MENSAJE SOLICITANDO CONDICION DE ADJUNTOS
// const condicionAdjuntos = `<p class="condicionAdjuntosArbol">📝 <b>Adjuntar documentos:</b> <br/><br/>
//                             📢 <i>No es obligatorio.</i><br/><br/>
//                             ⚠️ <i>Se permite un máximo de 5 archivos.</i><br/>
//                             ⚠️ <i>Los documentos deben ser archivos tipo .pdf .xls .xlsx .jpg .png .doc .docx únicamente y no deben superar los 5 MB.</i><br/><br/>
//                             1. Adjuntar documentos <br/>
//                             2. Continuar.</p>`;

// // TODO: MENSAJE DE CONFIRMAR ADJUNTOS
// const confirmarAdjuntos = `<p class="confirmarAdjuntosArbol">📝 <b>Por favor, adjuntar los archivos.</b></p>`;

// TODO: MENSAJE DE ALERTA DE NO ENTIENDO
const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
                            ⚠️ <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i></p>`;

// TODO: MENSAJE DE CLIENTE DESISTE
const clienteDesiste = `<p class="clienteDesisteArbol">⚠️ <b>Hemos notado que ha decidido no continuar con la atención en nuestro sistema.</b><br/><br/>
                           👉 <i>Si necesita asistencia no dude en contactarnos nuevamente.</i></p>`;

// TODO: MENSAJE DE ALERTA DE ERROR API
const alertaErrorAPI = `<p class="alertaErrorAPIArbol">⏳ <b>Estamos experimentando una incidencia técnica.</b><br/><br/>
                            🙏 <i>Le pedimos que espere o nos visite nuevamente en breve mientras solucionamos el inconveniente; agradecemos su comprensión.</i></p>`;

// TODO: MENSAJE DE NOVEDAD O INCIDENCIA TECNICA
const novedadIncidenciaTecnica = `<p class="novedadIncidenciaTecnicaArbol">🚨 ¡Atención!<br/><br/>
                                🔄 Estamos experimentando una novedad o incidencia técnica.<br/>
                                🕰️ Por favor, intente nuevamente más tarde iniciando un nuevo chat. <br/>
                                👋 Agradecemos su paciencia y compresión.</p>`;

// TODO: MENSAJE DE DESPEDIDA
const despedida = `<p class="despedidaChat">🌟 ¡Gracias por haber utilizado nuestro servicio!<br/><br/>
                    😊 Esperamos haberle ayudado.<br/>
                    <b>¡Estamos para servirle!</b> 👋</p>`

// TODO: MENSAJE POR CHAT DIFERENTE A ABIERTO
const chatDiferenteAbierto = `<p class="chatDiferenteAbiertoArbol">⚠️ <b>Este chat está actualmente cerrado.</b><br/><br/>
                            📞 <i>Para continuar la comunicación, por favor, inicie un nuevo chat o contáctenos a través de nuestros canales oficiales.<br/><br/>
                            Agradecemos su comprensión, estamos aquí para ayudarle.</i></p>`;

                            
// * ESTADO DE MENSAJE
const estadoMensaje = {
    recibido: 'Recibido',
    enviado: 'Enviado'
};

// * TIPO DE MENSAJE
const tipoMensaje = {
    texto: 'Texto',
    adjuntos: 'Adjuntos',
    multimedia: 'Multimedia',
    inactividad: 'Inactividad',
    finChat: 'Fin Chat',
    errorApi: 'Error API',
    formulario: 'Formulario'
};

// * LECTURA MENSAJE
const lecturaMensaje = {
    noLeido: 'No leido',
    leido: 'Leido'
};

// * ESTADO REGISTRO
const estadoRegistro = {
    activo: 'Activo',
    inactivo: 'Inactivo'
};

// * RESPONSABLE
const responsable = 'Widget Chat Web ETB - IDARTES';

// ! EXPORTACIONES ORGANIZADAS POR CATEGORÍAS
module.exports = {
    // * CONFIGURACIONES DEL SISTEMA
    configuracion: {
        tipoGestion,
        estadoChat,
        estadoGestion,
        controlApi,
        estadoMensaje,
        tipoMensaje,
        lecturaMensaje,
        estadoRegistro,
        responsable
    },

    // * ESTRUCTURA DEL ARBOL DE NAVEGACION
    arbol,

    // * MENSAJES DEL SISTEMA
    mensajes: {
        saludo,
        solicitarNombresApellidos,
        solicitarGenero,
        solicitarCorreoElectronico,
        solicitarNumeroTelefono,
        solicitarLocalidad,
        solicitarEnQuePodemosAyudarle,
        solicitarRangoEdad,
        solicitarAutorizacionTratamientoDatos,
        solicitarPasoAsesor,
        solicitoInicioEncuesta,
        solicitarCalificarServicio,
        solicitarCalificarAmabilidad,
        solicitarCalificarTiempo,
        solicitarCalificarCalidad,
        solicitarCalificarConocimiento,
        solicitarCalificarSolucion,
        escucharComentario,
        alertaNoEntiendo,
        clienteDesiste,
        alertaErrorAPI,
        novedadIncidenciaTecnica,
        despedida,
        chatDiferenteAbierto
    }
};