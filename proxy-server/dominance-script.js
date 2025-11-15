// --- CONFIGURACIÓN ---
const CMC_API_KEY = 'c6791d0ea1c74420b29c19532bea12e1'; // Tu clave de CoinMarketCap
const DOMINANCE_API_URL = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest';
const USE_PROXY = true; // Usar el proxy local para evitar CORS

// URLs del proxy (intentará ambos puertos)
const PROXY_URLS = [
    'http://localhost:3001/api/global-metrics', // Primero 3001 (servidor principal)
    'http://localhost:3000/api/global-metrics'  // Backup
];

// Variable global para el gráfico
let dominanceChart = null;

// --- FUNCIONES PRINCIPALES ---

/**
 * Función principal para obtener y mostrar datos de dominancia.
 * Incluye caché para optimizar las llamadas a la API.
 */
async function fetchDominance() {
    // Mostrar indicador de carga inmediatamente
    const dominanceSection = document.getElementById('dominance-section');
    const loadingHTML = `
        <h2>Dominancia de Mercado</h2>
        <div style="text-align: center; padding: 40px;">
            <div style="color: #eaeaea; font-size: 16px; margin-bottom: 10px;">
                🔄 Cargando datos de dominancia...
            </div>
            <div style="color: #888; font-size: 12px;">
                Conectando con CoinMarketCap
            </div>
        </div>
    `;
    
    if (!CMC_API_KEY || CMC_API_KEY.trim() === '' || CMC_API_KEY.includes('TU_API_KEY') || CMC_API_KEY.includes('AQUI_VA')) {
        dominanceSection.innerHTML = '<h2>Dominancia de Mercado</h2><p class="error">Por favor, configura tu API Key de CoinMarketCap en el script.</p>';
        return;
    }

    const CACHE_KEY = 'dominanceData';
    const CACHE_DURATION = 14400000; // 4 horas

    // 1. Revisar caché
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const { data, timestamp } = JSON.parse(cachedData);
            if (data && typeof data.btc_dominance !== 'undefined' && Date.now() - timestamp < CACHE_DURATION) {
                console.log('📁 Usando datos de dominancia desde caché');
                restoreDominanceHTML();
                renderDominanceChart(data.btc_dominance, data.eth_dominance, data.others_dominance);
                document.getElementById('dominance-last-update').textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
                return;
            }
        } catch (e) {
            console.warn("Los datos en caché están corruptos. Se descargarán de nuevo.", e);
            localStorage.removeItem(CACHE_KEY);
        }
    }

    // Mostrar indicador de carga
    dominanceSection.innerHTML = loadingHTML;

    // 2. Obtener datos frescos de la API
    try {
        console.log('🌐 Obteniendo datos frescos de dominancia...');
        const headers = USE_PROXY ? {} : { 'X-CMC_PRO_API_KEY': CMC_API_KEY };

        let response;
        if (USE_PROXY) {
            response = await fetchWithFallback(PROXY_URLS);
        } else {
            response = await fetch(DOMINANCE_API_URL, { headers });
        }

        if (!response.ok) {
            let text;
            try { text = await response.text(); } catch (e) { text = '<no se pudo leer el cuerpo de la respuesta>'; }
            throw new Error(`Error al obtener datos de dominancia (status ${response.status}): ${text}`);
        }

        const apiData = await response.json();
        const btcDominance = apiData.data.btc_dominance;
        const ethDominance = apiData.data.eth_dominance;
        const othersDominance = 100 - btcDominance - ethDominance;

        const newData = { btc_dominance: btcDominance, eth_dominance: ethDominance, others_dominance: othersDominance };

        // 3. Guardar en caché
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: newData,
            timestamp: Date.now()
        }));

        console.log('✅ Datos de dominancia obtenidos y guardados en caché');

        // 4. Restaurar HTML y renderizar gráfico
        restoreDominanceHTML();
        renderDominanceChart(btcDominance, ethDominance, othersDominance);
        document.getElementById('dominance-last-update').textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;

    } catch (error) {
        console.error('❌ Error al cargar dominancia:', error);
        dominanceSection.innerHTML = `<h2>Dominancia de Mercado</h2><p class="error">Error al cargar el gráfico de dominancia: ${error.message}</p>`;
        return;
    }
}

/**
 * Función auxiliar para intentar múltiples URLs de proxy
 */
async function fetchWithFallback(urls) {
    let lastError = null;
    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const resp = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            clearTimeout(timeoutId);
            
            if (resp && resp.ok) return resp;
        } catch (err) {
            lastError = err;
            console.warn(`Intento fallido a ${url} (${err.message})`);
        }
    }
    throw new Error(`Ningún proxy respondió correctamente. Último error: ${lastError ? lastError.message : 'sin detalles'}`);
}

/**
 * Restaura el HTML original de la sección de dominancia
 */
