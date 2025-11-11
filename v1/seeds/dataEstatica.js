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
    despedida: 'Despedida',
    instrucciones: 'Instrucciones',
    inicio: 'Inicio',
    solicitarFormularioInicial: 'Solicitar Formulario Inicial',
    procesarFormularioInicial: 'Procesar Formulario Inicial',
    pasoDirectoSoulChat: 'Paso Directo Soul Chat',
    condicionAdjuntos: 'Condicion Adjuntos',
    confirmarAdjuntos: 'Confirmar Adjuntos',
    alertaNoEntiendo: 'Alerta No Entiendo',
    errorApi: 'Error API',
    clienteDesiste: 'Cliente Desiste',
    alertaInactividad: 'Alerta Inactividad',
    cerradoPorInactividad: 'Cerrado Por Inactividad'
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
                    🙋‍♂️ Hola. <br/>
                    Soy Regi, el asistente virtual de la Registraduría Nacional del Estado Civil para el proceso de inscripción de ciudadanos colombianos en el exterior.<br/><br/>
                    
                    📄 Antes de continuar, por favor diligenciar la siguiente información.
                </p>`;

// TODO: MENSAJE DE DESPEDIDA
const despedida = `<p class="despedidaChat">🌟 ¡Gracias por haber utilizado nuestro servicio!<br/><br/>
                    😊 Esperamos haberle ayudado.<br/>
                    <b>¡Estamos para servirle!</b> 👋</p>`

// TODO: MENSAJE DE INSTRUCCIONES
const instrucciones = `<p class="instruccionesArbol">Hola,<br/><br/>
                        📝 <b>En el momento que desee volver a empezar, por favor escriba <b>inicio</b> o <b>INICIO</b> para regresar al menú principal🔄</b></p>`;

// TODO: MENSAJE SOLICITANDO FORMULARIO INICIAL
const solicitarFormularioInicial = `  <p class="solicitarFormularioInicialArbol">📝 <b>Formulario inicial.</b><br/><br/>
    <div id="content_form">

        <!-- Nombres -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_nombres" id="txt_nombres" maxlength="44" data-length="44" class="campo-formulario" onkeyup="valida_txt_nombres();" onclick="valida_txt_nombres();" autocomplete="off">
            <label for="txt_nombres" class="label-widget">Nombres</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Apellidos -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_apellidos" id="txt_apellidos" maxlength="44" data-length="44" class="campo-formulario" onkeyup="valida_txt_apellidos();" onclick="valida_txt_apellidos();" autocomplete="off">
            <label for="txt_apellidos" class="label-widget">Apellidos</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Número de cédula -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_numeroCedula" id="txt_numeroCedula" maxlength="12" data-length="12" class="campo-formulario" onkeyup="valida_txt_numeroCedula();" onclick="valida_txt_numeroCedula();" autocomplete="off">
            <label for="txt_numeroCedula" class="label-widget">Número de cédula</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- País de residencia -->
        <div class="input-field col s12 m6 l4">
            <select name="txt_paisResidencia" id="txt_paisResidencia" maxlength="44" data-length="44" class="campo-formulario select2 browser-default" autocomplete="off">
                <option value=""></option>
                <option value="Afganistán" data-indicativo="+93">Afganistán</option>
                <option value="Albania" data-indicativo="+355">Albania</option>
                <option value="Alemania" data-indicativo="+49">Alemania</option>
                <option value="Andorra" data-indicativo="+376">Andorra</option>
                <option value="Angola" data-indicativo="+244">Angola</option>
                <option value="Antigua y Barbuda" data-indicativo="+1-268">Antigua y Barbuda</option>
                <option value="Arabia Saudita" data-indicativo="+966">Arabia Saudita</option>
                <option value="Argelia" data-indicativo="+213">Argelia</option>
                <option value="Argentina" data-indicativo="+54">Argentina</option>
                <option value="Armenia" data-indicativo="+374">Armenia</option>
                <option value="Australia" data-indicativo="+61">Australia</option>
                <option value="Austria" data-indicativo="+43">Austria</option>
                <option value="Azerbaiyán" data-indicativo="+994">Azerbaiyán</option>
                <option value="Bahamas" data-indicativo="+1-242">Bahamas</option>
                <option value="Bangladés" data-indicativo="+880">Bangladés</option>
                <option value="Barbados" data-indicativo="+1-246">Barbados</option>
                <option value="Baréin" data-indicativo="+973">Baréin</option>
                <option value="Bélgica" data-indicativo="+32">Bélgica</option>
                <option value="Belice" data-indicativo="+501">Belice</option>
                <option value="Benín" data-indicativo="+229">Benín</option>
                <option value="Bielorrusia" data-indicativo="+375">Bielorrusia</option>
                <option value="Bolivia" data-indicativo="+591">Bolivia</option>
                <option value="Bosnia y Herzegovina" data-indicativo="+387">Bosnia y Herzegovina</option>
                <option value="Botsuana" data-indicativo="+267">Botsuana</option>
                <option value="Brasil" data-indicativo="+55">Brasil</option>
                <option value="Brunéi" data-indicativo="+673">Brunéi</option>
                <option value="Bulgaria" data-indicativo="+359">Bulgaria</option>
                <option value="Burkina Faso" data-indicativo="+226">Burkina Faso</option>
                <option value="Burundi" data-indicativo="+257">Burundi</option>
                <option value="Bután" data-indicativo="+975">Bután</option>
                <option value="Cabo Verde" data-indicativo="+238">Cabo Verde</option>
                <option value="Camboya" data-indicativo="+855">Camboya</option>
                <option value="Camerún" data-indicativo="+237">Camerún</option>
                <option value="Canadá" data-indicativo="+1">Canadá</option>
                <option value="Catar" data-indicativo="+974">Catar</option>
                <option value="Chad" data-indicativo="+235">Chad</option>
                <option value="Chile" data-indicativo="+56">Chile</option>
                <option value="China" data-indicativo="+86">China</option>
                <option value="Chipre" data-indicativo="+357">Chipre</option>
                <option value="Comoras" data-indicativo="+269">Comoras</option>
                <option value="Corea del Norte" data-indicativo="+850">Corea del Norte</option>
                <option value="Corea del Sur" data-indicativo="+82">Corea del Sur</option>
                <option value="Costa de Marfil" data-indicativo="+225">Costa de Marfil</option>
                <option value="Costa Rica" data-indicativo="+506">Costa Rica</option>
                <option value="Croacia" data-indicativo="+385">Croacia</option>
                <option value="Cuba" data-indicativo="+53">Cuba</option>
                <option value="Dinamarca" data-indicativo="+45">Dinamarca</option>
                <option value="Dominica" data-indicativo="+1-767">Dominica</option>
                <option value="Ecuador" data-indicativo="+593">Ecuador</option>
                <option value="Egipto" data-indicativo="+20">Egipto</option>
                <option value="El Salvador" data-indicativo="+503">El Salvador</option>
                <option value="Emiratos Árabes Unidos" data-indicativo="+971">Emiratos Árabes Unidos</option>
                <option value="Eritrea" data-indicativo="+291">Eritrea</option>
                <option value="Eslovaquia" data-indicativo="+421">Eslovaquia</option>
                <option value="Eslovenia" data-indicativo="+386">Eslovenia</option>
                <option value="España" data-indicativo="+34">España</option>
                <option value="Estados Unidos" data-indicativo="+1">Estados Unidos</option>
                <option value="Estonia" data-indicativo="+372">Estonia</option>
                <option value="Etiopía" data-indicativo="+251">Etiopía</option>
                <option value="Filipinas" data-indicativo="+63">Filipinas</option>
                <option value="Finlandia" data-indicativo="+358">Finlandia</option>
                <option value="Fiyi" data-indicativo="+679">Fiyi</option>
                <option value="Francia" data-indicativo="+33">Francia</option>
                <option value="Gabón" data-indicativo="+241">Gabón</option>
                <option value="Gambia" data-indicativo="+220">Gambia</option>
                <option value="Georgia" data-indicativo="+995">Georgia</option>
                <option value="Ghana" data-indicativo="+233">Ghana</option>
                <option value="Granada" data-indicativo="+1-473">Granada</option>
                <option value="Grecia" data-indicativo="+30">Grecia</option>
                <option value="Guatemala" data-indicativo="+502">Guatemala</option>
                <option value="Guinea" data-indicativo="+224">Guinea</option>
                <option value="Guinea Ecuatorial" data-indicativo="+240">Guinea Ecuatorial</option>
                <option value="Guinea-Bisáu" data-indicativo="+245">Guinea-Bisáu</option>
                <option value="Guyana" data-indicativo="+592">Guyana</option>
                <option value="Haití" data-indicativo="+509">Haití</option>
                <option value="Honduras" data-indicativo="+504">Honduras</option>
                <option value="Hungría" data-indicativo="+36">Hungría</option>
                <option value="India" data-indicativo="+91">India</option>
                <option value="Indonesia" data-indicativo="+62">Indonesia</option>
                <option value="Irak" data-indicativo="+964">Irak</option>
                <option value="Irán" data-indicativo="+98">Irán</option>
                <option value="Irlanda" data-indicativo="+353">Irlanda</option>
                <option value="Islandia" data-indicativo="+354">Islandia</option>
                <option value="Israel" data-indicativo="+972">Israel</option>
                <option value="Italia" data-indicativo="+39">Italia</option>
                <option value="Jamaica" data-indicativo="+1-876">Jamaica</option>
                <option value="Japón" data-indicativo="+81">Japón</option>
                <option value="Jordania" data-indicativo="+962">Jordania</option>
                <option value="Kazajistán" data-indicativo="+7">Kazajistán</option>
                <option value="Kenia" data-indicativo="+254">Kenia</option>
                <option value="Kirguistán" data-indicativo="+996">Kirguistán</option>
                <option value="Kiribati" data-indicativo="+686">Kiribati</option>
                <option value="Kuwait" data-indicativo="+965">Kuwait</option>
                <option value="Laos" data-indicativo="+856">Laos</option>
                <option value="Lesoto" data-indicativo="+266">Lesoto</option>
                <option value="Letonia" data-indicativo="+371">Letonia</option>
                <option value="Líbano" data-indicativo="+961">Líbano</option>
                <option value="Liberia" data-indicativo="+231">Liberia</option>
                <option value="Libia" data-indicativo="+218">Libia</option>
                <option value="Liechtenstein" data-indicativo="+423">Liechtenstein</option>
                <option value="Lituania" data-indicativo="+370">Lituania</option>
                <option value="Luxemburgo" data-indicativo="+352">Luxemburgo</option>
                <option value="Madagascar" data-indicativo="+261">Madagascar</option>
                <option value="Malasia" data-indicativo="+60">Malasia</option>
                <option value="Malaui" data-indicativo="+265">Malaui</option>
                <option value="Maldivas" data-indicativo="+960">Maldivas</option>
                <option value="Malí" data-indicativo="+223">Malí</option>
                <option value="Malta" data-indicativo="+356">Malta</option>
                <option value="Marruecos" data-indicativo="+212">Marruecos</option>
                <option value="Mauricio" data-indicativo="+230">Mauricio</option>
                <option value="Mauritania" data-indicativo="+222">Mauritania</option>
                <option value="México" data-indicativo="+52">México</option>
                <option value="Micronesia" data-indicativo="+691">Micronesia</option>
                <option value="Moldavia" data-indicativo="+373">Moldavia</option>
                <option value="Mónaco" data-indicativo="+377">Mónaco</option>
                <option value="Mongolia" data-indicativo="+976">Mongolia</option>
                <option value="Montenegro" data-indicativo="+382">Montenegro</option>
                <option value="Mozambique" data-indicativo="+258">Mozambique</option>
                <option value="Myanmar" data-indicativo="+95">Myanmar</option>
                <option value="Namibia" data-indicativo="+264">Namibia</option>
                <option value="Nauru" data-indicativo="+674">Nauru</option>
                <option value="Nepal" data-indicativo="+977">Nepal</option>
                <option value="Nicaragua" data-indicativo="+505">Nicaragua</option>
                <option value="Níger" data-indicativo="+227">Níger</option>
                <option value="Nigeria" data-indicativo="+234">Nigeria</option>
                <option value="Noruega" data-indicativo="+47">Noruega</option>
                <option value="Nueva Zelanda" data-indicativo="+64">Nueva Zelanda</option>
                <option value="Omán" data-indicativo="+968">Omán</option>
                <option value="Países Bajos" data-indicativo="+31">Países Bajos</option>
                <option value="Pakistán" data-indicativo="+92">Pakistán</option>
                <option value="Palaos" data-indicativo="+680">Palaos</option>
                <option value="Palestina" data-indicativo="+970">Palestina</option>
                <option value="Panamá" data-indicativo="+507">Panamá</option>
                <option value="Papúa Nueva Guinea" data-indicativo="+675">Papúa Nueva Guinea</option>
                <option value="Paraguay" data-indicativo="+595">Paraguay</option>
                <option value="Perú" data-indicativo="+51">Perú</option>
                <option value="Polonia" data-indicativo="+48">Polonia</option>
                <option value="Portugal" data-indicativo="+351">Portugal</option>
                <option value="Reino Unido" data-indicativo="+44">Reino Unido</option>
                <option value="República Centroafricana" data-indicativo="+236">República Centroafricana</option>
                <option value="República Checa" data-indicativo="+420">República Checa</option>
                <option value="República del Congo" data-indicativo="+242">República del Congo</option>
                <option value="República Democrática del Congo" data-indicativo="+243">República Democrática del Congo</option>
                <option value="República Dominicana" data-indicativo="+1-809">República Dominicana</option>
                <option value="Ruanda" data-indicativo="+250">Ruanda</option>
                <option value="Rumanía" data-indicativo="+40">Rumanía</option>
                <option value="Rusia" data-indicativo="+7">Rusia</option>
                <option value="Samoa" data-indicativo="+685">Samoa</option>
                <option value="San Cristóbal y Nieves" data-indicativo="+1-869">San Cristóbal y Nieves</option>
                <option value="San Marino" data-indicativo="+378">San Marino</option>
                <option value="San Vicente y las Granadinas" data-indicativo="+1-784">San Vicente y las Granadinas</option>
                <option value="Santa Lucía" data-indicativo="+1-758">Santa Lucía</option>
                <option value="Santo Tomé y Príncipe" data-indicativo="+239">Santo Tomé y Príncipe</option>
                <option value="Senegal" data-indicativo="+221">Senegal</option>
                <option value="Serbia" data-indicativo="+381">Serbia</option>
                <option value="Seychelles" data-indicativo="+248">Seychelles</option>
                <option value="Sierra Leona" data-indicativo="+232">Sierra Leona</option>
                <option value="Singapur" data-indicativo="+65">Singapur</option>
                <option value="Siria" data-indicativo="+963">Siria</option>
                <option value="Somalia" data-indicativo="+252">Somalia</option>
                <option value="Sri Lanka" data-indicativo="+94">Sri Lanka</option>
                <option value="Sudáfrica" data-indicativo="+27">Sudáfrica</option>
                <option value="Sudán" data-indicativo="+249">Sudán</option>
                <option value="Suecia" data-indicativo="+46">Suecia</option>
                <option value="Suiza" data-indicativo="+41">Suiza</option>
                <option value="Surinam" data-indicativo="+597">Surinam</option>
                <option value="Tailandia" data-indicativo="+66">Tailandia</option>
                <option value="Tanzania" data-indicativo="+255">Tanzania</option>
                <option value="Tayikistán" data-indicativo="+992">Tayikistán</option>
                <option value="Timor Oriental" data-indicativo="+670">Timor Oriental</option>
                <option value="Togo" data-indicativo="+228">Togo</option>
                <option value="Tonga" data-indicativo="+676">Tonga</option>
                <option value="Trinidad y Tobago" data-indicativo="+1-868">Trinidad y Tobago</option>
                <option value="Túnez" data-indicativo="+216">Túnez</option>
                <option value="Turkmenistán" data-indicativo="+993">Turkmenistán</option>
                <option value="Turquía" data-indicativo="+90">Turquía</option>
                <option value="Tuvalu" data-indicativo="+688">Tuvalu</option>
                <option value="Ucrania" data-indicativo="+380">Ucrania</option>
                <option value="Uganda" data-indicativo="+256">Uganda</option>
                <option value="Uruguay" data-indicativo="+598">Uruguay</option>
                <option value="Uzbekistán" data-indicativo="+998">Uzbekistán</option>
                <option value="Vanuatu" data-indicativo="+678">Vanuatu</option>
                <option value="Vaticano" data-indicativo="+39">Vaticano</option>
                <option value="Venezuela" data-indicativo="+58">Venezuela</option>
                <option value="Vietnam" data-indicativo="+84">Vietnam</option>
                <option value="Yemen" data-indicativo="+967">Yemen</option>
                <option value="Yibuti" data-indicativo="+253">Yibuti</option>
                <option value="Zambia" data-indicativo="+260">Zambia</option>
                <option value="Zimbabue" data-indicativo="+263">Zimbabue</option>
            </select>
            <label for="txt_paisResidencia" class="select2-label">País Residencia</label>
            <div class="invalid-feedback">
            </div>
        </div>
            
        <!-- Ciudad de residencia -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_ciudadResidencia" id="txt_ciudadResidencia" maxlength="44" data-length="44" class="campo-formulario" onkeyup="valida_txt_ciudadResidencia();" onclick="valida_txt_ciudadResidencia();" autocomplete="off">
            <label for="txt_ciudadResidencia" class="label-widget">Ciudad Residencia</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Indicativo país -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_indicativoPais" id="txt_indicativoPais" maxlength="44" data-length="44" class="campo-formulario" onkeyup="valida_txt_indicativoPais();" onclick="valida_txt_indicativoPais();" autocomplete="off">
            <label for="txt_indicativoPais" class="label-widget">Indicativo país</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Número de celular -->
        <div class="input-field col s12 m6 l4">
            <input type="text" name="txt_numeroCelular" id="txt_numeroCelular" maxlength="15" data-length="15" class="campo-formulario" onkeyup="valida_txt_numeroCelular();" onclick="valida_txt_numeroCelular();" autocomplete="off">
            <label for="txt_numeroCelular" class="label-widget">Número de celular</label>
            <div class="invalid-feedback"></div>
        </div>

        <!-- Correo electrónico -->
        <div class="input-field col s12 m6 l4">
            <input type="email" name="txt_correoElectronico" id="txt_correoElectronico" maxlength="44" data-length="44" class="campo-formulario" onkeyup="valida_txt_correoElectronico();" onclick="valida_txt_correoElectronico();" autocomplete="off">
            <label for="txt_correoElectronico" class="label-widget">Correo electrónico</label>
            <div class="invalid-feedback"></div>
        </div>

        <p class="tratamientoDatosArbol">
            <a href="#modalTerminos" class="form-link modal-trigger" id="enlaceTerminos">Leer términos y condiciones</a>
        </p>

        <label class="form-checkbox">
            <input type="checkbox" id="autorizacionDatosPersonales" name="autorizacionDatosPersonales" required>
            <span class="label-widget">Autorizo el tratamiento de mis datos personales</span>
        </label></br></br>

        <div class="center mt-2">
            <button id="btn_Continuar" class="btn waves-effect waves-light blue darken-1 mb-2">
                <i class="material-icons left">arrow_forward</i>Continuar
            </button>
        </div>
    </div>
