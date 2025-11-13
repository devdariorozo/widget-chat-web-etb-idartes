// ! ================================================================================================================================================
// !                                                     HERRAMIENTA DE DESENCRIPTACIÓN VARIABLES DE ENTORNO
// ! ================================================================================================================================================
// @Autor: Ramón Dario Rozo Torres
// @Última Modificación: Dario Rozo
// @version 1.0.0
// v1/utils/decryptEnv.js

// ! REQUIRES
const fs = require('fs');
const path = require('path');
const { decrypt } = require('./cryptoData.js');

// ! FUNCIONES
// * FUNCIÓN PARA DESENCRIPTAR EL ARCHIVO .env
function decryptEnvFile() {
    try {
        console.log('========================================================================================');
        console.log('                           ♦♦♦ DESENCRIPTANDO ARCHIVO .env ♦♦♦');
        console.log('========================================================================================');

        // todo: Ruta al archivo .env
        const envPath = path.resolve(__dirname, '../.env');
        const envDecryptedPath = path.resolve(__dirname, '../.env.decrypted');

        // todo: Verificar si el archivo .env existe
        if (!fs.existsSync(envPath)) {
            console.log('❌ Error: El archivo .env no existe');
            console.log('📁 Buscando en:', envPath);
            return;
        }

        console.log('📁 Archivo .env encontrado en:', envPath);

        // todo: Leer el archivo .env línea por línea
        const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');

        // todo: Desencriptar los valores de las variables
        const decryptedEnvLines = envLines.map((line) => {
            // todo: Ignorar líneas que son comentarios o están vacías
            if (line.trim().startsWith('#') || line.trim() === '') {
                return line;
            }

            // todo: Desencriptar solo las líneas que contienen variables (formato KEY=VALUE)
            const [key, ...rest] = line.split('=');
            if (rest.length === 0) {
                return line;
            }

            // todo: Concatenar el valor de la variable
            const encryptedValue = rest.join('=');
            
            try {
                // todo: Intentar desencriptar el valor
                const decryptedValue = decrypt(encryptedValue.trim());
                return `${key}=${decryptedValue}`;
            } catch (error) {
                // todo: Si no se puede desencriptar, mantener el valor original
                console.log(`⚠️  No se pudo desencriptar ${key}, manteniendo valor original`);
                return line;
            }
        });

        // todo: Escribir el archivo .env.decrypted con las variables desencriptadas
        fs.writeFileSync(envDecryptedPath, decryptedEnvLines.join('\n'));

        console.log('✅ Archivo .env desencriptado creado exitosamente');
        console.log('📁 Ubicación:', envDecryptedPath);
        
        // todo: Mostrar los valores desencriptados
        console.log('\n📋 VALORES DESENCRIPTADOS:');
        console.log('========================================================================================');
        let variableCount = 0;
        decryptedEnvLines.forEach(line => {
            if (line.trim() && !line.trim().startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    console.log(`🔓 ${key}=${value}`);
                    variableCount++;
                }
            }
        });
        console.log('========================================================================================');
        console.log(`📊 Total de variables desencriptadas: ${variableCount}`);
        console.log('\n💡 Para usar estos valores sin encriptación:');
        console.log('   1. Copia el contenido de .env.decrypted a .env');
        console.log('   2. Modifica el código para remover las llamadas a decrypt()');
        console.log('   3. Usa directamente process.env.VARIABLE');
        console.log('========================================================================================');
        console.log('                           ♦♦♦ DESENCRIPTACIÓN COMPLETADA ♦♦♦');
        console.log('========================================================================================');

    } catch (error) {
        console.log('❌ Error al desencriptar el archivo .env:', error.message);
        console.log('🔍 Detalles del error:', error);
    }
}

// * EJECUTAR LA FUNCIÓN
decryptEnvFile(); 