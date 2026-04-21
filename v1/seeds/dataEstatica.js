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
    solicitarFormularioInicial: "Solicitar Formulario Inicial",
    procesarFormularioInicial: "Procesar Formulario Inicial",
    solicitarPasoAsesor: 'Solicitar Paso Asesor',
    fueraDeHorario: 'Fuera de Horario',
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
                    Idartes le da la bienvenida, agradecemos diligenciar la información solicitada para empezar a charlar con la o el servidor que esté disponible.
                </p>`;

// TODO: MENSAJE SOLICITANDO FORMULARIO INSTITUCIONAL INICIAL
const solicitarFormularioInicial = `
<p class="solicitarFormularioInicialArbol">📝 <b>Formulario inicial.</b><br/><br/>
    <div id="content_form">
        <!-- Nombres y Apellidos -->
        <div class="input-field col s12 m6 l6">
            <input type="text" name="txt_nombresApellidos" id="txt_nombresApellidos" maxlength="45" data-length="45" class="campo-formulario" autocomplete="off">
            <label for="txt_nombresApellidos" class="label-widget">Nombres y Apellidos</label>
            <div class="invalid-feedback"></div>
       </div>

        <!-- Género -->
        <div class="input-field col s12 m6 l4">
            <select name="txt_genero" id="txt_genero" class="campo-formulario select2 browser-default" autocomplete="off">
                <option value=""></option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Transgénero">Transgénero</option>
            </select>
            <label for="txt_genero" class="select2-label">Seleccione su género</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Correo electrónico -->
        <div class="input-field col s12 m6 l4">
            <input type="email" name="txt_correoElectronico" id="txt_correoElectronico" maxlength="44" data-length="44" class="campo-formulario" autocomplete="off">
            <label for="txt_correoElectronico" class="label-widget">Correo electrónico</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Número de teléfono -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_numeroContacto" id="txt_numeroContacto" maxlength="15" data-length="15" class="campo-formulario" autocomplete="off">
            <label for="txt_numeroContacto" class="label-widget">Número de teléfono <span style="font-size:0.8em; color:#4a4848;">(opcional)</span></label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Localidad -->
        <div class="input-field col s12 m6 l4">
            <select name="txt_localidad" id="txt_localidad" class="campo-formulario select2 browser-default" autocomplete="off">
                <option value=""></option>
                <option value="Usaquén">Usaquén</option>
                <option value="Chapinero">Chapinero</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="San Cristóbal">San Cristóbal</option>
                <option value="Usme">Usme</option>
                <option value="Tunjuelito">Tunjuelito</option>
                <option value="Bosa">Bosa</option>
                <option value="Kennedy">Kennedy</option>
                <option value="Fontibón">Fontibón</option>
                <option value="Engativá">Engativá</option>
                <option value="Suba">Suba</option>
                <option value="Barrios Unidos">Barrios Unidos</option>
                <option value="Teusaquillo">Teusaquillo</option>
                <option value="Los Mártires">Los Mártires</option>
                <option value="Antonio Nariño">Antonio Nariño</option>
                <option value="Puente Aranda">Puente Aranda</option>
                <option value="La Candelaria">La Candelaria</option>
                <option value="Rafael Uribe Uribe">Rafael Uribe Uribe</option>
                <option value="Ciudad Bolívar">Ciudad Bolívar</option>
                <option value="Sumapaz">Sumapaz</option>
            </select>
            <label for="txt_localidad" class="select2-label">Seleccione su localidad</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Rango de edad -->
        <div class="input-field col s12 m6 l4">
            <select name="txt_rangoEdad" id="txt_rangoEdad" class="campo-formulario select2 browser-default" autocomplete="off">
                <option value=""></option>
                <option value="0 a 11 años">0 a 11 años</option>
                <option value="12 a 18 años">12 a 18 años</option>
                <option value="19 a 29 años">19 a 29 años</option>
                <option value="30 a 50 años">30 a 50 años</option>
                <option value="Más de 50 años">Más de 50 años</option>
            </select>
            <label for="txt_rangoEdad" class="select2-label">Seleccione su rango de edad</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Tema de consulta -->
        <div class="input-field col s12">
            <select name="txt_temaConsulta" id="txt_temaConsulta" class="campo-formulario select2 browser-default" autocomplete="off">
               <option value=""></option>
               <option value="Crea (talleres artísticos)">Crea (talleres artísticos)</option>
               <option value="Convocatorias culturales (PDE o generales)">Convocatorias culturales (PDE o generales)</option>
               <option value="Invitaciones culturales">Invitaciones culturales</option>
               <option value="Más Cultura Local">Más Cultura Local</option>
               <option value="Préstamo o alquiler de espacios o equipos">Préstamo o alquiler de espacios o equipos</option>
               <option value="Programación o boletas de eventos">Programación o boletas de eventos</option>
               <option value="Solicitud de empleo">Solicitud de empleo</option>
               <option value="Talleres (no Crea)">Talleres (no Crea)</option>
               <option value="Libro al Viento">Libro al Viento</option>
               <option value="Permisos para artistas en espacio público">Permisos para artistas en espacio público</option>
               <option value="Nidos (Laboratorios de primera infancia)">Nidos (Laboratorios de primera infancia)</option>
               <option value="Certificaciones">Certificaciones</option>
               <option value="PUFA">PUFA</option>
               <option value="Información administrativa">Información administrativa</option>
               <option value="BEPS">BEPS</option>
               <option value="Publicaciones de las Gerencias">Publicaciones de las Gerencias</option>
               <option value="Graffiti">Graffiti</option>
               <option value="Entrevistas">Entrevistas</option>
               <option value="Otro">Otro</option>
            </select>
            <label for="txt_temaConsulta" class="select2-label">Tema de consulta</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Campo de texto para "Otro" (inicialmente oculto) -->
        <div class="input-field col s12" id="contenedor-tema-otro" style="display: none;">
            <input type="text" name="txt_temaOtro" id="txt_temaOtro" maxlength="200" data-length="200" class="campo-formulario" autocomplete="off">
            <label for="txt_temaOtro" class="label-widget">Especifique su tema de consulta</label>
            <div class="invalid-feedback"></div>
        </div>

        <p class="tratamientoDatosArbol">
        Idartes tratará su información con fines exclusivos para el trámite del servicio; en cumplimiento de lo establecido en la Ley 1581 de 2012 y demás normas, sobre el tratamiento de datos.<br/><br/>
        </p>

        <label class="form-checkbox">
            <input type="checkbox" id="txt_autorizacionDatosPersonales" name="txt_autorizacionDatosPersonales" required>
            <span class="label-widget">Autorizo el tratamiento de mis datos personales</span>
        </label></br></br>

        <div class="center mt-2">
            <button id="btn_Continuar" class="btn waves-effect waves-light blue darken-1 mb-2">
                <i class="material-icons left">arrow_forward</i>Continuar
            </button>
        </div>
    </div>