</p>`;

// TODO: MENSAJE SOLICITANDO CONDICION DE ADJUNTOS
const condicionAdjuntos = `<p class="condicionAdjuntosArbol">📝 <b>Adjuntar documentos:</b> <br/><br/>
                            📢 <i>No es obligatorio.</i><br/><br/>
                            ⚠️ <i>Se permite un máximo de 5 archivos.</i><br/>
                            ⚠️ <i>Los documentos deben ser archivos tipo .pdf .xls .xlsx .jpg .png .doc .docx únicamente y no deben superar los 5 MB.</i><br/><br/>
                            1. Adjuntar documentos <br/>
                            2. Continuar.</p>`;

// TODO: MENSAJE DE CONFIRMAR ADJUNTOS
const confirmarAdjuntos = `<p class="confirmarAdjuntosArbol">📝 <b>Por favor, adjuntar los archivos.</b></p>`;

// TODO: MENSAJE DE ALERTA DE NO ENTIENDO
const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
                            ⚠️ <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i></p>`;
// // TODO: MENSAJE DE ALERTA DE NO ENTIENDO
// const alertaNoEntiendo = `<p class="alertaNoEntiendoArbol">❓ <b>No entiendo su respuesta.</b><br/><br/>
//                             ⚠️ <i>Por favor, asegúrese de seguir las instrucciones y proporcione una respuesta válida.</i><br/><br/>
//                             ⚠️ <i>En el momento que desee volver, por favor escriba <b>inicio</b> o <b>INICIO</b> para volver a empezar 🔄.</i></p>`;

