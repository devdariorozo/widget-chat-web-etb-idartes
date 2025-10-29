// ! ================================================================================================================================================
// !                                                          HERAMIENTA DE CIFRADO Y DESCIFRADO DE DATOS
// ! ================================================================================================================================================
// @author Ramón Dario Rozo Torres (30 de Julio de 2024)
// @lastModified Ramón Dario Rozo Torres (30 de Julio de 2024)
// @version 1.0.0
// backend/v1/utils/cryptoData.js

// ! REQUIRES
const crypto = require('crypto');

// ! VARIABLES
// todo: Algoritmo de cifrado y descifrado
const algorithm = 'aes-256-cbc';
// todo: Clave secreta para el cifrado y descifrado de 32 bytes
const key = Buffer.from('WlRmZjBiZGxkZjRzNjZhZmRmNjA3MjBk', 'utf8');
// todo: Vector de inicialización para el cifrado y descifrado de 16 bytes
const iv = Buffer.from('1MzJjMWQyNWRjNG9', 'utf8');

// ! VALIDACIONES
if (key.length !== 32) {
    return console.log('❌ Error en backend/v1/utils/cryptoData → Ajustar key');
}
if (iv.length !== 16) {
    return console.log('❌ Error en backend/v1/utils/cryptoData → Ajustar iv');
}

// ! FUNCION PARA ENCRIPTAR DATOS
function encrypt(text) {
    // todo: Crear un objeto cipher para el cifrado
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // todo: Cifrar el texto
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // todo: Retornar el texto cifrado
    return encrypted;
}

// ! FUNCION PARA DESENCRIPTAR DATOS
function decrypt(encryptedText) {
    // todo: Crear un objeto decipher para el descifrado
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    // todo: Descifrar el texto
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    // todo: Retornar el texto descifrado
    return decrypted;
}

// ! EXPORTACIONES
module.exports = {
    encrypt,
    decrypt
};