</p>`;

// // TODO: MENSAJE SOLICITANDO AUTORIZACION DE TRATAMIENTO DE DATOS
// const solicitarautorizacionDatosPersonales = {
//     contenido: `<p class="solicitarautorizacionDatosPersonalesArbol">
//     <b>Autorización Tratamiento de Datos.</b><br/><br/></p>

//     Idartes tratará su información con fines exclusivos para el trámite del servicio; en cumplimiento de lo establecido en la Ley 1581 de 2012 y demás normas, sobre el tratamiento de datos.<br/><br/>

//     <i>Por favor, seleccione una opción para continuar.</i>
//     `,

//     botones: [
//         { text: "Sí, autorizo", payload: "1" },
//         { text: "No autorizo", payload: "2" }
//     ]
// };

// TODO: MENSAJE SOLICITANDO PASO ASESOR
const solicitarPasoAsesor = `  <p class="solicitarPasoAsesorArbol"><b>Paso Asesor.</b><br/><br/>
                               <i>En este momento le estaremos asignando un asesor para atenderle.</i>
                               </p>`;

// TODO: MENSAJE SOLICITANDO ENCUESTA
const solicitoInicioEncuesta = `  <p class="solicitoInicioEncuestaArbol"><b>Encuesta.</b><br/><br/>
                                <i>A continuación le invitamos a responder una breve encuesta.</i>
                            </p>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR SERVICIO
const solicitarCalificarServicio = `  <p class="solicitarCalificarServicioArbol"><b>¿Cómo valora nuestro servicio?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Malo</button>
                                <button class="btn-opcion-chat" data-valor="2">2. Regular</button>
                                <button class="btn-opcion-chat" data-valor="3">3. Ni bueno ni malo</button>
                                <button class="btn-opcion-chat" data-valor="4">4. Bueno</button>
                                <button class="btn-opcion-chat" data-valor="5">5. Excelente</button>
                            </div>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR AMABILIDAD
const solicitarCalificarAmabilidad = `  <p class="solicitarCalificarAmabilidadArbol"><b>¿Cómo valora nuestra amabilidad de la respuesta?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Mala</button>
                                <button class="btn-opcion-chat" data-valor="2">2. Regular</button>
                                <button class="btn-opcion-chat" data-valor="3">3. Ni buena ni mala</button>
                                <button class="btn-opcion-chat" data-valor="4">4. Buena</button>
                                <button class="btn-opcion-chat" data-valor="5">5. Excelente</button>
                            </div>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR TIEMPO
const solicitarCalificarTiempo = `  <p class="solicitarCalificarTiempoArbol"><b>¿Cómo valora nuestro tiempo en recibir respuesta a su solicitud?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Malo</button>
                                <button class="btn-opcion-chat" data-valor="2">2. Regular</button>
                                <button class="btn-opcion-chat" data-valor="3">3. Ni bueno ni malo</button>
                                <button class="btn-opcion-chat" data-valor="4">4. Bueno</button>
                                <button class="btn-opcion-chat" data-valor="5">5. Excelente</button>
                            </div>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR CALIDAD
