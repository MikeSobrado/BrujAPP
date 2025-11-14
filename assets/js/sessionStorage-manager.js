/**
 * Módulo para cifrar/descifrar datos en sessionStorage
 * Usa AES con CryptoJS para seguridad
 */

const SessionStorageManager = (() => {
    // Clave de cifrado derivada de la sesión (se genera al conectarse a la API)
    let encryptionKey = null;

    /**
     * Generar una clave de cifrado para la sesión
     * Se genera al conectarse a la API basándose en la contraseña del usuario
     */
    function generateEncryptionKey(password) {
        // Usar la contraseña para derivar una clave consistente para esta sesión
        encryptionKey = CryptoJS.SHA256(password + Math.random()).toString();
        return encryptionKey;
    }

    /**
     * Establecer la clave de cifrado (llamada después de conectarse)
     */
    function setEncryptionKey(key) {
        encryptionKey = key;
    }

    /**
     * Obtener la clave de cifrado actual
     */
    function getEncryptionKey() {
        return encryptionKey;
    }

    /**
     * Cifrar un objeto y guardarlo en sessionStorage
     * @param {string} key - Clave del sessionStorage
     * @param {object} data - Datos a cifrar
     */
    function saveEncrypted(key, data) {
        if (!encryptionKey) {
            console.warn('SessionStorageManager: No encryption key set');
            return false;
        }

        try {
            const jsonString = JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, encryptionKey).toString();
            sessionStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            console.error('SessionStorageManager: Error saving encrypted data:', error);
            return false;
        }
    }

    /**
     * Descifrar y cargar datos de sessionStorage
     * @param {string} key - Clave del sessionStorage
     * @returns {object|null} Datos descifrados o null si no existen
     */
    function loadEncrypted(key) {
        if (!encryptionKey) {
            console.warn('SessionStorageManager: No encryption key set');
            return null;
        }

        try {
            const encrypted = sessionStorage.getItem(key);
            if (!encrypted) {
                return null;
            }

            const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
                console.warn('SessionStorageManager: Failed to decrypt data for key:', key);
                return null;
            }

            return JSON.parse(decrypted);
        } catch (error) {
            console.error('SessionStorageManager: Error loading encrypted data:', error);
            return null;
        }
    }

    /**
     * Guardar posiciones cifradas
     * @param {array} positions - Array de posiciones
     */
    function savePositions(positions) {
        return saveEncrypted('bitget_positions', positions);
    }

    /**
     * Cargar posiciones descifradas
     * @returns {array|null} Array de posiciones o null
     */
    function loadPositions() {
        return loadEncrypted('bitget_positions');
    }

    /**
     * Guardar datos de gráficas cifrados
     * @param {object} chartsData - Datos de las gráficas
     */
    function saveChartsData(chartsData) {
        return saveEncrypted('charts_data', chartsData);
    }

    /**
     * Cargar datos de gráficas descifrados
     * @returns {object|null} Datos de gráficas o null
     */
    function loadChartsData() {
        return loadEncrypted('charts_data');
    }

    /**
     * Limpiar todos los datos cifrados de sessionStorage
     */
    function clearAll() {
        try {
            sessionStorage.removeItem('bitget_positions');
            sessionStorage.removeItem('charts_data');
            return true;
        } catch (error) {
            console.error('SessionStorageManager: Error clearing data:', error);
            return false;
        }
    }

    /**
     * Verificar si hay datos en sessionStorage
     */
    function hasData() {
        return sessionStorage.getItem('bitget_positions') !== null ||
               sessionStorage.getItem('charts_data') !== null;
    }

    return {
        generateEncryptionKey,
        setEncryptionKey,
        getEncryptionKey,
        saveEncrypted,
        loadEncrypted,
        savePositions,
        loadPositions,
        saveChartsData,
        loadChartsData,
        clearAll,
        hasData
    };
})();