// TODO: MENSAJE DE ALERTA DE ERROR API
const alertaErrorAPI = `<p class="alertaErrorAPIArbol">⏳ <b>Estamos experimentando una incidencia técnica.</b><br/><br/>
                            🙏 <i>Le pedimos que espere o nos visite nuevamente en breve mientras solucionamos el inconveniente; agradecemos su comprensión.</i></p>`;

// TODO: MENSAJE DE NOVEDAD O INCIDENCIA TECNICA
const novedadIncidenciaTecnica = `<p class="novedadIncidenciaTecnicaArbol">🚨 ¡Atención!<br/><br/>
                                🔄 Estamos experimentando una novedad o incidencia técnica.<br/>
                                🕰️ Por favor, intente nuevamente más tarde. Agradecemos su paciencia.</p>`;

// TODO: MENSAJE DE CLIENTE DESISTE
const clienteDesiste = `<p class="clienteDesisteArbol">⚠️ <b>Hemos notado que ha decidido no continuar con la atención en nuestro sistema.</b><br/><br/>
                           👉 <i>Si necesita asistencia no dude en contactarnos nuevamente.</i></p>`;

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
const responsable = 'ETB - IDARTES';

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
        despedida,
        instrucciones,
        solicitarFormularioInicial,
        condicionAdjuntos,
        confirmarAdjuntos,
        alertaNoEntiendo,
        alertaErrorAPI,
        novedadIncidenciaTecnica,
        clienteDesiste,
        chatDiferenteAbierto
    }
};