const solicitarCalificarCalidad = `  <p class="solicitarCalificarCalidadArbol"><b>¿Cómo valora nuestra calidad de la información recibida?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Mala</button>
                                <button class="btn-opcion-chat" data-valor="2">2. Regular</button>
                                <button class="btn-opcion-chat" data-valor="3">3. Ni buena ni mala</button>
                                <button class="btn-opcion-chat" data-valor="4">4. Buena</button>
                                <button class="btn-opcion-chat" data-valor="5">5. Excelente</button>
                            </div>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR CONOCIMIENTO
const solicitarCalificarConocimiento = `  <p class="solicitarCalificarConocimientoArbol"><b>¿Cómo valora nuestro conocimiento del tema por parte de la o el funcionario?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Malo</button>
                                <button class="btn-opcion-chat" data-valor="2">2. Regular</button>
                                <button class="btn-opcion-chat" data-valor="3">3. Ni bueno ni malo</button>
                                <button class="btn-opcion-chat" data-valor="4">4. Bueno</button>
                                <button class="btn-opcion-chat" data-valor="5">5. Excelente</button>
                            </div>`;

// TODO: MENSAJE SOLICITANDO CALIFICAR SOLUCION
const solicitarCalificarSolucion = `  <p class="solicitarCalificarSolucionArbol"><b>¿Su solicitud fue solucionada?</b><br/><br/>
                                <i>Por favor, seleccione una opción:</i>
                            </p>
                            <div class="opciones-chat">
                                <button class="btn-opcion-chat" data-valor="1">1. Sí</button>
                                <button class="btn-opcion-chat" data-valor="2">2. No</button>
                            </div>`;

// TODO: MENSAJE ESCUCHAR COMENTARIO
const escucharComentario = `  <p class="escucharComentarioArbol"><b>¿Tiene algún comentario de la atención recibida que nos ayude a la mejora de nuestro servicio?</b><br/><br/>
                                <i>Por favor, escriba sus comentarios o sugerencias.</i>
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
const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol"><b>No entiendo su respuesta.</b><br/><br/>
                            <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i></p>`;

// TODO: MENSAJE DE CLIENTE DESISTE
const clienteDesiste = `<p class="clienteDesisteArbol"><b>Hemos notado que ha decidido no continuar con la atención en nuestro sistema.</b><br/><br/>
                           <i>Si necesita asistencia no dude en contactarnos nuevamente.</i></p>`;

// TODO: MENSAJE DE ALERTA DE ERROR API
const alertaErrorAPI = `<p class="alertaErrorAPIArbol"><b>Estamos experimentando una incidencia técnica.</b><br/><br/>
                            <i>Le pedimos que espere o nos visite nuevamente en breve mientras solucionamos el inconveniente; agradecemos su comprensión.</i></p>`;

// TODO: MENSAJE DE NOVEDAD O INCIDENCIA TECNICA
const novedadIncidenciaTecnica = `<p class="novedadIncidenciaTecnicaArbol">¡Atención!<br/><br/>
                                Estamos experimentando una novedad o incidencia técnica.<br/>
                                Por favor, intente nuevamente más tarde iniciando un nuevo chat. <br/>
                                Agradecemos su paciencia y comprensión.</p>`;

// TODO: MENSAJE DE DESPEDIDA
const despedida = `<p class="despedidaChat">¡Gracias por haber utilizado nuestro servicio!<br/><br/>
                    Esperamos haberle ayudado.<br/>
                    <b>¡Estamos para servirle!</b></p>`

// TODO: MENSAJE POR CHAT DIFERENTE A ABIERTO
const chatDiferenteAbierto = `<p class="chatDiferenteAbiertoArbol"><b>Este chat está actualmente cerrado.</b><br/><br/>
                            <i>Para continuar la comunicación, por favor, inicie un nuevo chat o contáctenos a través de nuestros canales oficiales.<br/><br/>
                            Agradecemos su comprensión, estamos aquí para ayudarle.</i></p>`;

           
// TODO: MENSAJE FUERA DE HORARIO
const fueraDeHorario = `<p class="fueraDeHorarioArbol">En estos momentos estamos fuera de nuestro horario de atención, recuerda que nuestro horario es de 7:00am a 4:30pm.</p>`;                       

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
        solicitarFormularioInicial,
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
        chatDiferenteAbierto,
        fueraDeHorario
    }
};