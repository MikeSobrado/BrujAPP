// Funciones de demo para el Cache System
function demoCacheBasic() {
    try {
        const key = document.getElementById('cache-key').value || 'test-key';
        const value = document.getElementById('cache-value').value;
        
        let data;
        try {
            data = JSON.parse(value);
        } catch (e) {
            data = value; // Si no es JSON válido, usar como string
        }
        
        // Guardar en cache
        const saved = window.cache.set(key, data);
        
        // Recuperar del cache
        const retrieved = window.cache.get(key);
        
        console.log('Cache Básico:', { key, saved, original: data, retrieved, success: JSON.stringify(data) === JSON.stringify(retrieved) });
        
    } catch (error) {
        console.error('Error en Cache Básico:', error.message);
    }
}

function demoCacheWithExpiration() {
    try {
        const key = document.getElementById('cache-key').value || 'test-expiration';
        const value = document.getElementById('cache-value').value;
        const ttl = parseInt(document.getElementById('cache-ttl').value) || 5000;
        
        let data;
        try {
            data = JSON.parse(value);
        } catch (e) {
            data = value;
        }
        
        // Guardar con expiración
        const saved = window.cache.set(key, data, { maxAge: ttl });
        
        // Recuperar inmediatamente
        const immediate = window.cache.get(key);
        
        console.log('Cache con Expiración:', { key, ttl: `${ttl}ms`, saved, immediate });
        
        // Programar verificación después de expiración
        setTimeout(() => {
            const expired = window.cache.get(key);
            console.log('Verificación Post-Expiración:', { key, expired: expired ? 'Aún existe' : 'null (correcto)' });
        }, ttl + 1000);
        
    } catch (error) {
        console.error('Error en Cache con Expiración:', error.message);
    }
}

async function demoCacheAPI() {
    try {
        console.log('Cache API: Simulando petición...');
        
        // Primera llamada - simular
        const startTime1 = Date.now();
        const mockData = {
            prices: { EURUSD: 1.2345, GBPUSD: 1.5678 },
            timestamp: new Date().toISOString(),
            cached: false
        };
        
        window.cache.set('api-market-data', mockData, { 
            maxAge: 30000, 
            namespace: 'api',
            tags: ['api', 'market'] 
        });
        const time1 = Date.now() - startTime1;
        
        // Segunda llamada
        const startTime2 = Date.now();
        const cachedData = window.cache.get('api-market-data', 'api');
        const time2 = Date.now() - startTime2;
        
        console.log('Cache API:', {
            firstCall: { time: `${time1}ms`, source: 'Simulación API' },
            secondCall: { time: `${time2}ms`, source: 'Cache' },
            speedImprovement: `${Math.round((time1/time2) * 100)}% más rápido`
        });
        
    } catch (error) {
        console.error('Error en Cache API:', error.message);
    }
}

function demoCacheTradingData() {
    try {
        const tradingData = {
            symbol: 'EURUSD',
            bid: 1.2340,
            ask: 1.2342,
            spread: 0.0002,
            timestamp: new Date().toISOString()
        };
        
        const panelConfig = {
            panelId: 'macd-panel',
            indicators: ['MACD', 'RSI'],
            timeframe: '1H',
            alerts: true
        };
        
        window.tradingCache.setMarketData('EURUSD', tradingData);
        window.tradingCache.setPanelConfig('macd-panel', panelConfig);
        
        const retrievedMarket = window.tradingCache.getMarketData('EURUSD');
        const retrievedPanel = window.tradingCache.getPanelConfig('macd-panel');
        
        console.log('Cache Trading:', {
            marketData: { match: JSON.stringify(tradingData) === JSON.stringify(retrievedMarket) },
            panelConfig: { match: JSON.stringify(panelConfig) === JSON.stringify(retrievedPanel) }
        });
        
    } catch (error) {
        console.error('Error en Cache Trading:', error.message);
    }
}

function demoCacheStats() {
    try {
        const stats = window.cache.stats();
        console.log('Estadísticas del Cache:', stats);
        
        // Actualizar display de stats
        const statsDisplay = document.getElementById('cache-stats-display');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <div class="mb-2">
                    <strong>Memoria:</strong><br>
                    <small>${stats.memory.entries}/${stats.memory.maxSize} entradas (${stats.memory.usage}%)</small>
                </div>
                <div class="mb-2">
                    <strong>Storage:</strong><br>
                    <small>${stats.storage.entries} entradas (${stats.storage.sizeFormatted})</small>
                </div>
                <div>
                    <strong>Config:</strong><br>
                    <small>TTL: ${stats.config.maxAge/1000}s | Compresión: ${stats.config.compression ? 'Sí' : 'No'}</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error en Estadísticas:', error.message);
    }
}

function demoCacheClear() {
    try {
        const statsBefore = window.cache.stats();
        window.cache.clear();
        const statsAfter = window.cache.stats();
        
        console.log('Cache Limpiado:', { before: statsBefore, after: statsAfter });
        
        // Actualizar display
        const statsDisplay = document.getElementById('cache-stats-display');
        if (statsDisplay) {
            statsDisplay.innerHTML = `
                <div class="alert alert-success">
                    <strong>Cache Limpiado</strong><br>
                    <small>Memoria: 0/${statsAfter.memory.maxSize} entradas</small><br>
                    <small>Storage: 0 entradas</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error al limpiar cache:', error.message);
    }
}

// Inicializar estadísticas al cargar
document.addEventListener('DOMContentLoaded', function() {
    if (window.cache && window.cache.stats) {
        setTimeout(demoCacheStats, 500);
    }
});
