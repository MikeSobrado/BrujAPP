// ==========================================
// API CONNECTION INITIALIZER - apicon.html
// ==========================================

console.log('[APICON] 🔄 Inicializando apicon.html...');

// ===== ESTADO DE CONEXIÓN =====
function updateConnectionStatus() {
    const apiKey = document.getElementById('bitget-api-key')?.value;
    const statusEl = document.getElementById('connection-status') || document.querySelector('[data-connection="status"]');
    
    if (statusEl) {
        if (apiKey) {
            statusEl.innerHTML = '🟢 Conectado';
            statusEl.style.color = '#00b894';
        } else {
            statusEl.innerHTML = '🔴 Desconectado';
            statusEl.style.color = '#d63031';
        }
    }
}

// ===== RETRY LOGIC =====
async function retryConnection(maxRetries = 3) {
    console.log('[APICON] Intentando reconectar...');
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            // Disponer botón de conectar
            const connectBtn = document.getElementById('btn-connect') || document.querySelector('[data-action="connect"]');
            if (connectBtn) {
                console.log('[APICON] Retry ' + (i + 1) + '/' + maxRetries + ': Botón de conectar disponible');
                updateConnectionStatus();
                return true;
            }
        } catch (error) {
            console.warn('[APICON] Retry ' + (i + 1) + ' fallido:', error.message);
        }
        
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.warn('[APICON] No se pudo conectar después de ' + maxRetries + ' intentos');
    return false;
}

// ===== EVENT LISTENERS FOR KEY MANAGEMENT =====
function initializeKeyManagementButtons() {
    console.log('[APICON] 🔧 Inicializando botones de gestión de claves...');
    
    const saveKeyBtn = document.getElementById('save-key-btn');
    const loadKeyBtn = document.getElementById('load-key-btn');
    
    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.handleSaveKey === 'function') {
                console.log('[APICON] 💾 Ejecutando handleSaveKey');
                window.handleSaveKey();
            } else {
                console.error('[APICON] ❌ handleSaveKey no disponible');
            }
        });
    }
    
    if (loadKeyBtn) {
        loadKeyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof window.handleLoadKey === 'function') {
                console.log('[APICON] 📂 Ejecutando handleLoadKey');
                window.handleLoadKey();
            } else {
                console.error('[APICON] ❌ handleLoadKey no disponible');
            }
        });
    }
}

// ===== FILE INPUT HANDLER =====
// Delegate to bitget-api.js handler - this function name is used in apicon-init.js
// but the actual implementation comes from bitget-api.js
function setupKeyFileInput() {
    console.log('[APICON] 🔧 Configurando cargador de claves API...');
    
    const fileInput = document.getElementById('key-file-input');
    if (!fileInput) {
        console.error('[APICON] ❌ key-file-input no encontrado');
        return;
    }
    
    // Clone to remove old listeners
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    // Add change listener for key file
    newFileInput.addEventListener('change', (e) => {
        console.log('[APICON] 📂 Archivo de clave seleccionado');
        const file = e.target.files[0];
        if (!file) {
            console.log('[APICON] ⚠️ No hay archivo');
            return;
        }
        
        const statusDiv = document.getElementById('key-status');
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const content = JSON.parse(event.target.result);
                
                // Check if encrypted
                if (content.encrypted && content.version === 2) {
                    console.log('[APICON] 🔐 Archivo cifrado detectado');
                    
                    const password = prompt('🔐 Este archivo está cifrado. Ingresa la contraseña:', '');
                    if (!password) {
                        console.log('[APICON] ⚠️ Cancelado por usuario');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>⚠️ Cancelado</div>';
                            statusDiv.style.display = 'block';
                        }
                        return;
                    }
                    
                    try {
                        const decryptedStr = CryptoJS.AES.decrypt(content.data, password).toString(CryptoJS.enc.Utf8);
                        if (!decryptedStr) {
                            throw new Error('Contraseña incorrecta');
                        }
                        
                        const decryptedData = JSON.parse(decryptedStr);
                        if (!decryptedData.bitget) {
                            alert('❌ Datos descifrados pero sin información de Bitget');
                            return;
                        }
                        
                        // Fill fields
                        document.getElementById('bitget-api-key').value = decryptedData.bitget.apiKey || '';
                        document.getElementById('bitget-api-secret').value = decryptedData.bitget.apiSecret || '';
                        document.getElementById('bitget-passphrase').value = decryptedData.bitget.passphrase || '';
                        document.getElementById('bitget-sandbox').value = decryptedData.bitget.sandbox ? 'true' : 'false';
                        document.getElementById('coinmarketcap-api-key').value = decryptedData.coinmarketcap?.apiKey || '';
                        
                        console.log('[APICON] ✅ Llave descifrada y cargada');
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Llave descifrada correctamente</div>';
                            statusDiv.style.display = 'block';
                        }
                    } catch (decryptError) {
                        console.error('[APICON] ❌ Error descifrar:', decryptError);
                        alert('❌ Error: ' + decryptError.message);
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error al descifrar</div>';
                            statusDiv.style.display = 'block';
                        }
                    }
                } else if (!content.encrypted) {
                    // Unencrypted file
                    if (!content.bitget) {
                        alert('❌ Archivo inválido');
                        return;
                    }
                    
                    document.getElementById('bitget-api-key').value = content.bitget.apiKey || '';
                    document.getElementById('bitget-api-secret').value = content.bitget.apiSecret || '';
                    document.getElementById('bitget-passphrase').value = content.bitget.passphrase || '';
                    document.getElementById('bitget-sandbox').value = content.bitget.sandbox ? 'true' : 'false';
                    document.getElementById('coinmarketcap-api-key').value = content.coinmarketcap?.apiKey || '';
                    
                    console.log('[APICON] ✅ Llave cargada (sin cifrar)');
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-success"><i class="bi bi-check-circle me-2"></i>✅ Llave cargada</div>';
                        statusDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('[APICON] ❌ Error:', error);
                alert('❌ Error: ' + error.message);
            }
            newFileInput.value = '';
        };
        
        reader.readAsText(file);
    });
}

