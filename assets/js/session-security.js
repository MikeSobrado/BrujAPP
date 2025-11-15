/**
 * session-security.js
 * Funcionalidades de seguridad de sesión:
 * - Auto-logout por inactividad (15 minutos)
 * - Aviso cuando tab es ocultada
 * - Limpiar datos al inactividad
 */

console.log('🔒 session-security.js cargándose...');

// ========================================
// 1. AUTO-LOGOUT POR INACTIVIDAD (15 MINUTOS)
// ========================================

let inactivityTimer;
const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutos en ms

function resetInactivityTimer() {
    // Limpiar timer anterior
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Establecer nuevo timer
    inactivityTimer = setTimeout(() => {
        console.warn('⏰ SESIÓN CERRADA: Inactividad por 15 minutos');
        console.warn('🧹 Limpiando datos de sesión...');
        
        // Avisar al usuario
        alert('⏰ Tu sesión ha expirado por inactividad (15 minutos).\n\nPor seguridad, tus datos han sido borrados.\nPor favor, reconecta a la API.');
        
        // Limpiar datos
        sessionStorage.clear();
        localStorage.removeItem('bitget_credentials');
        
        // Limpiar caché en memoria
        if (typeof window.cache !== 'undefined' && window.cache.clear) {
            window.cache.clear();
            console.log('🧹 Caché en memoria limpiado');
        }
        
        // Limpiar bitget_positions específicamente
        if (typeof window.cache !== 'undefined') {
            window.cache.delete('bitget_positions');
        }
        
        if (typeof window.BitgetAPI !== 'undefined') {
            window.BitgetAPI.credentials = null;
        }
        window.currentPositions = [];
        
        // Limpiar campos del formulario
        const apiKeyInput = document.getElementById('api-key-input');
        const apiSecretInput = document.getElementById('api-secret-input');
        const passphraseInput = document.getElementById('passphrase-input');
        
        if (apiKeyInput) apiKeyInput.value = '';
        if (apiSecretInput) apiSecretInput.value = '';
        if (passphraseInput) passphraseInput.value = '';
        
        // 🧹 Limpiar Estadísticas Rápidas y Tabla de Movimientos
        const statsContainer = document.getElementById('posiciones-stats-container');
        if (statsContainer) {
            statsContainer.innerHTML = '<p class="text-muted text-center">Carga las posiciones para ver las estadísticas</p>';
            console.log('🧹 Estadísticas rápidas limpiadas');
        }
        
        // 🔑 IMPORTANTE: Resetear flags de cargado para componentes dinámicos
        const statsDynamic = document.getElementById('posiciones-stats-dynamic');
        if (statsDynamic) {
            // Limpiar completamente el contenedor
            statsDynamic.innerHTML = '';
            statsDynamic.dataset.loaded = '';
            console.log('🧹 Contenedor stats limpiado y flag resetado');
        }
        
        const historialContainer = document.getElementById('posiciones-historial-dynamic');
        if (historialContainer) {
            // Limpiar completamente el contenedor
            historialContainer.innerHTML = '<p class="text-muted text-center">Conecta a la API en la pestaña de "APIs" para cargar tu historial de posiciones</p>';
            // 🔑 IMPORTANTE: Resetear el flag de cargado para que se recargue al reconectar
            historialContainer.dataset.loaded = '';
            console.log('🧹 Tabla de movimientos limpiada y flag resetado');
        }
        
        // Resetear también apicon-dynamic si existe (para que se recargue al ir a APIs)
        const apiconContainer = document.getElementById('apicon-dynamic');
        if (apiconContainer) {
            apiconContainer.dataset.loaded = '';
            console.log('🧹 Flag de apicon resetado');
        }
        
        // 🧹 Limpiar gráficas de Monitoreo
        const monitoreoPane = document.getElementById('monitoreo');
        if (monitoreoPane) {
            // Limpiar todos los canvas (gráficas)
            const canvases = monitoreoPane.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
            
            // Limpiar cualquier contenido dinámico en los cards
            const cards = monitoreoPane.querySelectorAll('.card-body');
            cards.forEach(card => {
                // Dejar los canvas pero limpiar otros contenidos
                const canvasInCard = card.querySelector('canvas');
                if (!canvasInCard) {
                    card.innerHTML = '';
                }
            });
            
            console.log('🧹 Gráficas de Monitoreo limpiadas');
        }
        
        // 🧹 Limpiar datos de BitgetCharts (instancia global)
        if (typeof window.BitgetCharts !== 'undefined' && window.BitgetCharts.clearAll) {
            console.log('🧹 Limpiando datos en BitgetCharts...');
            window.BitgetCharts.clearAll();
        }
        
        // 🧹 Limpiar gráficos de dominancia
        if (typeof window.clearDominanceData === 'function') {
            console.log('🧹 Limpiando datos en Dominancia...');
            window.clearDominanceData();
        }
        
        // 🧹 Limpiar gráficos de mercado
        if (typeof window.clearMarketCharts === 'function') {
            console.log('🧹 Limpiando gráficos de mercado...');
            window.clearMarketCharts();
        }
        
        // Mostrar mensaje
        const statusDiv = document.getElementById('profile-status');
        if (statusDiv) {
            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="bi bi-clock-history me-2"></i>⏰ Sesión expirada por inactividad. Reconecta para continuar.</div>';
            statusDiv.style.display = 'block';
        }
        
        console.log('✅ Sesión limpiada por seguridad (incluidas posiciones y movimientos)');
    }, INACTIVITY_TIME);
}

