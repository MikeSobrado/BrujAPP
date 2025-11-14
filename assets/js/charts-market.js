// charts-monitoring.js - Gráficas de Monitoreo de Mercado (Fear & Greed, Funding Rate)

// Variables globales para los gráficos
let fearGreedChart, fundingChart;

// APIs públicas utilizadas (sin CORS ni autenticación requerida)
const FEAR_GREED_API_URL = 'https://api.alternative.me/fng/';
const BINANCE_FUNDING_URL = 'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT';
const BINANCE_HISTORY_URL = 'https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=30';

/**
 * Función auxiliar para manejo de fallbacks entre múltiples URLs
 */
async function fetchWithFallback(urls) {
    let lastError = null;
    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
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
            console.warn(`❌ Intento fallido a ${url}: ${err.message}`);
        }
    }
    throw new Error(`Ningún proxy respondió correctamente. Último error: ${lastError ? lastError.message : 'sin detalles'}`);
}

// ===== FUNCIONES FEAR & GREED INDEX =====

// Función para obtener datos REALES de Fear & Greed
async function fetchFearGreed() {
    const CACHE_KEY = 'fearGreedHistoricalData';
    const CACHE_DURATION = 14400000; // 4 horas en milisegundos

    // 1. Revisar caché en sessionStorage cifrado (solo si hay encryptionKey)
    let cachedData = null;
    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
        cachedData = SessionStorageManager.loadChartsData();
        if (cachedData && cachedData.fearGreed) {
            try {
                if (Date.now() - (cachedData.fearGreed.timestamp || 0) < CACHE_DURATION) {
                    displayFearGreedData(cachedData.fearGreed.data);
                    return;
                }
            } catch (e) {
                console.warn("Los datos de Fear & Greed en caché están corruptos. Se descargarán de nuevo.", e);
            }
        }
    }

    // 2. Si no hay caché o está caducada, llamamos a la API
    try {
        console.log('🌐 Obteniendo datos REALES de Fear & Greed desde alternative.me...');
        
        // Obtener datos históricos de los últimos 30 días
        const response = await fetch('https://api.alternative.me/fng/?limit=30');
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        
        const apiData = await response.json();
        
        if (!apiData.data || apiData.data.length === 0) {
            throw new Error('No se recibieron datos válidos');
        }
        
        const historicalData = apiData.data;

    // 3. Procesar datos para monitoreo
    const processedData = processFearGreedData(historicalData);

        // 4. Guardar los nuevos datos en sessionStorage cifrado
        if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
            const chartsData = SessionStorageManager.loadChartsData() || {};
            chartsData.fearGreed = {
                data: processedData,
                timestamp: Date.now()
            };
            SessionStorageManager.saveChartsData(chartsData);
        }

        // 5. Mostrar los nuevos datos
        console.log('✅ Datos REALES de Fear & Greed obtenidos desde alternative.me');
        displayFearGreedData(processedData);

    } catch (error) {
        console.error('❌ Error al obtener datos REALES de Fear & Greed:', error);
        console.log('🔄 Fallback: Usando datos simulados...');
        
        // Fallback a datos simulados si falla la API real
        await fetchFearGreedSimulated();
    }
}

/**
 * Función de fallback con datos simulados para Fear & Greed
 */
async function fetchFearGreedSimulated() {
    // Generar datos históricos de 30 días
    const historicalData = [];
    const labels = [];
    const classifications = [];
    const patterns = {
        'Extreme Fear': 0,
        'Fear': 0,
        'Neutral': 0,
        'Greed': 0,
        'Extreme Greed': 0
    };

    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        
        const value = Math.floor(Math.random() * 100);
        historicalData.push(value);
        
        // Clasificar valor
        let classification;
        if (value <= 25) classification = 'Extreme Fear';
        else if (value <= 45) classification = 'Fear';
        else if (value <= 55) classification = 'Neutral';
        else if (value <= 75) classification = 'Greed';
        else classification = 'Extreme Greed';
        
        classifications.push(classification);
        patterns[classification]++;
    }

    // Calcular tendencia
    const recent = historicalData.slice(-7);
    const previous = historicalData.slice(-14, -7);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = recentAvg - previousAvg;
    
    let trend = 'estable';
    if (diff > 5) trend = 'alcista';
    if (diff < -5) trend = 'bajista';

    const avgValue = Math.round(historicalData.reduce((a, b) => a + b, 0) / historicalData.length);

    const simulatedData = {
        current: {
            value: historicalData[historicalData.length - 1],
            value_classification: classifications[classifications.length - 1]
        },
        historical: {
            labels: labels,
            values: historicalData,
            classifications: classifications
        },
        analysis: {
            trend: trend,
            patterns: patterns,
            avg: avgValue
        },
        lastUpdate: new Date().toLocaleString('es-ES'),
        source: 'Datos simulados'
    };

    displayFearGreedData(simulatedData);
}

