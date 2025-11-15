// bitget-api.js - Gestión de API de Bitget

console.log('📜 bitget-api.js cargándose...');
console.log('🔐 CryptoJS disponible:', typeof CryptoJS !== 'undefined');

// Inicializar inmediatamente si CryptoJS está disponible
if (typeof CryptoJS !== 'undefined') {
    console.log('✅ CryptoJS disponible, inicializando BitgetAPI...');
    initBitgetAPI();
} else {
    console.warn('⚠️ CryptoJS no está disponible aún, esperando...');
    // Si CryptoJS no está disponible, esperar a DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOMContentLoaded - reintentando inicializar...');
            if (typeof CryptoJS !== 'undefined') {
                initBitgetAPI();
            } else {
                console.error('❌ CryptoJS no disponible ni siquiera en DOMContentLoaded');
            }
        });
    } else {
        setTimeout(() => {
            console.log('⏱️ Timeout - reintentando inicializar...');
            if (typeof CryptoJS !== 'undefined') {
                initBitgetAPI();
            } else {
                console.error('❌ CryptoJS no disponible incluso después del timeout');
            }
        }, 100);
    }
}

function initBitgetAPI() {
    if (typeof CryptoJS === 'undefined') {
        console.error('❌ CryptoJS no disponible');
        return;
    }

    console.log('🔄 Inicializando BitgetAPI...');
    
    // Limpiar credenciales antiguas de localStorage (si las hay)
    localStorage.removeItem('bitget_credentials');
    console.log('🧹 Eliminadas credenciales antiguas de localStorage (si había)');

    window.currentPositions = [];
    window.BitgetAPIReady = false;

    class BitgetAPIManager {
        constructor() {
            this.credentials = this.loadCredentials();
            // Proxy en Render: /api/bitget
            // En desarrollo local: http://localhost:3000/api/bitget
            // En producción: https://trading-dome-dashboard.onrender.com/api/bitget
            this.proxyEndpoint = this.getProxyEndpoint();
            this.apiVersion = '/api/v2';
            console.log('🔌 BitgetAPIManager inicializado');
            console.log('   - Proxy Endpoint:', this.proxyEndpoint);
            console.log('   - Credenciales cargadas:', !!this.credentials);
            if (this.credentials) {
                console.log('   - Credenciales:', {
                    apiKey: this.credentials.apiKey ? '***' : 'FALTA',
                    apiSecret: this.credentials.apiSecret ? '***' : 'FALTA',
                    passphrase: this.credentials.passphrase ? '***' : 'FALTA'
                });
            }
        }

        getProxyEndpoint() {
            // Detectar si está en desarrollo o producción
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return 'http://localhost:3000/api/bitget';
            }
            // En producción (GitHub Pages), usar URL del backend de Render
            return 'https://trading-dome-dashboard.onrender.com/api/bitget';
        }

        loadCredentials() {
            // NO cargar desde localStorage
            // Las credenciales solo existen en memoria durante la sesión actual
            console.log('📭 Sin credenciales guardadas (sesión nueva)');
            return null;
        }

        saveCredentials(k, s, p, sb) {
            try {
                const creds = { apiKey: k, apiSecret: s, passphrase: p, sandbox: sb, savedAt: new Date().toISOString() };
                
                // NO guardar en localStorage - solo en memoria para esta sesión
                this.credentials = creds;
                
                console.log('✅ Credenciales guardadas en memoria (sesión actual)');
                console.log('⚠️ Las credenciales se limpiarán al cerrar la página');
                
                // Limpiar credenciales antiguas de localStorage
                localStorage.removeItem('bitget_credentials');
                console.log('🧹 Eliminadas credenciales antiguas de localStorage');
                
                // Generar clave de cifrado para sessionStorage
                const sessionKey = CryptoJS.SHA256(k + s + p).toString();
                if (typeof SessionStorageManager !== 'undefined') {
                    SessionStorageManager.setEncryptionKey(sessionKey);
                }
                
                return true;
            } catch (e) {
                console.error('❌ Error al guardar credenciales:', e.message);
                return false; 
            }
        }

        clearCredentials() {
            localStorage.removeItem('bitget_credentials');
            if (typeof SessionStorageManager !== 'undefined') {
                SessionStorageManager.clearAll();
            }
            this.credentials = null;
            return true;
        }

        generateSignature(ts, m, p, b) {
            const s = ts + m + p + b;
            return CryptoJS.HmacSHA256(s, this.credentials.apiSecret).toString(CryptoJS.enc.Base64);
        }

        getAuthHeaders(m, p, b) {
            const ts = Date.now().toString();
            const sig = this.generateSignature(ts, m, p, b);
            return {
                'ACCESS-KEY': this.credentials.apiKey,
                'ACCESS-SIGN': sig,
                'ACCESS-TIMESTAMP': ts,
                'ACCESS-PASSPHRASE': this.credentials.passphrase
            };
        }

        async testConnection() {
            if (!this.credentials) throw new Error('Sin credenciales');
            try {
                // Usar endpoint de información de cuenta para probar conexión
                const path = '/api/v2/account/info';
                
                const res = await fetch(this.proxyEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: this.credentials.apiKey,
                        apiSecret: this.credentials.apiSecret,
                        apiPassphrase: this.credentials.passphrase,
                        method: 'GET',
                        path: path,
                        params: {},
                        body: ''
                    })
                });
                
                if (!res.ok) {
                    const error = await res.json().catch(() => ({}));
                    throw new Error(`Conexión fallida: ${res.status} ${error.message || error.error || 'Unknown error'}`);
                }
                return true;
            } catch (e) {
                console.error('❌ Error en testConnection:', e);
                throw e;
            }
        }

        async getAllOrders(limit = 50) {
        if (!this.credentials) throw new Error('Sin credenciales');
        try {
            // Endpoint correcto de Bitget v2: Historial de posiciones
            // GET /api/v2/mix/position/history-position
            // Parámetros obligatorios: productType (USDT-FUTURES o COIN-FUTURES)
            const path = '/api/v2/mix/position/history-position';
            const params = { productType: 'USDT-FUTURES', limit };
            console.log('🔗 Conectando al proxy:', this.proxyEndpoint);
            console.log('📝 Enviando datos:', {
                apiKey: '***',
                apiSecret: '***',
                apiPassphrase: '***',
                method: 'GET',
                path: path,
                params: params
            });

            const requestBody = {
                apiKey: this.credentials.apiKey,
                apiSecret: this.credentials.apiSecret,
                apiPassphrase: this.credentials.passphrase,
                method: 'GET',
                path: path,
                params: params,
                body: ''
            };

            const res = await fetch(this.proxyEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                console.error(`❌ Error HTTP ${res.status}:`, error);
                throw new Error(`Error obteniendo posiciones: ${res.status} ${error.message || error.error || 'Unknown'}`);
            }

            const data = await res.json();
            console.log('📊 Respuesta de posiciones (bruto):', data);
            console.log('📊 data.data:', data?.data, '| tipo:', typeof data?.data);
            
            // Bitget devuelve: { code, msg, data: {...} }
            // El array puede estar en diferentes ubicaciones
            let positions = [];
            
            if (Array.isArray(data)) {
                // Si ya es un array directamente
                positions = data;
                console.log('✅ Caso 1: Respuesta es array directo -', positions.length, 'posiciones');
            } else if (Array.isArray(data?.data)) {
                // Si data.data es un array
                positions = data.data;
                console.log('✅ Caso 2: data.data es array -', positions.length, 'posiciones');
            } else if (Array.isArray(data?.data?.positions)) {
                // Si las posiciones están dentro de data.data.positions
                positions = data.data.positions;
                console.log('✅ Caso 3: data.data.positions es array -', positions.length, 'posiciones');
            } else if (typeof data?.data === 'object' && data?.data !== null) {
                // Si data.data es un objeto, buscar dentro de él qué es un array
                console.log('⚠️ data.data es un objeto. Inspeccionando estructura...');
                const dataObj = data.data;
                
                // Buscar cualquier propiedad que sea un array
                for (const [key, value] of Object.entries(dataObj)) {
                    if (Array.isArray(value)) {
                        console.log(`✅ Encontrado array en data.data.${key} -`, value.length, 'elementos');
                        positions = value;
                        break;
                    }
                }
                
                // Si no encontramos un array dentro, asumir que data.data ES el resultado
                if (positions.length === 0) {
                    console.warn('⚠️ No se encontró array dentro de data.data, devolviendo vacío');
                    positions = [];
                }
            } else {
                console.warn('⚠️ No se encontró array de posiciones en la respuesta:', data);
                positions = [];
            }
            
            return positions;
        } catch (e) {
            console.error('❌ Error en getAllOrders:', e);
            throw e;
        }
    }

            // Alias para obtener posiciones (mismo que getAllOrders pero más descriptivo)
            async getPositionHistory(limit = 50) {
                return this.getAllOrders(limit);
            }
        }

        window.BitgetAPI = new BitgetAPIManager();
        window.BitgetAPIReady = true;
        console.log('✅ BitgetAPI ready');
    }

