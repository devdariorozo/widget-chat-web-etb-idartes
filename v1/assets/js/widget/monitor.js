// ! ================================================================================================================================================
// !                                                      JS PARA MONITOR CHATS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (14 de Marzo de 2025)
// @lastModified Ramón Dario Rozo Torres (14 de Marzo de 2025)
// @version 1.0.0
// v1/assets/js/widget/monitor.js

// ! VARIABLES GLOBALES
let sms_preload = ``;

// ! LEER DOCUMENTO
document.addEventListener('DOMContentLoaded', async () => {

    // * INICIALIZAR PRELOAD
    let sms_preload = `
        <div class="progress">
            <div class="indeterminate">
                
            </div>
        </div>
        <p class="center-align"><strong>Se está consultando la información en el sistema.<br />Por favor espere...</strong></p>
    `;
    document.getElementById("content_preload").innerHTML = sms_preload;
    document.getElementById('content_form').classList.add('hide');
    document.getElementById('content_preload').classList.remove('hide');

    // * LISTAS SELECCIONABLES
    // todo: listar opciones control api
    // ? envio peticion al servidor y manejo respuesta
    try {
        const response = await fetch("/widget/chat/opcionesControlApi", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();


        // todo: Si el status es 401
        if (result.status === 401) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/401';
        }

        // todo: Si el status es 403
        if (result.status === 403) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/403';
        }

        // todo: Si el status es 404
        if (result.status === 404) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/404';
        }

        // todo: Si el status es 500
        if (result.status === 500) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/500';
        }

        // todo: si el status es 200
        if (result.status === 200) {
            // Paso las opciones al select
            if (result.data.length) {
                // limpio las opciones
                while (document.getElementById('txt_controlApi').options.length > 2) {
                    document.getElementById('txt_controlApi').remove(document.getElementById('txt_controlApi').options.length - 2);
                }
                // Paso las opciones al select
                for (const item of result.data) {
                    const option = document.createElement('option');
                    option.value = item.OPCION_CONTROL_API;
                    option.textContent = item.OPCION_CONTROL_API;
                    document.getElementById('txt_controlApi').appendChild(option);
                }
            }
        }
    } catch (error) {
        // todo: notificamos
        controlNotificaciones('error', 'Thomas Greg y Sons - IDC Exterior Chatbot', 'Error al listar las opciones de control API, por favor inténtelo de nuevo y/o comuníquese con nosotros.');
    }

    // * CONFIGURACION DATATABLE CON PAGUINACION EN EL SERVIDOR
    $("#tablaMonitorChats").DataTable({
        serverSide: true, // Habilita la paginación del lado del servidor
        ajax: function (data, callback) {
            listarRegistros(data, callback); // Llama a la función para listar registros
        },
        responsive: true,
        pageLength: 100, // Registros por página
        ordering: false,
        searching: false,
        columns: [
            { data: "ID_CHAT" }, //0
            { data: "FECHA_REGISTRO" }, //1
            { data: "TIPO" }, //2
            { data: "REMITENTE" }, //3
            { data: "ESTADO" }, //4
            { data: "GESTION" }, //5
            { data: "ARBOL" }, //6
            { data: "CONTROL_API" }, //7
            { data: "CONTROL_PETICIONES" }, //8
            { data: "RESULTADO_API" }, //9
            { data: "NOMBRES" }, //10
            { data: "APELLIDOS" }, //11
            { data: "NUMERO_CEDULA" }, //12
            { data: "PAIS_RESIDENCIA" }, //13
            { data: "CIUDAD_RESIDENCIA" }, //14
            { data: "INDICATIVO_PAIS" }, //15
            { data: "NUMERO_CELULAR" }, //16
            { data: "CORREO_ELECTRONICO" }, //17
            { data: "AUTORIZACION_DATOS_PERSONALES" }, //18
            { data: "ADJUNTOS" }, //19
            { data: "RUTA_ADJUNTOS" }, //20
            { data: "DESCRIPCION" }, //21
            { data: "REGISTRO" }, //22
            { data: "FECHA_ACTUALIZACION" }, //23
            { data: "RESPONSABLE" } //24
        ],
        columnDefs: [
            {
                targets: [2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], // Condiciono las columnas apiladas
                className: 'none'
            },
        ],
        dom: "rtipB", // Configuración de botones y controles
        buttons: [
            {
                extend: 'copyHtml5',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                    modifier: {
                        page: 'all'  // Exportar todos los registros
                    }
                },
                charset: 'utf-8'
            },
            {
                extend: 'excelHtml5',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                    modifier: {
                        page: 'all' // Exportar todos los registros
                    }
                },
                filename: 'Reporte Widget Thomas Greg y Sons',
                charset: 'utf-8'
            },
            {
                extend: 'csvHtml5',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                    modifier: {
                        page: 'all' // Exportar todos los registros
                    }
                },
                bom: true,
                filename: 'Reporte Widget Thomas Greg y Sons',
                charset: 'utf-8'
            },
            {
                extend: 'csvHtml5',
                text: 'TXT',
                fieldSeparator: '|',
                fieldBoundary: '',
                extension: '.txt',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                    modifier: {
                        page: 'all' // Exportar todos los registros
                    }
                },
                bom: true,
                filename: 'Reporte Widget Thomas Greg y Sons',
                charset: 'utf-8'
            }
        ],
        language: {
            lengthMenu: "Mostrar _MENU_ registros",
            zeroRecords: "No se encontraron resultados",
            info: "Mostrando del _START_ al _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando del 0 al 0 de 0 registros",
            infoFiltered: "(Filtrado de _MAX_ registros)",
            sSearch: "Buscar",
            oPaginate: {
                sFirst: "Primero",
                sLast: "Ultimo",
                sNext: "Siguiente",
                sPrevious: "Anterior",
            },
        },
        drawCallback: function () {
            $(".dataTables_paginate > .pagination").addClass("pagination-rounded");
        },
        scrollX: true,  // Habilita desplazamiento horizontal
        scrollY: '32vh', // Ajusta la altura del área visible con desplazamiento vertical
        scrollCollapse: true, // Ajusta la tabla al contenedor
        fixedHeader: true, // Mantén fija la cabecera cuando se desplace hacia abajo
    });


    // * MOSTAR FORMULARIO Y OCULTAR PRELOAD CUANDO LA TABLA ESTE LISTA
    $("#tablaMonitorChats").on('xhr.dt', function () {
        // Oculto Preload
        document.getElementById('content_form').classList.remove('hide');
        document.getElementById('content_preload').classList.add('hide');
        // Notificamos
        controlNotificaciones('success', 'Thomas Greg y Sons - IDC Exterior Chatbot', 'Se listaron correctamente los registros en el sistema.');
    });


    // * LISTAR REGISTROS
    document.getElementById('btn_Buscar').addEventListener('click', async () => {
        // todo: alerta de confirmacion
        swal.fire({
            position: 'center',
            title: 'Thomas Greg y Sons - IDC Exterior Chatbot',
            html: `<i class="fas fa-hand-point-right"></i> Monitorear Chats?`,
            icon: 'info',
            showCancelButton: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si",
            cancelButtonText: "No",
        }).then(async (result) => {
            if (result.isConfirmed === true) {
                // todo: inicializo preload
                document.getElementById("content_preload").innerHTML = sms_preload;

                // todo: oculto formulario y muestro preload
                document.getElementById('content_form').classList.add('hide');
                document.getElementById('content_preload').classList.remove('hide');

                // todo: notificamos
                controlNotificaciones('info', 'Thomas Greg y Sons - IDC Exterior Chatbot', 'Consultando registros, por favor espere...');

                // todo: blindeje de campos
                if (document.getElementById('txt_fechaInicial').value && document.getElementById('txt_fechaFinal').value && document.getElementById('txt_controlApi').value) {

                    // ? llamar funcion listar registros
                    $('#tablaMonitorChats').DataTable().ajax.reload(); // Actualiza la tabla con los nuevos filtros
                } else {
                    // todo: validacion campos
                    valida_txt_fechaInicial();
                    valida_txt_fechaFinal();
                    valida_txt_controlApi();
                    // todo: oculto preload y muestro formulario
                    document.getElementById('content_preload').classList.add('hide');
                    document.getElementById('content_form').classList.remove('hide');
                    // todo: notificamos
                    controlNotificaciones('warning', 'Thomas Greg y Sons - IDC Exterior Chatbot', 'Tienes campos incorrectos en el formulario...');
                    return;
                }

            }
        });
    });

    // * INICIALIZAR DATEPICKER
    let elems = document.querySelectorAll('.datepicker');
    let instances = M.Datepicker.init(elems, {
        format: 'dd/mm/yyyy',
        i18n: {
            cancel: 'Cancelar',
            clear: 'Limpiar',
            done: 'Aceptar',
            months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
            weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
            weekdaysAbbrev: ['D', 'L', 'M', 'M', 'J', 'V', 'S']
        }
    });

    // * VALIDACION CAMPOS SELECT2
    // todo: validacion campo control API
    $('#txt_controlApi').select2({
        allowClear: true,
        language: 'es'
    }).on("select2:open", function () {
        $('#txt_controlApi').siblings('.select2-label').removeClass('active-ok').addClass('active');
        valida_txt_controlApi();
    }).on("select2:close", function () {
        valida_txt_controlApi();
        if ($('#txt_controlApi').val()) {
            $('#txt_controlApi').siblings('.select2-label').removeClass('active').addClass('active-ok');
        } else {
            $('#txt_controlApi').siblings('.select2-label').removeClass('active');
        }
    });
});

