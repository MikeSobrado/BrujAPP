/**
 * button-handlers.js
 * Manejador centralizado de eventos de botones usando event delegation
 * Se carga al final para capturar botones cargados dinámicamente
 */

console.log('🔘 button-handlers.js cargándose...');

// Event delegation en document para capturar clicks en botones sin importar cuándo se carguen
document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a[role="button"]');
    
    if (!target) return;
    
    const buttonId = target.id;
    const buttonText = target.textContent.toLowerCase();
    
    // 🚫 EXCLUIR botón CMC - tiene su propio handler en apicon-init.js
    if (buttonId === 'cmc-connect-btn') {
        console.log('🔘 Botón CMC excluido de delegación, tiene handler independiente');
        return;
    }
    
    // Botón: Crear Llave
    if (buttonId === 'save-key-btn' || buttonText.includes('crear llave')) {
        console.log('🔘 Click en botón Crear Llave (delegación)');
        e.preventDefault();
        if (typeof window.handleSaveKey === 'function') {
            window.handleSaveKey();
        } else {
            console.error('❌ handleSaveKey no está disponible');
        }
    }
    
    // Botón: Cargar Llave
    if (buttonId === 'load-key-btn' || buttonText.includes('cargar llave')) {
        console.log('🔘 Click en botón Cargar Llave (delegación)');
        e.preventDefault();
        if (typeof window.handleLoadKey === 'function') {
            window.handleLoadKey();
        } else {
            console.error('❌ handleLoadKey no está disponible');
        }
    }
    
    // Botón: Conectar (SOLO para Bitget - ID debe ser exactamente 'connect-btn')
    if (buttonId === 'connect-btn') {
        console.log('🔘 Click en botón Conectar Bitget (delegación)');
        e.preventDefault();
        
        // Disparar la lógica de conexión desde bitget-api.js
        const apiKeyInput = document.getElementById('bitget-api-key');
        const apiSecretInput = document.getElementById('bitget-api-secret');
        const passphraseInput = document.getElementById('bitget-passphrase');
        
        if (!apiKeyInput || !apiSecretInput || !passphraseInput) {
            console.error('❌ Inputs de API no encontrados');
            return;
        }
        
        const apiKey = apiKeyInput.value.trim();
        const apiSecret = apiSecretInput.value.trim();
        const passphrase = passphraseInput.value.trim();
        
        console.log('📝 Datos leídos:', {
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
        
        // Verificar BitgetAPI
        console.log('🔍 Verificando BitgetAPI:', !!window.BitgetAPI);
        if (!window.BitgetAPI) {
            console.error('❌ BitgetAPI no disponible');
            const statusDiv = document.getElementById('key-status');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Sistema no disponible. Recarga la página.</div>';
                statusDiv.style.display = 'block';
            }
            return;
        }
        
        // Deshabilitar botón
        target.disabled = true;
        const statusDiv = document.getElementById('key-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-info"><i class="bi bi-hourglass-split me-2"></i>Conectando...</div>';
            statusDiv.style.display = 'block';
        }
        
        // Ejecutar conexión
        (async () => {
            try {
                console.log('💾 Guardando credenciales...');
                if (window.BitgetAPI.saveCredentials(apiKey, apiSecret, passphrase)) {
                    console.log('✅ Credenciales guardadas');
                    try {
                        console.log('📊 Cargando posiciones...');
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
                        
                        // Limpiar campos
                        console.log('🧹 Limpiando campos...');
                        setTimeout(() => {
                            apiKeyInput.value = '';
                            apiSecretInput.value = '';
                            passphraseInput.value = '';
                            console.log('✅ Campos de Bitget limpiados');
                        }, 100);
                    } catch (error) {
                        console.error('❌ Error al cargar posiciones:', error);
                        if (statusDiv) {
                            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle me-2"></i>⚠️ Error: ' + error.message + '</div>';
                            statusDiv.style.display = 'block';
                        }
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
                    statusDiv.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-circle me-2"></i>❌ Error: ' + e.message + '</div>';
                    statusDiv.style.display = 'block';
                }
            } finally {
                target.disabled = false;
            }
        })();
    }
});

// Monitorear cuando apicon.html se carga y verificar que los botones tengan eventos
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Si se agregó un botón de Crear o Cargar Llave
                    if (node.id === 'save-key-btn' || node.id === 'load-key-btn' || node.id === 'connect-btn') {
                        console.log('✅ Botón detectado en el DOM:', node.id);
                        
                        // Verificar que tenga el evento si viene de bitget-api.js
                        if (node.id === 'connect-btn') {
                            const hasClickListener = getEventListeners(node)?.click?.length > 0;
                            console.log('   - Connect btn tiene listener:', hasClickListener);
                        }
                    }
                }
            });
        }
    });
});

// Iniciar observador cuando el DOM esté listo
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    });
}

console.log('✅ button-handlers.js cargado con event delegation');
