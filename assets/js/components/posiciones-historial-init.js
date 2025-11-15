// ==========================================
// HISTORIAL DE POSICIONES - DELEGACIÓN A bitget-positions.js
// ==========================================

console.log('[HISTORY] 🔄 Inicializando posiciones.html (historial)...');
console.log('[HISTORY] Estado: window.positionsManager disponible =', typeof window.positionsManager);

// IMPORTANTE: Esta sección SOLO dispara la carga a través de bitget-positions.js
// Las funciones reales están en bitget-positions.js para evitar duplicación

// Intentar cargar inmediatamente
if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncPositions) {
    console.log('[HISTORY] 🚀 positionsManager disponible, sincronizando historial...');
    window.positionsManager.syncPositions();
} else {
    console.log('[HISTORY] ⏳ positionsManager no disponible aún, reintentando...');
    setTimeout(() => {
        if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncPositions) {
            console.log('[HISTORY] 🚀 positionsManager disponible (retry), sincronizando historial...');
            window.positionsManager.syncPositions();
        }
    }, 300);
}

// Escuchar evento de actualización de posiciones
window.addEventListener('posiciones-updated', (event) => {
    console.log('[HISTORY-EVENT] 📣 Evento posiciones-updated recibido');
    if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncPositions) {
        window.positionsManager.syncPositions();
    }
});

console.log('[HISTORY] ✅ Script de posiciones.html (historial) cargado');
