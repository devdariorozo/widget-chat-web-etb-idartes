// ! ================================================================================================================================================
// !                                                     HERRAMIENTA DE ENCRIPTACIÓN VARIABLES DE ENTORNO
// ! ================================================================================================================================================
// @Autor: Ramón Dario Rozo Torres (30 de Julio de 2024)
// @Última Modificación: Ramón Dario Rozo Torres (30 de Julio de 2024)
// @version 1.0.0
// frontend/v1/utils/cryptoEnv.js

// ! REQUIRES
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const moment = require('moment');
const { encrypt } = require('./cryptoData.js');

// ! CONFIGURACIONES
// * CONFIGURACIÓN DE MOMENT A ESPAÑOL
moment.locale('es');

// ! FUNCIONES
// * FUNCIÓN PARA FORMATEAR LA FECHA EN EL FORMATO REQUERIDO
function formatDate(date) {

    // todo: Formatear la fecha usando Moment.js
    const formattedDate = moment(date).format('DD [de] MMMM [de] YYYY');

    // todo: Convertir la primera letra del mes a mayúscula
    return formattedDate.replace(/ de ([a-z])/g, (match, p1) => ` de ${p1.toUpperCase()}`);
}

// * CREAR LA INTERFAZ PARA LEER LA ENTRADA DEL USUARIO
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// * FUNCIÓN PARA VALIDAR EL NOMBRE
function validateName(name) {

    // todo: Separar el nombre en partes
    const parts = name.trim().split(' ');

    // todo: Validar que el nombre tenga al menos dos partes
    if (parts.length < 2) {
        return false;
    }
    for (const part of parts) {
        if (part.length <= 3) {
            return false;
        }
    }
    return true;
}

// * FUNCIÓN PARA CAPITALIZAR LA PRIMERA LETRA DE CADA PALABRA
function capitalizeName(name) {
    // todo: Capitalizar la primera letra de cada palabra y convertir el resto a minúscula, retornar el resultado
    return name.split(' ').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
}

// * FUNCIÓN PARA SOLICITAR EL NOMBRE AL USUARIO Y VALIDAR LA ENTRADA
function requestName() {
    // todo: Solicitar el nombre al usuario
    rl.question('⚠️  Ingrese por favor Nombres y Apellidos: ', (name) => {
        // todo: Validar el nombre
        if (!validateName(name)) {
            console.log('📝 Debe ingresar Nombres y Apellidos completos.');
            // todo: Volver a solicitar el nombre
            requestName();
        } else {
            // todo: Capitalizar la primera letra de cada palabra y convertir el resto a minúscula
            const capitalizedName = capitalizeName(name);
            const date = new Date();
            const formattedDate = formatDate(date);
            const modificationLine = `# @Última Modificación: ${capitalizedName} (${formattedDate})`;

            // todo: Ruta al archivo .env
            const envPath = path.resolve(__dirname, '../.env');

            // todo: Verificar si el archivo .env existe
            if (!fs.existsSync(envPath)) {
                console.log('❌ Error en frontend/v1/utils/cryptoEnv → Por favor haz una copia del archivo .env.example y renómbralo a .env');
                rl.close();
                process.exit(1);
            }

            // todo: Leer el archivo .env línea por línea
            const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');

            // todo: Variable para verificar si se ha encontrado la línea de última modificación
            let lastModificationFound = false;

            // todo: Actualizar la línea de última modificación y encriptar los valores de las variables
            const updatedEnvLines = envLines.map((line) => {
                // todo: Actualizar la línea de última modificación
                if (line.trim().startsWith('# @Última Modificación:')) {
                    lastModificationFound = true;
                    return modificationLine;
                }

                // todo: Ignorar líneas que son comentarios o están vacías
                if (line.trim().startsWith('#') || line.trim() === '') {
                    return line;
                }

                // todo: Encriptar solo las líneas que contienen variables (formato KEY=VALUE)
                const [key, ...rest] = line.split('=');
                if (rest.length === 0) {
                    return line;
                }

                // todo: Concatenar el valor de la variable
                const value = rest.join('=');
                const encryptedValue = encrypt(value.trim());

                // todo: Retornar la línea con la variable encriptada
                return `${key}=${encryptedValue}`;
            });

            // todo: Si no se encontró la línea de última modificación, agregarla al final
            if (!lastModificationFound) {
                updatedEnvLines.push(modificationLine);
            }

            // todo: Escribir el archivo .env con las variables encriptadas y la línea de última modificación actualizada
            fs.writeFileSync(envPath, updatedEnvLines.join('\n'));

            console.log('✅ .env del frontend listo.');
            rl.close();
            process.exit(0);
        }
    });
}

// * INICIAR EL PROCESO SOLICITANDO EL NOMBRE
requestName();