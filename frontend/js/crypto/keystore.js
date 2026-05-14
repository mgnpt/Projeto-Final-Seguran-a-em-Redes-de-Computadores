// Guarda a chave privada RSA no IndexedDB do browser
// Nunca sobe ao servidor

const DB_NAME = 'securechat-keys';
const DB_VERSION = 1;
const STORE_NAME = 'private-keys';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = () => reject(req.error);
    });
}

async function savePrivateKey(userUuid, privateKey) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(privateKey, userUuid);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

async function loadPrivateKey(userUuid) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(userUuid);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function deletePrivateKey(userUuid) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(userUuid);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}