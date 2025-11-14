// charts-monitoring.js - Orquestación de gráficas de Monitoreo (Bitget)
// Este archivo coordina la renderización de gráficas de monitoreo del trading:
// - Equity Curve
// - P&L por Posición  
// - Long vs Short
// - Distribución de P&L
// - Drawdown Máximo
// - Comisiones Acumuladas

/**
 * Renderizar todas las gráficas de monitoreo
 * Utiliza BitgetChartsManager (definida en bitget-charts.js)
 */
async function renderMonitoringCharts() {
    console.log('🚀 Iniciando renderización de gráficas de monitoreo...');
    
    // Verificar que BitgetCharts está disponible
    if (typeof window.BitgetCharts === 'undefined') {
        console.error('❌ BitgetCharts no está disponible. Asegúrate de que bitget-charts.js está cargado');
        return;
    }
    
    try {
        // Renderizar todas las gráficas de monitoreo
        await window.renderBitgetCharts();
        console.log('✅ Gráficas de monitoreo renderizadas exitosamente');
    } catch (error) {
        console.error('❌ Error al renderizar gráficas de monitoreo:', error);
    }
}

/**
 * Función para cargar gráficas de monitoreo cuando se abre la pestaña
 */
function initializeMonitoringCharts() {
    console.log('📊 Inicializando sistema de gráficas de monitoreo...');
    
    // Buscar el botón/link que activa la pestaña de monitoreo
    const monitoreoTab = document.querySelector('[data-target="#monitoreo"]') || 
                         document.getElementById('monitoreo-tab');
    
    if (monitoreoTab) {
        monitoreoTab.addEventListener('click', function() {
            setTimeout(function() {
                const monitoreoPane = document.getElementById('monitoreo');
                if (monitoreoPane && monitoreoPane.classList.contains('active')) {
                    console.log('🎯 Pestaña de monitoreo activada');
                    renderMonitoringCharts();
                }
            }, 100);
        });
        console.log('✅ Listener de monitoreo configurado');
    } else {
        console.warn('⚠️ No se encontró el trigger para la pestaña de monitoreo');
    }
}

// Ejecutar inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeMonitoringCharts();
});

// Exportar funciones para uso global
window.renderMonitoringCharts = renderMonitoringCharts;
window.initializeMonitoringCharts = initializeMonitoringCharts;