// Función directa para manejar el click en el botón Crear Llave
window.handleSaveKey = function() {
    console.log('💾 handleSaveKey ejecutada');
    
    const apiKey = document.getElementById('bitget-api-key').value.trim();
    const apiSecret = document.getElementById('bitget-api-secret').value.trim();
    const passphrase = document.getElementById('bitget-passphrase').value.trim();
    const coinmarketcapKey = document.getElementById('cmc-api-key').value.trim();
    const sandbox = document.getElementById('bitget-sandbox').value;
    
    const statusDiv = document.getElementById('key-status');
    
    if (!apiKey || !apiSecret || !passphrase) {
        alert('Completa todos los campos de Bitget (son obligatorios para guardar)');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>Completa todos los campos de Bitget</div>';
            statusDiv.style.display = 'block';
        }
        return;
    }
    
    // Pedir nombre del archivo
    const fileName = prompt('Ingresa el nombre de la llave (sin .json):', 'mi-llave');
    if (!fileName) {
        console.log('⚠️ Guardado cancelado por el usuario');
        return;
    }
    
    // Pedir contraseña para cifrar
    const password = prompt('🔐 Ingresa una contraseña para proteger la llave (la necesitarás para cargarla):', '');
    if (!password) {
        console.log('⚠️ Guardado cancelado: sin contraseña');
        alert('Debes ingresar una contraseña para proteger la llave');
        return;
    }
    
    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    try {
        // Crear objeto con las credenciales
        const keyData = {
            bitget: {
                apiKey: apiKey,
                apiSecret: apiSecret,
                passphrase: passphrase,
                sandbox: sandbox === 'true'
            },
            coinmarketcap: {
                apiKey: coinmarketcapKey || ''
            },
            savedAt: new Date().toISOString()
        };
        
        // Cifrar los datos
        const dataStr = JSON.stringify(keyData);
        const encrypted = CryptoJS.AES.encrypt(dataStr, password).toString();
        
        // Crear objeto con datos cifrados (metadata FUERA del cifrado)
        const encryptedData = {
            data: encrypted,
            timestamp: new Date().toISOString(),
            version: 2,
            encrypted: true
        };
        
        // Convertir a JSON y crear un Blob
        const encryptedStr = JSON.stringify(encryptedData, null, 2);
        const dataBlob = new Blob([encryptedStr], { type: 'application/json' });
        
        // Crear URL y simular descarga con nombre personalizado
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.json`;
        
        console.log('📥 Iniciando descarga de llave cifrada:', link.download);
        console.log('🔐 Datos cifrados con AES');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Esperar un poco antes de revocar para asegurar que se descarga
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ Llave guardada y descargada correctamente (cifrada)');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Descargando archivo cifrado: <strong>' + fileName + '.json</strong><br><small>🔐 Protegido con contraseña | Revisa tu carpeta de Descargas</small></div>';
            statusDiv.style.display = 'block';
        }
    } catch (e) {
        console.error('❌ Error al guardar llave:', e);
        alert('Error al guardar llave: ' + e.message);
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error al guardar llave: ' + e.message + '</div>';
            statusDiv.style.display = 'block';
        }
    }
};

// Función directa para manejar el click en el botón Cargar Llave
window.handleLoadKey = function() {
    console.log('📁 handleLoadKey ejecutada');
    const fileInput = document.getElementById('key-file-input');
    if (!fileInput) {
        console.error('❌ Input de archivo no encontrado');
        alert('Error: elemento de archivo no encontrado');
        return;
    }
    fileInput.click();
};

// Inicializar el manejador de carga de archivos
window.initializeFileInputHandler = function() {
    console.log('🔧 Inicializando manejador de carga de archivos');
    const fileInput = document.getElementById('key-file-input');
    if (!fileInput) {
        console.error('❌ Input de archivo no encontrado');
        return;
    }
    
    // Remover listeners anteriores para evitar duplicados
    fileInput.replaceWith(fileInput.cloneNode(true));
    const newFileInput = document.getElementById('key-file-input');
    
    newFileInput.addEventListener('change', (e) => {
        console.log('📂 Archivo seleccionado');
        const file = e.target.files[0];
        if (!file) {
            console.log('⚠️ No hay archivo seleccionado');
            return;
        }
        
        const statusDiv = document.getElementById('key-status');
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const content = JSON.parse(event.target.result);
                
                // Verificar si el archivo está cifrado (versión 2)
                if (content.encrypted && content.version === 2) {
                    console.log('🔐 Archivo cifrado detectado, pidiendo contraseña...');
                    
                    // Pedir contraseña
                    const password = prompt('🔐 Este archivo está cifrado. Ingresa la contraseña para descifrarlo:', '');
                    if (!password) {
                        console.log('⚠️ Carga cancelada: sin contraseña');
                        alert('Debes ingresar la contraseña para cargar la llave cifrada');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>⚠️ Carga cancelada</div>';
                            statusDiv.style.display = 'block';
                        }
                        return;
                    }
                    
                    try {
                        // Intentar descifrar
                        const decryptedStr = CryptoJS.AES.decrypt(content.data, password).toString(CryptoJS.enc.Utf8);
                        
                        if (!decryptedStr) {
                            throw new Error('Contraseña incorrecta o archivo corrupto');
                        }
                        
                        const decryptedData = JSON.parse(decryptedStr);
                        
                        if (!decryptedData.bitget) {
                            alert('❌ Datos descifrados pero no contienen información de Bitget');
                            if (statusDiv) {
                                statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Archivo inválido después de descifrar</div>';
                                statusDiv.style.display = 'block';
                            }
                            return;
                        }
                        
                        // Llenar los campos con los datos descifrados
                        document.getElementById('bitget-api-key').value = decryptedData.bitget.apiKey || '';
                        document.getElementById('bitget-api-secret').value = decryptedData.bitget.apiSecret || '';
                        document.getElementById('bitget-passphrase').value = decryptedData.bitget.passphrase || '';
                        document.getElementById('bitget-sandbox').value = decryptedData.bitget.sandbox ? 'true' : 'false';
                        document.getElementById('cmc-api-key').value = decryptedData.coinmarketcap?.apiKey || '';
                        
                        console.log('✅ Llave descifrada y cargada correctamente');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Llave descifrada correctamente. Los campos se han rellenado.<br><small class="mt-2 d-block">Ahora puedes hacer clic en <strong>"Conectar"</strong> para acceder a tu cuenta</small></div>';
                            statusDiv.style.display = 'block';
                        }
                    } catch (decryptError) {
                        console.error('❌ Error al descifrar:', decryptError);
                        alert('❌ Error al descifrar: ' + decryptError.message + '\n\n¿Es la contraseña correcta?');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error al descifrar: contraseña incorrecta</div>';
                            statusDiv.style.display = 'block';
                        }
                    }
                } else if (!content.encrypted && (!content.version || content.version === 1)) {
                    // Archivo sin cifrar (versión antigua)
                    console.log('📄 Archivo sin cifrar (formato antiguo)');
                    
                    if (!content.bitget) {
                        alert('❌ Archivo inválido: no contiene datos de Bitget');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Archivo inválido</div>';
                            statusDiv.style.display = 'block';
                        }
                        return;
                    }
                    
                    // Llenar los campos con los datos del archivo
                    document.getElementById('bitget-api-key').value = content.bitget.apiKey || '';
                    document.getElementById('bitget-api-secret').value = content.bitget.apiSecret || '';
                    document.getElementById('bitget-passphrase').value = content.bitget.passphrase || '';
                    document.getElementById('bitget-sandbox').value = content.bitget.sandbox ? 'true' : 'false';
                    document.getElementById('cmc-api-key').value = content.coinmarketcap?.apiKey || '';
                    
                    console.log('⚠️ Llave cargada pero sin cifrar. Considera guardarla de nuevo con cifrado.');
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Llave cargada (sin cifrar). Los campos se han rellenado.<br><small class="mt-2 d-block">Ahora puedes hacer clic en <strong>"Conectar"</strong> para acceder a tu cuenta</small></div>';
                        statusDiv.style.display = 'block';
                    }
                } else {
                    alert('❌ Formato de archivo no reconocido');
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Archivo con formato no reconocido</div>';
                        statusDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('❌ Error al leer el archivo:', error);
                alert('❌ Error al leer el archivo JSON: ' + error.message);
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error al leer el archivo: ' + error.message + '</div>';
                    statusDiv.style.display = 'block';
                }
            }
            // Limpiar el input para permitir cargar el mismo archivo nuevamente
            newFileInput.value = '';
        };
        
        reader.readAsText(file);
    });
};

// Cuando se selecciona un archivo, procesarlo (para inicialización en DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded - inicializando handlers de archivo y botones...');
    
    // Reintentar hasta que encontremos los elementos
    function initializeAllHandlers() {
        const fileInput = document.getElementById('key-file-input');
        const saveBtn = document.getElementById('save-key-btn');
        const connectBtn = document.getElementById('connect-btn');
        
        if (fileInput && saveBtn && connectBtn) {
            console.log('✅ Todos los elementos encontrados, inicializando...');
            window.initializeFileInputHandler();
            return true;
        } else {
            console.log('⏳ Esperando elementos del DOM... (file:' + !!fileInput + ', save:' + !!saveBtn + ', connect:' + !!connectBtn + ')');
            return false;
        }
    }
    
    // Intentar inmediatamente
    if (!initializeAllHandlers()) {
        // Si falla, reintentar cada 300ms durante 10 segundos
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (initializeAllHandlers()) {
                clearInterval(interval);
            } else if (attempts > 33) { // 33 * 300ms = ~10 segundos
                console.error('❌ No se encontraron elementos después de 10 segundos');
                clearInterval(interval);
            }
        }, 300);
    }
});

// Inicializar el botón Guardar Llave cuando apicon.html se carga
window.initializeSaveKey = function() {
    console.log('🔧 initializeSaveKey llamada');
    const saveBtn = document.getElementById('save-key-btn');
    console.log('🔍 saveBtn encontrado:', !!saveBtn);
    if (!saveBtn) {
        console.warn('⚠️ Botón Guardar Llave no encontrado en el DOM, esperando...');
        setTimeout(() => {
            console.log('🔄 Reintentando initializeSaveKey...');
            window.initializeSaveKey();
        }, 500);
        return;
    }
    
    console.log('✅ Evento ya está en el HTML (onclick)');
    
    // Inicializar también el manejador de carga de archivos
    console.log('🔧 Inicializando manejador de archivos...');
    window.initializeFileInputHandler();
};

// Inicializar el botón Conectar cuando apicon.html se carga
window.initializeConnectButton = function() {
    console.log('🔧 initializeConnectButton llamada');
    const connectBtn = document.getElementById('connect-btn');
    console.log('🔍 connectBtn encontrado:', !!connectBtn);
    if (!connectBtn) {
        console.warn('⚠️ Botón Conectar no encontrado en el DOM, esperando...');
        setTimeout(() => {
            console.log('🔄 Reintentando initializeConnectButton...');
            window.initializeConnectButton();
        }, 500);
        return;
    }
    
    console.log('✅ Asignando evento al botón Conectar');
    
    connectBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log('🔗 Botón Conectar clickeado');
        console.log('🔗 Event:', event);
        
        // Debug: verificar que los inputs existen
        const apiKeyInput = document.getElementById('bitget-api-key');
        const apiSecretInput = document.getElementById('bitget-api-secret');
        const passphraseInput = document.getElementById('bitget-passphrase');
        
        console.log('🔍 Inputs encontrados:', {
            apiKey: !!apiKeyInput,
            apiSecret: !!apiSecretInput,
            passphrase: !!passphraseInput
        });
        
        if (!apiKeyInput || !apiSecretInput || !passphraseInput) {
            console.error('❌ Inputs no encontrados en el DOM');
            return;
        }
        
        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();
        const passphrase = passphraseInput.value.trim();
        
        console.log('📝 Campos leídos:', {
            apiKey: apiKey ? '✓' : '✗',
            apiSecret: apiSecret ? '✓' : '✗',
            passphrase: passphrase ? '✓' : '✗'
        });
        
        if (!apiKey || !apiSecret || !passphrase) {
            console.error('❌ Faltan campos obligatorios');
            const statusDiv = document.getElementById('key-status');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>Completa todos los campos de Bitget</div>';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        connectBtn.disabled = true;
        const statusDiv = document.getElementById('key-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass-split me-2"></i>Conectando...</div>';
            statusDiv.style.display = 'block';
        }
        
        try {
            console.log('🔍 Verificando BitgetAPI:', !!window.BitgetAPI);
            if (!window.BitgetAPI) {
                console.error('❌ BitgetAPI no disponible');
                const statusDiv = document.getElementById('key-status');
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>BitgetAPI no disponible</div>';
                    statusDiv.style.display = 'block';
                }
                connectBtn.disabled = false;
                return;
            }
            
            console.log('💾 Guardando credenciales...');
            if (window.BitgetAPI.saveCredentials(apiKey, apiSecret, passphrase)) {
                console.log('✅ Credenciales guardadas, cargando posiciones...');
                try {
                    const positions = await window.BitgetAPI.getAllOrders(500);
                    console.log('📊 Posiciones cargadas:', positions.length);
                    if (window.cache) {
                        window.cache.set('bitget_positions', positions);
                    }
                    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
                        SessionStorageManager.savePositions(positions);
                    }
                    window.displayPositions(positions);
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Conectado: ' + positions.length + ' posiciones cargadas</div>';
                        statusDiv.style.display = 'block';
                    }
                    
                    // 🧹 Limpiar campos SIEMPRE después de éxito (sin depender de statusDiv)
                    console.log('🧹 Limpiando campos de entrada después de conexión exitosa...');
                    
                    // Usar setTimeout para asegurar que se ejecuta después de todos los updates
                    setTimeout(() => {
                        try {
                            apiKeyInput.value = '';
                            apiSecretInput.value = '';
                            passphraseInput.value = '';
                            console.log('✅ Campos vaciados inmediatamente');
                        } catch (cleanErr) {
                            console.warn('⚠️ No se pudieron limpiar todos los campos:', cleanErr.message);
                            // Intentar limpiar individualmente con seguridad
                            if (apiKeyInput && apiKeyInput.value) apiKeyInput.value = '';
                            if (apiSecretInput && apiSecretInput.value) apiSecretInput.value = '';
                            if (passphraseInput && passphraseInput.value) passphraseInput.value = '';
                            console.log('✅ Campos limpiados (con try individual)');
                        }
                    }, 0); // setTimeout con 0ms ejecuta en el siguiente tick del event loop
                    
                } catch (error) {
                    console.error('❌ Error al cargar posiciones:', error);
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>⚠️ Credenciales guardadas pero error al cargar datos: ' + error.message + '</div>';
                        statusDiv.style.display = 'block';
                    }
                    console.warn('⚠️ Error al cargar posiciones:', error);
                }
            } else {
                console.error('❌ Error al guardar credenciales');
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error al guardar credenciales</div>';
                    statusDiv.style.display = 'block';
                }
            }
        } catch (e) {
            console.error('❌ Error general:', e);
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error de conexión: ' + e.message + '</div>';
                statusDiv.style.display = 'block';
            }
            console.error('❌ Error:', e);
        }
        
        connectBtn.disabled = false;
    });
};

window.displayPositions = function(positions) {
    console.log('🔍 displayPositions llamada con', positions?.length || 0, 'posiciones');
    
    // Guardar posiciones en variable global para acceso posterior
    window.currentPositions = positions;
    
    // 🔑 IMPORTANTE: Resetear los flags de componentes para forzar recarga si fue logout previo
    const historialDynamic = document.getElementById('posiciones-historial-dynamic');
    const statsDynamic = document.getElementById('posiciones-stats-dynamic');
    
    if (historialDynamic && historialDynamic.dataset.loaded) {
        // El componente ya estaba cargado, resetear para forzar recarga
        console.log('🔄 Reseteando flag de historial para reconexión...');
        historialDynamic.dataset.loaded = '';
    }
    
    if (statsDynamic && statsDynamic.dataset.loaded) {
        // El componente ya estaba cargado, resetear para forzar recarga
        console.log('🔄 Reseteando flag de estadísticas para reconexión...');
        statsDynamic.dataset.loaded = '';
    }
    
    // Intentar encontrar el contenedor
    let container = document.getElementById('positions-container');
    
    // Si el contenedor directo no existe, buscar en el componente dinámico
    if (!container) {
        if (historialDynamic && historialDynamic.innerHTML) {
            // El componente ya está cargado, buscar el contenedor dentro
            container = historialDynamic.querySelector('#positions-container');
        }
    }
    
    if (!container) {
        console.log('ℹ️ Contenedor positions-container no disponible aún. Posiciones guardadas en memoria.');
        console.log('ℹ️ Se mostrarán cuando se cargue la pestaña de Posiciones.');
        
        // 🔑 Si estamos actualmente en la pestaña de Posiciones, forzar recarga de componentes
        const posicionesTab = document.getElementById('posiciones');
        if (posicionesTab && posicionesTab.classList.contains('show')) {
            console.log('ℹ️ Usuario está en pestaña de Posiciones, forzando recarga de componentes...');
            // Esperar un poco y luego forzar recarga
            setTimeout(() => {
                if (typeof window.showPosiciones === 'function') {
                    // Esto recargará los componentes
                    window.showPosiciones();
                }
            }, 100);
        }
        
        return;
    }
    
    // Si llegamos aquí, el contenedor existe, así que mostramos las posiciones
    console.log('✅ Contenedor encontrado, renderizando datos...');
    
    // 🔄 Delegar a bitget-positions.js para renderizado
    if (typeof window.renderPositionsTable === 'function') {
        window.renderPositionsTable(positions, container);
    } else {
        console.warn('⚠️ window.renderPositionsTable no disponible - bitget-positions.js no cargó');
    }
    
    // 📊 También renderizar estadísticas si el contenedor está disponible
    const statsContainer = document.getElementById('posiciones-stats-container');
    if (statsContainer) {
        console.log('📊 Renderizando estadísticas...');
        if (typeof window.renderPositionsStats === 'function') {
            window.renderPositionsStats(positions);
        } else {
            console.warn('⚠️ window.renderPositionsStats no disponible - bitget-positions.js no cargó');
        }
    }
    
    // � Disparar evento personalizado para componentes que escuchen
    window.dispatchEvent(new CustomEvent('posiciones-updated', { detail: { positions: positions } }));
    console.log('📡 Evento "posiciones-updated" disparado');
    
    if (typeof window.loadAndDisplayPositions === 'function') {
        console.log('🔄 Disparando recarga en componente posiciones-historial...');
        window.loadAndDisplayPositions();
    }
};

// =====================================================
// NOTA: Las funciones de renderizado (renderPositionsTable, renderPositionsStats)
// y sincronización (loadAndDisplayPositions, loadAndDisplayStats) se han movido a
// bitget-positions.js para mejor separación de responsabilidades.
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Loaded - verificando estado...');
    console.log('🔗 BitgetAPIReady:', window.BitgetAPIReady);
    console.log('🔐 CryptoJS disponible:', typeof CryptoJS !== 'undefined');
    
    // Si BitgetAPI no está listo, intentar inicializar ahora
    if (!window.BitgetAPIReady && typeof CryptoJS !== 'undefined') {
        console.log('⚠️ BitgetAPI no estaba listo, inicializando ahora...');
        initBitgetAPI();
    }
    
    console.log('ℹ️ Autoload deshabilitado - esperando credenciales del usuario');
});