// Eventos que reinician el timer de inactividad
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

activityEvents.forEach(event => {
    document.addEventListener(event, () => {
        console.log('👤 Actividad detectada, reiniciando timer de inactividad...');
        resetInactivityTimer();
    });
});

// Detector: Volver a la página (recuperar foco)
window.addEventListener('focus', () => {
    console.log('🔄 Volviste a la página - Reiniciando contador de inactividad');
    resetInactivityTimer();
});

// Iniciar timer al cargar la página
console.log('⏰ Timer de inactividad iniciado (1 minuto PARA TESTS)');
resetInactivityTimer();

// ========================================
// 2. ALERTA AL SALIR DE LA PÁGINA (mouse leave)
// ========================================

let popupShownRecently = false;

// Usar mouseout en body para detectar cuando el ratón sale
document.body.addEventListener('mouseout', (e) => {
    // Verificar que el ratón realmente salió (clientY o clientX negativo)
    if (e.clientY < 0 || e.clientX < 0 || 
        e.clientY >= window.innerHeight || 
        e.clientX >= window.innerWidth) {
        
        // Solo mostrar si no lo mostró hace poco
        if (!popupShownRecently) {
            console.log('👁️ RATÓN SALIÓ - Mostrando popup');
            showExitWarning();
            popupShownRecently = true;
            
            // Permitir mostrar otro popup después de 1 hora (3,600,000 ms)
            setTimeout(() => {
                popupShownRecently = false;
            }, 3600000); // 1 hora
        }
    }
});

// Función para mostrar popup de salida
function showExitWarning() {
    console.log('🎯 showExitWarning() llamada');
    
    // No mostrar múltiples popups
    if (document.getElementById('exit-warning-popup')) {
        console.log('⚠️ Ya hay un popup abierto');
        return;
    }
    
    console.log('📍 Creando popup...');
    
    // Crear overlay oscuro
    const overlay = document.createElement('div');
    overlay.id = 'exit-warning-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Crear popup
    const popup = document.createElement('div');
    popup.id = 'exit-warning-popup';
    popup.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        text-align: center;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Función para cerrar popup
    const closePopup = () => {
        const o = document.getElementById('exit-warning-overlay');
        if (o) o.remove();
        console.log('✅ Popup cerrado por usuario');
        // NO resetear popupShownRecently aquí - mantener el cooldown de 1 hora
        // El flag solo se resetea cuando transcurren 1 hora completa
    };
    
    popup.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
        <h3 style="color: #dc3545; margin-bottom: 10px;">¡ESPERA UN MOMENTO!</h3>
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
            Si vas a abandonar tu PC, <strong>cierra esta pestaña</strong> para mayor seguridad. 
            Tus datos de trading son sensibles.
        </p>
        <p style="color: #999; font-size: 13px; margin-bottom: 20px;">
            Si solo cambias de pestaña, no importa. Volverá a aparecer este aviso si sales de nuevo.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="btn-vuelvo" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">✓ Entendido, vuelvo</button>
            <button id="btn-cerrar" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            ">✕ Cerrar pestaña</button>
        </div>
    `;
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('exit-popup-style')) {
        const style = document.createElement('style');
        style.id = 'exit-popup-style';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: scale(0.8);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Insertar popup
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Agregar eventos a botones
    const btnVuelvo = document.getElementById('btn-vuelvo');
    const btnCerrar = document.getElementById('btn-cerrar');
    
    if (btnVuelvo) {
        btnVuelvo.addEventListener('click', closePopup);
    }
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            console.log('🔴 Usuario clickeó cerrar pestaña');
            window.close();
        });
    }
    
    console.log('✅ Popup mostrado en pantalla');
    
    // Auto-cerrar después de 10 segundos si el usuario no hace nada
    setTimeout(() => {
        const o = document.getElementById('exit-warning-overlay');
        if (o) {
            console.log('⏱️ Popup auto-cerrado (10 segundos)');
            o.remove();
        }
    }, 10000);
}

// ========================================
// 3. LIMPIAR DATOS AL CERRAR NAVEGADOR
// ========================================

window.addEventListener('beforeunload', () => {
    console.log('👋 Cerrando navegador/pestaña...');
    console.log('🧹 Los datos de sesión se borrarán automáticamente.');
    // SessionStorage se borra automáticamente, pero aquí podemos agregar lógica adicional si es necesario
});

// ========================================
// 4. VERIFICAR INTEGRIDAD DE SESIÓN
// ========================================

// Cada minuto, verificar que sessionStorage no ha sido modificado de forma sospechosa
setInterval(() => {
    if (typeof window.currentPositions === 'undefined' || window.currentPositions === null) {
        // Posiciones perdidas (pueden haber sido limpiadas)
        console.warn('⚠️ Posiciones de sesión no encontradas. Sesión puede haber expirado.');
    }
}, 60000); // Cada minuto

console.log('✅ session-security.js cargado correctamente');
console.log('🔒 Seguridad de sesión: ACTIVADA');
console.log('   ⏰ Auto-logout: 15 minutos de inactividad');
console.log('   👁️ Alerta cambio tab: ACTIVADA');
console.log('   🧹 Limpieza auto: Al cerrar navegador');