// ! FUNCION PARA LISTAR REGISTROS
// * LISTAR REGISTROS
async function listarRegistros(data, callback) {
    try {
        // todo: oculto formulario y muestro preload
        document.getElementById('content_form').classList.add('hide');
        document.getElementById('content_preload').classList.remove('hide');

        // todo: obtengo valores de los campos
        let txt_fechaInicial = document.getElementById('txt_fechaInicial').value ? document.getElementById('txt_fechaInicial').value + ' 00:00:00' : '-';
        let txt_fechaFinal = document.getElementById('txt_fechaFinal').value ? document.getElementById('txt_fechaFinal').value + ' 23:59:59' : '-';
        let txt_controlApi = document.getElementById('txt_controlApi').value || '*';

        // todo: formateo las fechas a formato yyyy-mm-dd hh:mm:ss si son diferentes a -
        if (txt_fechaInicial !== '-') {
            const [day, month, year] = txt_fechaInicial.split(' ')[0].split('/');
            const dateStr = `${year}-${month}-${day}T00:00:00`;
            if (!isNaN(Date.parse(dateStr))) {
                txt_fechaInicial = new Date(dateStr).toISOString().slice(0, 19).replace('T', ' ');
            }
        }

        if (txt_fechaFinal !== '-') {
            const [day, month, year] = txt_fechaFinal.split(' ')[0].split('/');
            const dateStr = `${year}-${month}-${day}T23:59:59`;
            if (!isNaN(Date.parse(dateStr))) {
                txt_fechaFinal = new Date(dateStr).toISOString().slice(0, 19).replace('T', ' ');
            }
        }

        // todo: envio peticion al servidor y manejo respuesta
        const response = await fetch("/widget/chat/monitor", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fechaInicial: txt_fechaInicial,
                fechaFinal: txt_fechaFinal,
                opcionControlApi: txt_controlApi,
                numeroLimite: data.length,
                numeroDesplazamiento: data.start
            })
        });

        const result = await response.json();

        // todo: oculto preload y muestro formulario
        document.getElementById('content_form').classList.remove('hide');
        document.getElementById('content_preload').classList.add('hide');


        // todo: Si el status es 401
        if (result.status === 401) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/401';
        }

        // todo: Si el status es 403
        if (result.status === 403) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/403';
        }

        // todo: Si el status es 404
        if (result.status === 404) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/404';
        }

        // todo: Si el status es 500
        if (result.status === 500) {
            // Redireccionamos a la página de error
            window.location.href = '/server/estado/500';
        }

        // todo: Si el status es 200
        if (result.status === 200) {
            // todo: envio respuesta al datatable
            callback({
                draw: data.draw,
                recordsTotal: result.totalCount,
                recordsFiltered: result.filteredCount,
                data: result.data
            });

            // todo: actualizo los contadores
            document.getElementById('total_registros').textContent = await formatearNumeroMiles(result.totalCount);
            document.getElementById('total_success').textContent = await formatearNumeroMiles(result.data.filter(item => item.CONTROL_API === 'Success').length);
            document.getElementById('total_error').textContent = await formatearNumeroMiles(result.data.filter(item => item.CONTROL_API === 'Error').length);
        } else {
            // todo: notificamos
            controlNotificaciones('warning', 'Thomas Greg y Sons - IDC Exterior Chatbot', result.message);

            // todo: Llamamos las funciones de validación
            valida_txt_fechaInicial();
            valida_txt_fechaFinal();
            valida_txt_controlApi();
        }
    } catch (error) {
        // todo: notificamos
        controlNotificaciones('error', 'Thomas Greg y Sons - IDC Exterior Chatbot', 'Error al listar los registros, por favor inténtelo de nuevo y/o comuníquese con nosotros.');
    }
}



