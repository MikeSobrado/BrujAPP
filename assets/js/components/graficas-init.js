// Función para cargar datos de gráficas desde sessionStorage
// SessionStorage se limpia al cerrar la pestaña, NO persiste en reload
function loadChartsFromSession() {
    let chartsData = null;
    
    // Intentar cargar SOLO de sessionStorage (cifrado)
    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
        chartsData = SessionStorageManager.loadChartsData();
    }
    
    if (chartsData) {
        console.log('📂 Cargando datos de gráficas desde sessionStorage...');
        
        // Cargar Fear & Greed si está disponible
        if (chartsData.fearGreed && chartsData.fearGreed.data) {
            setTimeout(() => {
                displayFearGreedData(chartsData.fearGreed.data);
            }, 300);
        }
        
        // Cargar Funding Rate si está disponible
        if (chartsData.fundingRate && chartsData.fundingRate.data) {
            setTimeout(() => {
                displayFundingRateData(chartsData.fundingRate.data);
            }, 300);
        }
        
        // Cargar Dominance si está disponible
        if (chartsData.dominance && chartsData.dominance.data) {
            setTimeout(() => {
                displayDominanceData(chartsData.dominance.data);
            }, 300);
        }
        
        return true;
    }
    
    return false;
}

// Cargar datos al abrir la pestaña
document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Pestaña de gráficas cargada');
    const hadCache = loadChartsFromSession();
    
    // Si no había datos en caché, cargar datos frescos
    if (!hadCache) {
        console.log('📡 No hay datos en caché, cargando desde APIs...');
        
        // Cargar dominancia (CoinMarketCap)
        if (typeof fetchDominance === 'function') {
            setTimeout(() => {
                console.log('📊 Iniciando fetchDominance()...');
                fetchDominance();
            }, 500);
        }
    }
});

// Escuchar cuando se activa la pestaña de gráficas (cambio de tab)
document.addEventListener('shown.bs.tab', function(e) {
    if (e.target && (e.target.id === 'graficas-tab' || e.target.getAttribute('data-bs-target') === '#graficas')) {
        console.log('✓ Pestaña de gráficas activada');
        loadChartsFromSession();
    }
});