// Función para procesar datos reales de Fear & Greed
function processFearGreedData(rawData) {
    const labels = [];
    const values = [];
    const classifications = [];
    const patterns = {
        'Extreme Fear': 0,
        'Fear': 0,
        'Neutral': 0,
        'Greed': 0,
        'Extreme Greed': 0
    };

    // Procesar datos históricos (ya vienen ordenados del más reciente al más antiguo)
    rawData.reverse().forEach(item => {
        const date = new Date(parseInt(item.timestamp) * 1000);
        labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
        values.push(parseInt(item.value));
        classifications.push(item.value_classification);
        patterns[item.value_classification]++;
    });

    // Calcular tendencia
    const recent = values.slice(-7);
    const previous = values.slice(-14, -7);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    const diff = recentAvg - previousAvg;
    
    let trend = 'estable';
    if (diff > 5) trend = 'alcista';
    if (diff < -5) trend = 'bajista';

    const avgValue = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

    return {
        current: rawData[rawData.length - 1],
        historical: {
            labels: labels,
            values: values,
            classifications: classifications
        },
        analysis: {
            trend: trend,
            patterns: patterns,
            avg: avgValue
        },
        lastUpdate: new Date().toLocaleString('es-ES'),
        source: 'alternative.me API'
    };
}

// Función para mostrar datos de Fear & Greed
function displayFearGreedData(data) {
    const valueEl = document.getElementById('fear-greed-value');
    const classificationEl = document.getElementById('fear-greed-classification');
    const lastUpdateEl = document.getElementById('fear-greed-last-update');
    const patternEl = document.getElementById('fear-greed-pattern-summary');

    if (valueEl) valueEl.textContent = data.current.value;
    if (classificationEl) classificationEl.textContent = data.current.value_classification;
    if (lastUpdateEl) lastUpdateEl.textContent = `Última actualización: ${data.lastUpdate}`;

    // Aplicar colores según el valor
    const { color } = getColorForFearGreed(data.current.value);
    if (valueEl) valueEl.style.color = color;
    if (classificationEl) classificationEl.style.color = color;

    // Mostrar monitoreo de patrones si existe
    if (patternEl && data.analysis) {
        const patterns = data.analysis.patterns;
        const trend = data.analysis.trend;
        const trendIcon = trend === 'alcista' ? '📈' : trend === 'bajista' ? '📉' : '➡️';
        
        patternEl.innerHTML = `
            <strong>Últimos 30 días:</strong><br>
            ${trendIcon} Tendencia: ${trend}<br>
            📊 Promedio: ${data.analysis.avg || data.analysis.average}<br><br>
            <strong>Distribución:</strong><br>
            🔴 Miedo Extremo: ${patterns['Extreme Fear']} días<br>
            🟠 Miedo: ${patterns['Fear']} días<br>
            🟡 Neutral: ${patterns['Neutral']} días<br>
            🟢 Codicia: ${patterns['Greed']} días<br>
            🟣 Codicia Extrema: ${patterns['Extreme Greed']} días
        `;
    }

    // Si tenemos datos históricos, renderizar el gráfico
    if (data.historical && data.historical.values) {
        renderFearGreedChart(data.historical.values, data.historical.labels);
    }
}

