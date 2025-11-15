// ==========================================
// GESTION DE RIESGO - Long/Short Toggle
// ==========================================

console.log('[GESTION-RIESGO] 🔄 Inicializando controles de Long/Short...');

// Toggle buttons para Long/Short
function initializeLongShortToggle() {
    const btnLong = document.getElementById('btn-long');
    const btnShort = document.getElementById('btn-short');
    const operacionTipo = document.getElementById('operacion-tipo');
    
    if (!btnLong || !btnShort || !operacionTipo) {
        console.warn('[GESTION-RIESGO] ⚠️ Botones de Long/Short no encontrados');
        return;
    }
    
    console.log('[GESTION-RIESGO] ✅ Botones encontrados, configurando eventos...');
    
    // Botón Long
    btnLong.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('[GESTION-RIESGO] 📈 Long seleccionado');
        
        operacionTipo.value = 'long';
        
        // Actualizar estilos
        btnLong.style.background = '#4CAF50';
        btnLong.style.color = 'white';
        btnLong.classList.add('active');
        
        btnShort.style.background = 'transparent';
        btnShort.style.color = '#f44336';
        btnShort.classList.remove('active');
        
        // Trigger recalculation
        if (typeof updateRiskCalculations === 'function') {
            console.log('[GESTION-RIESGO] 🔄 Recalculando...');
            updateRiskCalculations();
        }
    });
    
    // Botón Short
    btnShort.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('[GESTION-RIESGO] 📉 Short seleccionado');
        
        operacionTipo.value = 'short';
        
        // Actualizar estilos
        btnShort.style.background = '#f44336';
        btnShort.style.color = 'white';
        btnShort.classList.add('active');
        
        btnLong.style.background = 'transparent';
        btnLong.style.color = '#4CAF50';
        btnLong.classList.remove('active');
        
        // Trigger recalculation
        if (typeof updateRiskCalculations === 'function') {
            console.log('[GESTION-RIESGO] 🔄 Recalculando...');
            updateRiskCalculations();
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLongShortToggle);
} else {
    console.log('[GESTION-RIESGO] DOM ya cargado, inicializando...');
    initializeLongShortToggle();
}

console.log('[GESTION-RIESGO] ✅ Script cargado');
