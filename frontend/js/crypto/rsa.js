// Gerar par de chaves RSA no browser do utilizador
// A chave privada NUNCA sai do browser
async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        true,               // exportável (para guardar)
        ['encrypt', 'decrypt']
    );
    return keyPair;
    // keyPair.publicKey  → enviar para o servidor
    // keyPair.privateKey → guardar localmente via keystore.js
}

// Exportar chave pública para formato que o servidor guarda
async function exportPublicKey(publicKey) {
    const exported = await crypto.subtle.exportKey('spki', publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Importar chave pública de outro utilizador (vinda do servidor)
async function importPublicKey(base64Key) {
    const binary = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
        'spki', binary,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}

// Cifrar chave AES com chave pública RSA do destinatário
async function encryptAESKey(aesKey, recipientPublicKey) {
    const exportedAES = await crypto.subtle.exportKey('raw', aesKey);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        recipientPublicKey,
        exportedAES
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

// Decifrar chave AES com chave privada RSA própria
async function decryptAESKey(encryptedKeyBase64, privateKey) {
    const binary = Uint8Array.from(atob(encryptedKeyBase64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        binary
    );
    return await crypto.subtle.importKey(
        'raw', decrypted,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}
export {
    generateKeyPair,
    exportPublicKey,
    importPublicKey,
    encryptAESKey,
    decryptAESKey
};