// Función para obtener color según el valor de Fear & Greed
function getColorForFearGreed(value) {
    if (value <= 25) return { color: '#d32f2f', label: 'Extreme Fear' };
    if (value <= 45) return { color: '#f57c00', label: 'Fear' };
    if (value <= 55) return { color: '#fbc02d', label: 'Neutral' };
    if (value <= 75) return { color: '#689f38', label: 'Greed' };
    return { color: '#388e3c', label: 'Extreme Greed' };
}

// Función para actualizar el gauge de Fear & Greed
function updateFearGreedGauge(value) {
    const pointer = document.querySelector('.gauge-pointer');
    if (pointer) {
        // Convertir valor (0-100) a grados (-90 a 90)
        const rotation = (value - 50) * 1.8;
        pointer.style.transform = `rotate(${rotation}deg)`;
    }
}

// Función para renderizar gráfico de Fear & Greed
function renderFearGreedChart(data, labels) {
    const ctx = document.getElementById('fearGreedChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    
    if (fearGreedChart) {
        fearGreedChart.destroy();
    }

    fearGreedChart = new Chart(context, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fear & Greed Index',
                data: data,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: data.map(value => getColorForFearGreed(value).color),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointHitRadius: 15, // Área más amplia para detectar hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false, // No requiere intersección exacta
                mode: 'nearest', // Busca el punto más cercano
                axis: 'x' // Solo considera la posición X
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#4361ee',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            const classification = getColorForFearGreed(value).classification;
                            return [`Índice: ${value}`, `${classification}`];
                        }
                    }
                }
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            if (value === 0) return 'Extreme Fear';
                            if (value === 25) return 'Fear';
                            if (value === 50) return 'Neutral';
                            if (value === 75) return 'Greed';
                            if (value === 100) return 'Extreme Greed';
                            return value;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

// ===== FUNCIONES FUNDING RATE (BITCOIN) =====

async function fetchFundingRate() {
    const CACHE_KEY = 'fundingRateData';
    const CACHE_DURATION = 1800000; // 30 minutos

    // 1. Revisar caché en sessionStorage cifrado
    let cachedData = null;
    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
        cachedData = SessionStorageManager.loadChartsData();
        if (cachedData && cachedData.fundingRate) {
            try {
                if (Date.now() - (cachedData.fundingRate.timestamp || 0) < CACHE_DURATION) {
                    displayFundingRateData(cachedData.fundingRate.data);
                    return;
                }
            } catch (e) {
                console.warn("Los datos de funding rate en caché están corruptos. Se descargarán de nuevo.", e);
            }
        }
    }

    // 2. Intentar obtener datos reales de Binance
    try {
        console.log('🌐 Obteniendo datos REALES de funding rate desde Binance...');
        
        // Obtener tasa actual de financiación de BTCUSDT
        console.log('📡 Consultando Binance Premium Index...');
        const currentResponse = await fetch(BINANCE_FUNDING_URL);
        if (!currentResponse.ok) throw new Error(`Binance Premium Index HTTP ${currentResponse.status}`);
        
        const currentData = await currentResponse.json();
        const currentRate = parseFloat(currentData.lastFundingRate) * 100; // Convertir a porcentaje

        // Obtener historial de tasas de financiación
        console.log('📡 Consultando Binance Funding History...');
        const historyResponse = await fetch(BINANCE_HISTORY_URL);
        if (!historyResponse.ok) throw new Error(`Binance Funding History HTTP ${historyResponse.status}`);
        
        const historyData = await historyResponse.json();
        
        // Procesar datos históricos
        const historicalRates = historyData.map(item => parseFloat(item.fundingRate) * 100);
        const labels = historyData.map(item => {
            const date = new Date(item.fundingTime);
            return date.toLocaleDateString('es-ES', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
            });
        });

        // Calcular próximo tiempo de financiación
        const nextFundingTime = parseInt(currentData.nextFundingTime);
        const nextFundingDate = new Date(nextFundingTime);

        const realFundingData = {
            current: parseFloat(currentRate.toFixed(4)),
            historical: historicalRates, // Orden cronológico correcto
            labels: labels,
            timestamp: Date.now(),
            lastUpdate: new Date().toLocaleString('es-ES'),
            nextFunding: nextFundingDate.toLocaleString('es-ES'),
            markPrice: parseFloat(currentData.markPrice),
            indexPrice: parseFloat(currentData.indexPrice),
            marketStatus: 'REAL'
        };
        
        // 3. Guardar en sessionStorage cifrado
        if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
            const chartsData = SessionStorageManager.loadChartsData() || {};
            chartsData.fundingRate = {
                data: realFundingData,
                timestamp: Date.now()
            };
            SessionStorageManager.saveChartsData(chartsData);
        }

        console.log('✅ Datos REALES de funding rate obtenidos desde Binance');
        displayFundingRateData(realFundingData);

    } catch (error) {
        console.error('❌ Error al obtener datos REALES de funding rate:', error);
        console.log('🔄 Fallback: Usando datos simulados...');
        
        // Fallback a datos simulados
        await fetchFundingRateSimulated();
    }
}

