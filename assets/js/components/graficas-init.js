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

// NO HACER LLAMADAS AUTOMÁTICAS A fetchDominance
// Solo se ejecuta cuando el usuario clickea el botón "Conectar" de CMC
// Eol manual del usuario

console.log('✓ Pestaña de gráficas cargada (fetchDominance solo manual)');