// ===== MAIN INITIALIZATION =====
console.log('[APICON] Iniciando secuencia de activación...');

// Esperar a que el DOM esté completamente listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[APICON] DOM listo, inicializando...');
        initializeKeyManagementButtons();
        setupKeyFileInput();
        updateConnectionStatus();
        retryConnection(3);
    });
} else {
    console.log('[APICON] DOM ya cargado, inicializando inmediatamente...');
    initializeKeyManagementButtons();
    setupKeyFileInput();
    updateConnectionStatus();
    retryConnection(3);
}

// Escuchar cambios en los campos de credenciales
['bitget-api-key', 'bitget-secret', 'bitget-passphrase'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('change', updateConnectionStatus);
    }
});

// ===== BOTÓN PROBAR COINMARKETCAP =====
function initializeTestCMCButton() {
    console.log('[APICON] 🔧 Inicializando botón de prueba CoinMarketCap...');
    
    const testBtn = document.getElementById('test-cmc-btn');
    if (!testBtn) {
        console.warn('[APICON] ⚠️ test-cmc-btn no encontrado, reintentando en 500ms...');
        setTimeout(initializeTestCMCButton, 500);
        return;
    }
    
    testBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log('[APICON] 🧪 Botón Probar CoinMarketCap clickeado');
        
        const cmcKeyInput = document.getElementById('coinmarketcap-api-key');
        const cmcKey = cmcKeyInput ? cmcKeyInput.value.trim() : '';
        const statusDiv = document.getElementById('coinmarketcap-status');
        
        if (!cmcKey) {
            console.warn('[APICON] ⚠️ API Key de CoinMarketCap no ingresada');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>⚠️ Ingresa tu API Key de CoinMarketCap primero</div>';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        testBtn.disabled = true;
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass-split me-2"></i>Probando conexión a CoinMarketCap...</div>';
            statusDiv.style.display = 'block';
        }
        
        try {
            console.log('[APICON] 🧪 Llamando a testCoinMarketCapConnection...');
            
            if (!window.testCoinMarketCapConnection) {
                throw new Error('testCoinMarketCapConnection no disponible');
            }
            
            const result = await window.testCoinMarketCapConnection(cmcKey);
            console.log('[APICON] 📊 Resultado de prueba:', result);
            
            if (result.success) {
                console.log('[APICON] ✅ Conexión exitosa a CoinMarketCap');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle me-2"></i><strong>✅ Conectado a CoinMarketCap</strong>
                            <br><small>
                                <i class="bi bi-coin me-1"></i><strong>Bitcoin:</strong> ${result.dominance.btc}%
                                <br><i class="bi bi-circle me-1"></i><strong>Ethereum:</strong> ${result.dominance.eth}%
                                <br><i class="bi bi-collection me-1"></i><strong>Otros:</strong> ${result.dominance.others}%
                                <br><i class="bi bi-hourglass-end me-1"></i><small>Respuesta en ${result.duration}ms</small>
                            </small>
                        </div>
                    `;
                    statusDiv.style.display = 'block';
                }
                
                // 🧹 Limpiar campo de CMC después de conexión exitosa
                console.log('[APICON] 🧹 Limpiando campo de CMC API Key...');
                setTimeout(() => {
                    if (cmcKeyInput) {
                        cmcKeyInput.value = '';
                        console.log('[APICON] ✅ Campo de CMC limpiado');
                    }
                }, 0);
            } else {
                console.error('[APICON] ❌ Error en prueba:', result.message);
                if (statusDiv) {
                    let detailsHtml = `
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-circle me-2"></i><strong>❌ Error de conexión</strong>
                            <br><small>${result.message}</small>
                    `;
                    
                    // Mostrar detalles del formato de la API Key
                    if (result.keyFormat) {
                        detailsHtml += `
                            <br><br><strong>Formato detectado:</strong>
                            <ul style="margin-bottom: 0; margin-top: 5px; font-size: 0.85em;">
                                <li><strong>Tipo:</strong> ${result.keyFormat.format}</li>
                                <li><strong>Longitud:</strong> ${result.keyFormat.length} caracteres</li>
                                <li><strong>Estructura:</strong> ${result.keyFormat.structure}</li>
                                <li><strong>Patrón esperado:</strong> ${result.keyFormat.pattern}</li>
                            </ul>
                        `;
                    }
                    
                    detailsHtml += `</div>`;
                    statusDiv.innerHTML = detailsHtml;
                    statusDiv.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('[APICON] ❌ Error:', error);
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-circle me-2"></i><strong>❌ Error en la prueba</strong>
                        <br><small>${error.message}</small>
                    </div>
                `;
                statusDiv.style.display = 'block';
            }
        } finally {
            testBtn.disabled = false;
        }
    });
    
    console.log('[APICON] ✅ Botón Probar CoinMarketCap inicializado');
}

// Inicializar el botón cuando el documento esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTestCMCButton);
} else {
    initializeTestCMCButton();
}

console.log('[APICON] ✅ Script apicon.html cargado');