function restoreDominanceHTML() {
    const dominanceSection = document.getElementById('dominance-section');
    dominanceSection.innerHTML = `
        <h2>Dominancia de Mercado</h2>
        
        <!-- Primera sección: Valores actuales -->
        <div class="dominance-current-section">
            <div class="dominance-chart-small">
                <canvas id="dominanceChart"></canvas>
            </div>
            <div class="dominance-crypto-item">
                <div class="crypto-name">Bitcoin</div>
                <div class="crypto-dominance" id="btc-dominance">--</div>
                <div class="crypto-change" id="btc-change">--</div>
            </div>
            <div class="dominance-crypto-item">
                <div class="crypto-name">Ethereum</div>
                <div class="crypto-dominance" id="eth-dominance">--</div>
                <div class="crypto-change" id="eth-change">--</div>
            </div>
            <div class="dominance-crypto-item">
                <div class="crypto-name">Otros</div>
                <div class="crypto-dominance" id="others-dominance">--</div>
                <div class="crypto-change" id="others-change">--</div>
            </div>
        </div>

        <!-- Segunda sección: Valores históricos -->
        <div class="dominance-historical-section">
            <div class="historical-item">
                <span class="historical-label">Ayer</span>
                <div class="historical-values">
                    <span id="yesterday-btc">--</span>
                    <span id="yesterday-eth">--</span>
                    <span id="yesterday-others">--</span>
                </div>
            </div>
            <div class="historical-item">
                <span class="historical-label">Semana pasada</span>
                <div class="historical-values">
                    <span id="week-btc">--</span>
                    <span id="week-eth">--</span>
                    <span id="week-others">--</span>
                </div>
            </div>
            <div class="historical-item">
                <span class="historical-label">Mes pasado</span>
                <div class="historical-values">
                    <span id="month-btc">--</span>
                    <span id="month-eth">--</span>
                    <span id="month-others">--</span>
                </div>
            </div>
        </div>

        <!-- Tercera sección: Máximos y mínimos del año -->
        <div class="dominance-extremes-section">
            <div class="extremes-item">
                <span class="extremes-label">Máximos del año</span>
                <div class="extremes-values">
                    <span id="max-btc">--</span>
                    <span id="max-eth">--</span>
                    <span id="max-others">--</span>
                </div>
            </div>
            <div class="extremes-item">
                <span class="extremes-label">Mínimos del año</span>
                <div class="extremes-values">
                    <span id="min-btc">--</span>
                    <span id="min-eth">--</span>
                    <span id="min-others">--</span>
                </div>
            </div>
        </div>

        <!-- Footer del panel -->
        <div class="panel-footer">
            <small>Fuente: CoinMarketCap</small>
            <small id="dominance-last-update">--</small>
        </div>
    `;
}

/**
 * Función principal de renderizado que coordina todas las secciones
 */
function renderDominanceChart(btc, eth, others) {
    // Simular datos históricos y de variación
    const historicalData = simulateDominanceHistoricalData(btc, eth, others);
    
    // Actualizar sección 1: Valores actuales
    updateCurrentDominance(btc, eth, others, historicalData);
    
    // Actualizar sección 2: Valores históricos
    updateHistoricalDominance(historicalData);
    
    // Actualizar sección 3: Máximos y mínimos
    updateExtremesDominance(historicalData);
    
    // Renderizar gráfico pequeño
    renderSmallDominanceChart(btc, eth, others);
}

/**
 * Simula datos históricos de dominancia para las diferentes secciones
 */
function simulateDominanceHistoricalData(currentBtc, currentEth, currentOthers) {
    const generateVariation = (base, maxChange = 3) => {
        return base + (Math.random() - 0.5) * maxChange;
    };

    return {
        // Variaciones 24h (simuladas)
        changes24h: {
            btc: (Math.random() - 0.5) * 2,
            eth: (Math.random() - 0.5) * 1.5,
            others: (Math.random() - 0.5) * 1.2
        },
        // Valores históricos
        yesterday: {
            btc: generateVariation(currentBtc, 1),
            eth: generateVariation(currentEth, 0.8),
            others: generateVariation(currentOthers, 1.2)
        },
        week: {
            btc: generateVariation(currentBtc, 3),
            eth: generateVariation(currentEth, 2),
            others: generateVariation(currentOthers, 2.5)
        },
        month: {
            btc: generateVariation(currentBtc, 5),
            eth: generateVariation(currentEth, 3),
            others: generateVariation(currentOthers, 4)
        },
        // Extremos del año
        yearMax: {
            btc: currentBtc + Math.random() * 8 + 2,
            eth: currentEth + Math.random() * 5 + 1,
            others: currentOthers + Math.random() * 6 + 2
        },
        yearMin: {
            btc: Math.max(35, currentBtc - Math.random() * 8 - 2),
            eth: Math.max(10, currentEth - Math.random() * 5 - 1),
            others: Math.max(25, currentOthers - Math.random() * 6 - 2)
        }
    };
}

/**
 * Actualiza la primera sección con valores actuales y cambios 24h
 */
