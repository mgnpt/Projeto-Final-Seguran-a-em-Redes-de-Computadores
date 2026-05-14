// Gerar chave AES para uma conversa
async function generateAESKey() {
    return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Cifrar mensagem antes de enviar
async function encryptMessage(plaintext, aesKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoded
    );
    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

// Decifrar mensagem recebida
async function decryptMessage(ciphertextBase64, ivBase64, aesKey) {
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

// Cifrar ficheiro (recebe ArrayBuffer)
async function encryptFile(arrayBuffer, aesKey) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        arrayBuffer
    );
    return { ciphertext, iv };
}
export {
    generateAESKey,
    encryptMessage,
    decryptMessage
};