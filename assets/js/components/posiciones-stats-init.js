// ==========================================
// ESTADÍSTICAS RÁPIDAS - DELEGACIÓN A bitget-positions.js
// ==========================================

console.log('[STATS] 🔄 Inicializando posiciones.html (estadísticas)...');
console.log('[STATS] Estado: window.positionsManager disponible =', typeof window.positionsManager);

// IMPORTANTE: Esta sección SOLO dispara la carga a través de bitget-positions.js
// Las funciones reales están en bitget-positions.js para evitar duplicación

// Intentar cargar inmediatamente
if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncStats) {
    console.log('[STATS] 🚀 positionsManager disponible, sincronizando estadísticas...');
    window.positionsManager.syncStats();
} else {
    console.log('[STATS] ⏳ positionsManager no disponible aún, reintentando...');
    setTimeout(() => {
        if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncStats) {
            console.log('[STATS] 🚀 positionsManager disponible (retry), sincronizando estadísticas...');
            window.positionsManager.syncStats();
        }
    }, 300);
}

// Escuchar evento de actualización de posiciones
window.addEventListener('posiciones-updated', (event) => {
    console.log('[STATS-EVENT] 📣 Evento posiciones-updated recibido con ' + (event.detail?.positions?.length || 0) + ' posiciones');
    if (typeof window.positionsManager !== 'undefined' && window.positionsManager.syncStats) {
        window.positionsManager.syncStats();
    }
});

console.log('[STATS] ✅ Script de posiciones.html (estadísticas) cargado');