// Función de fallback con datos simulados para Funding Rate
async function fetchFundingRateSimulated() {
    console.log('⚠️ Generando datos simulados de funding rate...');
    
    const currentRate = (Math.random() - 0.5) * 0.4;
    const fundingData = {
        current: parseFloat((currentRate * 100).toFixed(4)),
        historical: Array.from({length: 30}, () => parseFloat(((Math.random() - 0.5) * 0.4 * 100).toFixed(4))),
        labels: Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - ((29 - i) * 8));
            return date.toLocaleDateString('es-ES', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit'
            });
        }),
        timestamp: Date.now(),
        lastUpdate: new Date().toLocaleString('es-ES'),
        marketStatus: 'SIMULATED'
    };

    displayFundingRateData(fundingData);
    console.log('📊 Datos simulados de funding rate generados - Valor actual:', fundingData.current + '%');
}

// Función para mostrar datos de Funding Rate
function displayFundingRateData(data) {
    const valueEl = document.getElementById('funding-rate-value');
    const classificationEl = document.getElementById('funding-rate-classification');
    const lastUpdateEl = document.getElementById('funding-last-update');

    const displayValue = data.current >= 0 ? `+${data.current}%` : `${data.current}%`;
    valueEl.textContent = displayValue;

    // Mostrar timestamp
    if (lastUpdateEl) lastUpdateEl.textContent = `Última actualización: ${data.lastUpdate}`;

    // Clasificar funding rate y aplicar color
    let classification, color;
    if (data.current > 0.1) {
        classification = 'Alto (Long costoso)';
        color = '#ef4444';
    } else if (data.current > 0.01) {
        classification = 'Moderado';
        color = '#f59e0b';
    } else if (data.current >= -0.01) {
        classification = 'Neutral';
        color = '#22c55e';
    } else if (data.current >= -0.1) {
        classification = 'Negativo (Short costoso)';
        color = '#3b82f6';
    } else {
        classification = 'Muy Negativo';
        color = '#8b5cf6';
    }

    if (classificationEl) {
        classificationEl.textContent = classification;
        classificationEl.style.color = color;
    }

    // Renderizar gráfico si hay datos históricos
    if (data.historical && data.labels) {
        renderFundingChart(data.historical, data.labels);
    }
}

// Función para renderizar gráfico de Funding Rate
function renderFundingChart(data, labels) {
    const ctx = document.getElementById('fundingChart');
    if (!ctx) return;

    if (fundingChart) {
        fundingChart.destroy();
    }

    fundingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Funding Rate (%)',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const value = context.parsed.y;
                            return [
                                `Funding Rate: ${value.toFixed(4)}%`,
                                value > 0 ? 'Longs pagan a Shorts' : 'Shorts pagan a Longs',
                                Math.abs(value) > 0.01 ? 'Sentiment fuerte' : 'Sentiment moderado'
                            ];
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        callback: function(value) {
                            return value.toFixed(3) + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        maxTicksLimit: 8
                    }
                }
            }
        }
    });
}

/**
 * Inicializar gráficas de mercado cuando se abre la pestaña
 */
