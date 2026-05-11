// @module config.js - Configuração global da aplicação

const CONFIG = {
    // URLs do backend (ajustar quando o backend estiver pronto)
    API_BASE_URL: 'http://localhost:8000/api/v1',
    WS_URL: 'ws://localhost:8000/ws',
    
    // Configurações de paginação
    MESSAGES_PER_PAGE: 50,
    
    // Configurações de criptografia
    CRYPTO: {
        PBKDF2_ITERATIONS: 310000,
        SALT_LENGTH: 16,
        IV_LENGTH: 12,
        KEY_ALGORITHM: 'ECDH-P384'
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}