// ! VALIDACION CAMPOS Y CONTROL VISUAL FORMULARIO
// * VALIDACION CAMPOS
// todo: validacion campo fecha inicial
async function valida_txt_fechaInicial() {
    const txt_fechaInicial = document.getElementById('txt_fechaInicial');
    const txt_fechaInicial_value = txt_fechaInicial.value.trim();

    // Expresión regular para validar el formato dd/mm/yyyy
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = txt_fechaInicial_value.match(regex);

    if (!txt_fechaInicial_value) {
        campoInvalido(txt_fechaInicial, 'Por favor complete este campo...', true);
    } else if (!match) {
        campoInvalido(txt_fechaInicial, 'Este valor no es valido...', true);
    } else {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Verificar si la fecha es válida
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            campoValido(txt_fechaInicial);
        } else {
            campoInvalido(txt_fechaInicial, 'Este valor no es valido...', true);
        }
    }
}

// todo: validacion campo fecha final
async function valida_txt_fechaFinal() {
    const txt_fechaFinal = document.getElementById('txt_fechaFinal');
    const txt_fechaFinal_value = txt_fechaFinal.value.trim();
    const txt_fechaInicial_value = document.getElementById('txt_fechaInicial').value.trim();

    // Expresión regular para validar el formato dd/mm/yyyy
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = txt_fechaFinal_value.match(regex);

    if (!txt_fechaInicial_value) {
        campoInvalido(txt_fechaFinal, 'Por favor primero seleccione una fecha inicial...', true);
        txt_fechaFinal.value = '';
    } else if (!txt_fechaFinal_value) {
        campoInvalido(txt_fechaFinal, 'Por favor complete este campo...', true);
    } else if (!match) {
        campoInvalido(txt_fechaFinal, 'Este valor no es valido...', true);
    } else {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Verificar si la fecha es válida
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            // Convertir la fecha inicial a un objeto Date
            const [dayInicial, monthInicial, yearInicial] = txt_fechaInicial_value.split('/').map(Number);
            const fechaInicial = new Date(yearInicial, monthInicial - 1, dayInicial);

            if (date < fechaInicial) {
                campoInvalido(txt_fechaFinal, 'La fecha final no puede ser menor que la fecha inicial...', true);
                txt_fechaFinal.value = '';
            } else {
                campoValido(txt_fechaFinal);
            }
        } else {
            campoInvalido(txt_fechaFinal, 'Este valor no es valido...', true);
        }
    }
}

// todo: validacion campo control API
async function valida_txt_controlApi() {
    const txt_controlApi = document.getElementById('txt_controlApi');
    const txt_controlApi_value = txt_controlApi.value.trim();

    if (!txt_controlApi_value) {
        campoInvalido(txt_controlApi, 'Por favor complete este campo...', true);
    } else if (txt_controlApi_value.length < 1 || txt_controlApi_value.length > 44) {
        campoInvalido(txt_controlApi, 'Este valor no es valido...', true);
    } else {
        campoValido(txt_controlApi);
    }
}