function initializeMarketCharts() {
    // Intentar cargar gráficas del sistema de pestañas NUEVO (pestañas internas en Inicio)
    const graficasTabNuevo = document.querySelector('[data-target="graficas"]');
    
    if (graficasTabNuevo) {
        graficasTabNuevo.addEventListener('click', function() {
            setTimeout(function() {
                const graficasPane = document.getElementById('graficas');
                if (graficasPane && graficasPane.classList.contains('active')) {
                    console.log('🚀 Cargando gráficas de MERCADO...');
                    
                    // Ejecutar en paralelo para mejor performance
                    Promise.allSettled([
                        fetchFearGreed(),
                        fetchFundingRate(),
                        fetchDominance()
                    ]).then(results => {
                        console.log('📊 Resumen de carga de gráficas de mercado:');
                        results.forEach((result, index) => {
                            const names = ['Fear & Greed', 'Funding Rate', 'Dominancia'];
                            if (result.status === 'fulfilled') {
                                console.log(`✅ ${names[index]}: Cargado exitosamente`);
                            } else {
                                console.log(`⚠️ ${names[index]}: ${result.reason}`);
                            }
                        });
                    });
                }
            }, 100);
        });
    } else {
        // Fallback: cargar gráficas del sistema antiguo de pestañas
        const graficasTab = document.getElementById('graficas-tab');
        if (graficasTab) {
            graficasTab.addEventListener('click', function() {
                setTimeout(function() {
                    if (document.getElementById('graficas').classList.contains('active')) {
                        console.log('🚀 Cargando gráficas de MERCADO...');
                        
                        // Ejecutar en paralelo para mejor performance
                        Promise.allSettled([
                            fetchFearGreed(),
                            fetchFundingRate(),
                            fetchDominance()
                        ]).then(results => {
                            console.log('📊 Resumen de carga de gráficas de mercado:');
                            results.forEach((result, index) => {
                                const names = ['Fear & Greed', 'Funding Rate', 'Dominancia'];
                                if (result.status === 'fulfilled') {
                                    console.log(`✅ ${names[index]}: Cargado exitosamente`);
                                } else {
                                    console.log(`⚠️ ${names[index]}: ${result.reason}`);
                                }
                            });
                        });
                    }
                }, 100);
            });
        }
    }
    
    console.log('📊 Sistema de gráficas de MERCADO inicializado');
}

// Ejecutar inicialización cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeMarketCharts();
});

// Exportar funciones para uso global
window.fetchFearGreed = fetchFearGreed;
window.fetchFundingRate = fetchFundingRate;
window.displayFearGreedData = displayFearGreedData;
window.displayFundingRateData = displayFundingRateData;
window.initializeMarketCharts = initializeMarketCharts;

/**
 * Limpiar datos y gráficos de mercado - Llamado en auto-logout
 */
window.clearMarketCharts = function() {
    console.log('[MARKET-CHARTS-CLEAR] 🧹 Limpiando datos de gráficos de mercado...');
    
    // 1. Destruir fear/greed chart
    if (fearGreedChart) {
        try {
            fearGreedChart.destroy();
            fearGreedChart = null;
            console.log('[MARKET-CHARTS-CLEAR] 🔥 Fear/Greed Chart destruido');
        } catch (e) {
            console.warn('[MARKET-CHARTS-CLEAR] ⚠️ Error destruyendo fearGreedChart:', e);
        }
    }
    
    // 2. Destruir funding rate chart
    if (fundingChart) {
        try {
            fundingChart.destroy();
            fundingChart = null;
            console.log('[MARKET-CHARTS-CLEAR] 🔥 Funding Rate Chart destruido');
        } catch (e) {
            console.warn('[MARKET-CHARTS-CLEAR] ⚠️ Error destruyendo fundingChart:', e);
        }
    }
    
    // 3. Limpiar canvas
    const canvasFearGreed = document.getElementById('fearGreedChart');
    if (canvasFearGreed) {
        const ctx = canvasFearGreed.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvasFearGreed.width, canvasFearGreed.height);
        }
    }
    
    const canvasFunding = document.getElementById('fundingRateChart');
    if (canvasFunding) {
        const ctx = canvasFunding.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvasFunding.width, canvasFunding.height);
        }
    }
    
    console.log('[MARKET-CHARTS-CLEAR] ✅ Gráficos de mercado limpiados');
};