function updateCurrentDominance(btc, eth, others, data) {
    // Bitcoin
    document.getElementById('btc-dominance').textContent = `${btc.toFixed(2)}%`;
    const btcChangeEl = document.getElementById('btc-change');
    const btcChange = data.changes24h.btc;
    btcChangeEl.textContent = `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`;
    btcChangeEl.className = `crypto-change ${btcChange > 0 ? 'positive' : btcChange < 0 ? 'negative' : 'neutral'}`;

    // Ethereum
    document.getElementById('eth-dominance').textContent = `${eth.toFixed(2)}%`;
    const ethChangeEl = document.getElementById('eth-change');
    const ethChange = data.changes24h.eth;
    ethChangeEl.textContent = `${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(2)}%`;
    ethChangeEl.className = `crypto-change ${ethChange > 0 ? 'positive' : ethChange < 0 ? 'negative' : 'neutral'}`;

    // Otros
    document.getElementById('others-dominance').textContent = `${others.toFixed(2)}%`;
    const othersChangeEl = document.getElementById('others-change');
    const othersChange = data.changes24h.others;
    othersChangeEl.textContent = `${othersChange >= 0 ? '+' : ''}${othersChange.toFixed(2)}%`;
    othersChangeEl.className = `crypto-change ${othersChange > 0 ? 'positive' : othersChange < 0 ? 'negative' : 'neutral'}`;
}

/**
 * Actualiza la segunda sección con valores históricos
 */
function updateHistoricalDominance(data) {
    // Ayer
    document.getElementById('yesterday-btc').textContent = `${data.yesterday.btc.toFixed(1)}%`;
    document.getElementById('yesterday-eth').textContent = `${data.yesterday.eth.toFixed(1)}%`;
    document.getElementById('yesterday-others').textContent = `${data.yesterday.others.toFixed(1)}%`;

    // Semana pasada
    document.getElementById('week-btc').textContent = `${data.week.btc.toFixed(1)}%`;
    document.getElementById('week-eth').textContent = `${data.week.eth.toFixed(1)}%`;
    document.getElementById('week-others').textContent = `${data.week.others.toFixed(1)}%`;

    // Mes pasado
    document.getElementById('month-btc').textContent = `${data.month.btc.toFixed(1)}%`;
    document.getElementById('month-eth').textContent = `${data.month.eth.toFixed(1)}%`;
    document.getElementById('month-others').textContent = `${data.month.others.toFixed(1)}%`;
}

/**
 * Actualiza la tercera sección con máximos y mínimos del año
 */
function updateExtremesDominance(data) {
    // Máximos del año
    document.getElementById('max-btc').textContent = `${data.yearMax.btc.toFixed(1)}%`;
    document.getElementById('max-eth').textContent = `${data.yearMax.eth.toFixed(1)}%`;
    document.getElementById('max-others').textContent = `${data.yearMax.others.toFixed(1)}%`;

    // Mínimos del año
    document.getElementById('min-btc').textContent = `${data.yearMin.btc.toFixed(1)}%`;
    document.getElementById('min-eth').textContent = `${data.yearMin.eth.toFixed(1)}%`;
    document.getElementById('min-others').textContent = `${data.yearMin.others.toFixed(1)}%`;
}

/**
 * Renderiza el gráfico de dona pequeño
 */
function renderSmallDominanceChart(btc, eth, others) {
    const ctx = document.getElementById('dominanceChart').getContext('2d');
    
    if (dominanceChart) {
        dominanceChart.destroy();
    }

    const colors = {
        bitcoin: '#FF9500',
        ethereum: '#627EEA',
        others: '#6C7B7F'
    };

    dominanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bitcoin', 'Ethereum', 'Otras'],
            datasets: [{
                data: [btc, eth, others],
                backgroundColor: [colors.bitcoin, colors.ethereum, colors.others],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            animation: {
                duration: 800
            }
        }
    });
}

// --- INICIALIZACIÓN ---

/**
 * Función que se ejecuta cuando la página está completamente cargada
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard de Dominancia Crypto iniciado');
    
    // Cargar datos de dominancia inmediatamente
    fetchDominance();
    
    // Configurar auto-refresh cada 15 minutos
    setInterval(fetchDominance, 15 * 60 * 1000);
    
    console.log('⏰ Auto-refresh configurado para cada 15 minutos');
});

// --- FUNCIONES AUXILIARES ---

/**
 * Función para actualizar manualmente los datos (se puede llamar desde la consola)
 */
function refreshDominance() {
    localStorage.removeItem('dominanceData');
    fetchDominance();
}

/**
 * Función para limpiar toda la caché (se puede llamar desde la consola)
 */
function clearCache() {
    localStorage.clear();
    console.log('🗑️ Caché limpiada completamente');
}

// Exportar funciones útiles al ámbito global para debug
window.refreshDominance = refreshDominance;
window.clearCache = clearCache;