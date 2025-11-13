// ! ================================================================================================================================================
// !                                                             APP JS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres
// @lastModified Ramón Dario Rozo Torres
// @version 1.0.0
// frontend/v1/assets/js/app.js

// ! FUNCIONES GLOBALES
// * HTML PARA NOTIFICACIONES
async function controlNotificaciones(type, title, message) {
    // todo: Variables
    // Variable para almacenar el html de las notificaciones
    let controlNotificacionesHTML = "";
    // Variable para almacenar el timer
    let timer;
    // Variable para almacenar la duración total en segundos
    const totalDuration = 3;
    // Variable para controlar el estado del mouse
    let isMouseOver = false;

    // todo: Parámetros de las notificaciones
    const parametrosNotificacion = {
        "error": {
            backgroundColor: "#FD000F",
            icon: "error",
            cardColor: "red accent-4",
        },
        "warning": {
            backgroundColor: "#f8cc6b",
            icon: "warning",
            cardColor: "amber accent-3",
        },
        "info": {
            backgroundColor: "#56c2d6",
            icon: "info_outline",
            cardColor: "blue accent-3",
        },
        "success": {
            backgroundColor: "#23b397",
            icon: "check",
            cardColor: "green accent-4",
        },
    };

    // todo: Configuración de las notificaciones
    const settings = parametrosNotificacion[type] || parametrosNotificacion["info"];

    // todo: HTML de las notificaciones
    controlNotificacionesHTML = `
        <div id="card-alert" class="card-alert card" style="border: none; display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden;">
            <div style="flex-shrink: 0; display: flex; width: 100%; align-items: center;">
                <img id="logo_sistemaNotificaciones" src="/images/imagen-corporativa/logo_sistema.png" alt="logo_sistema.png" class="responsive-img valign profile-image" style="margin-right: 8px;">
                <div class="card-content ${settings.cardColor}" style="flex-grow: 1; padding: 5px;">
                    <span id="notificaciones-titulo" class="card-title" style="display: flex; align-items: center;">
                        <i class="material-icons">${settings.icon}</i> ${title}
                    </span>
                    <p id="notificaciones-mensaje">${message}</p>
                </div>
                <button type="button" class="close dark-text" aria-label="Close" style="background: none; border: none;">
                    <span aria-hidden="true" style="font-size: 1.5rem;">&times;</span>
                </button>
            </div>
            <div id="progress-container" style="height: 4px; background-color: #00bcd4; width: 100%; position: relative;">
                <div id="progress-bar" style="height: 100%; background-color: gray; width: 0%; transition: width ${totalDuration}s linear;"></div>
            </div>
        </div>
    `;

    // todo: Insertar el html de las notificaciones
    document.querySelector(".controlNotificaciones").innerHTML = controlNotificacionesHTML;

    // todo: Botón para cerrar las notificaciones
    const closeButton = document.querySelector("#card-alert .close");

    // todo: Evento para cerrar las notificaciones
    closeButton.addEventListener("click", () => {
        const cardAlert = document.querySelector("#card-alert");
        if (cardAlert) {
            cardAlert.remove(); // Cerrar notificación
        }
    });

    // todo: Detener el temporizador
    function stopTimer() {
        // Detener
        clearTimeout(timer);
        // Asegurarse de que el temporizador esté completamente detenido
        timer = null;
        // Detener la animación
        const progressBar = document.querySelector("#progress-bar");
        progressBar.style.transition = 'none';
        // Reiniciar la barra de progreso
        progressBar.style.width = '0%';
    }

    // todo: Iniciar el temporizador
    function startTimer() {
        // Solo iniciar el temporizador si el mouse no está sobre la notificación
        if (!isMouseOver) {
            const progressBar = document.querySelector("#progress-bar");

            // Reiniciar la barra de progreso
            progressBar.style.transition = 'none';
            // Reiniciar la barra de progreso
            progressBar.style.width = '0%';

            // Forzar el reflujo para reiniciar la animación
            progressBar.offsetHeight;

            // Configurar la animación
            progressBar.style.transition = `width ${totalDuration}s linear`;
            // Llenar la barra completamente
            progressBar.style.width = '100%';

            timer = setTimeout(() => {
                // Verificar nuevamente antes de eliminar
                if (!isMouseOver) {
                    const cardAlert = document.querySelector("#card-alert");
                    if (cardAlert) {
                        // Eliminar la notificación después de 3 segundos
                        cardAlert.remove();
                    }
                }
            }, totalDuration * 1000); // Temporizador de 3 segundos
        }
    }

    // todo: Iniciar el temporizador cuando aparece la notificación
    startTimer();

    // todo: Evento para detener el temporizador cuando el mouse está sobre la notificación
    const cardAlert = document.querySelector("#card-alert");
    if (cardAlert) {
        cardAlert.addEventListener("mouseenter", () => {
            // Cambiar el estado cuando el mouse está sobre la notificación
            isMouseOver = true;
            // Detener el temporizador
            stopTimer();
        });
        cardAlert.addEventListener("mouseleave", () => {
            // Cambiar el estado cuando el mouse sale de la notificación
            isMouseOver = false;
            // Reiniciar el temporizador
            startTimer();
        });
    }
}

// * CONTROL VISUAL
// TODO: CONTROL VISUAL INICIAL
async function ctrl_inicialCampos() {
    let invalidFeedbackElements = document.querySelectorAll('.invalid-feedback');
    for (let i = 0; i < invalidFeedbackElements.length; i++) {
        invalidFeedbackElements[i].style.setProperty('display', 'none', 'important');
    }

    let elementos = document.querySelectorAll('.campo-formulario');
    for (let i = 0; i < elementos.length; i++) {
        elementos[i].style.setProperty('border-color', '#ced4da', 'important');
    }

    // Aplicar estilos a campos select2
    let select2Elements = document.querySelectorAll('.select2-hidden-accessible');
    for (let i = 0; i < select2Elements.length; i++) {
        const select2Container = select2Elements[i].parentElement.querySelector('.select2-container');
        if (select2Container) {
            select2Container.querySelector('.select2-selection').style.setProperty('border-color', '#ced4da', 'important');
        }
    }

    // Aplicar estilos a campos select normales
    let selectElements = document.querySelectorAll('select');
    for (let i = 0; i < selectElements.length; i++) {
        selectElements[i].style.setProperty('border-color', '#ced4da', 'important');
    }
}

// TODO: CONTROL INICIAL DE UN CAMPO EN ESPECÍFICO
async function ctrl_inicialCampo(campo) {
    // Obtener el elemento de retroalimentación
    const invalidFeedbackElement = campo.parentElement.querySelector('.invalid-feedback');
    invalidFeedbackElement.textContent = '';
    invalidFeedbackElement.style.display = 'none';

    // Aplicar el estilo inicial al campo
    campo.style.borderColor = "#ced4da";
}
// TODO: CONTROL VISUAL CAMPO INVALIDO
async function campoInvalido(campo, sms, mostrarIcono) {

    // Encuentra el elemento de retroalimentación
    const invalidFeedbackElement = campo.parentElement.querySelector('.invalid-feedback');
    invalidFeedbackElement.innerHTML = mostrarIcono ? '<i class="material-icons" style="vertical-align: bottom;">warning</i>' + sms : sms;
    invalidFeedbackElement.style.setProperty('display', 'block', 'important');

    // Verifica si es un select2
    if (campo.classList.contains('select2-hidden-accessible')) {
        // Encuentra el contenedor select2 y aplica el borde rojo
        const select2Container = campo.parentElement.querySelector('.select2-container');
        select2Container.querySelector('.select2-selection').style.setProperty('border-color', 'red', 'important');
    } else {
        // Aplica el borde rojo para campos de entrada normales
        campo.style.setProperty('border-color', 'red', 'important');
    }
}
// TODO: CONTROL VISUAL CAMPO VALIDO
async function campoValido(campo) {

    // Encuentra el elemento de retroalimentación
    const invalidFeedbackElement = campo.parentElement.querySelector('.invalid-feedback');
    invalidFeedbackElement.textContent = '';
    invalidFeedbackElement.style.setProperty('display', 'none', 'important');

    // Verifica si es un select2
    if (campo.classList.contains('select2-hidden-accessible')) {
        // Encuentra el contenedor select2 y aplica el borde válido
        const select2Container = campo.parentElement.querySelector('.select2-container');
        select2Container.querySelector('.select2-selection').style.setProperty('border-color', '#23b397', 'important');
    } else {
        // Aplica el borde válido para campos de entrada normales
        campo.style.setProperty('border-color', '#23b397', 'important');
    }
}

// TODO: FUNCION PARA MOSTRAR Y OCULTAR CONTRASEÑA
async function alternarVisibilidadContrasena(inputId, icon) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === 'password';
    
    // Alternar tipo de input
    input.type = isPassword ? 'text' : 'password';
    
    // Cambiar el icono
    icon.innerHTML = isPassword ? '<i class="material-icons">visibility_off</i>' : '<i class="material-icons">visibility</i>';
}

// TODO: FORMATEO VALORES A MILES
async function formatearNumeroMiles(number) {
    // Formatear el número a miles
    return number.toLocaleString('es-ES');
}

// TODO: CONTROL VISUAL CHECKBOX INVALIDO
async function checkboxInvalido(checkbox, sms) {
    // Encuentra el elemento de retroalimentación que está después del span
    const invalidFeedbackElement = checkbox.closest('.form-checkbox').querySelector('.invalid-feedback');
    if (invalidFeedbackElement) {
        invalidFeedbackElement.innerHTML = '<i class="material-icons" style="vertical-align: bottom;">warning</i>' + sms;
        invalidFeedbackElement.style.setProperty('display', 'block', 'important');
    }

    // Aplicar estilo al span que contiene el texto del checkbox
    const span = checkbox.nextElementSibling;
    if (span) {
        span.style.setProperty('color', 'red', 'important');
    }
}

// TODO: CONTROL VISUAL CHECKBOX VALIDO
async function checkboxValido(checkbox) {
    // Encuentra el elemento de retroalimentación que está después del span
    const invalidFeedbackElement = checkbox.closest('.form-checkbox').querySelector('.invalid-feedback');
    if (invalidFeedbackElement) {
        invalidFeedbackElement.textContent = '';
        invalidFeedbackElement.style.setProperty('display', 'none', 'important');
    }

    // Restaurar el color original del span
    const span = checkbox.nextElementSibling;
    if (span) {
        span.style.removeProperty('color');
    }
}
