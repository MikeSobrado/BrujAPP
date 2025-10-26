// --- FUNCIONES GLOBALES DEL MERCADO ---

// Función para cargar los widgets de TradingView (debe ser global para que tabs.js pueda llamarla)
function loadTradingViewWidgets() {
    // Evitar recargar los widgets si ya están cargados
    if (document.getElementById('tradingview_chart').innerHTML !== '') {
        return;
    }
    
    // Widget de Gráfico Avanzado
    const tradingViewScript = document.createElement('script');
    tradingViewScript.type = 'text/javascript';
    tradingViewScript.src = 'https://s3.tradingview.com/tv.js';
    tradingViewScript.onload = function() {
        new TradingView.widget({
            "width": "100%",
            "height": 500,
            "symbol": "BINANCE:BTCUSDT",
            "interval": "D",
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "es",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "allow_symbol_change": true,
            "container_id": "tradingview_chart"
        });
    };
    document.head.appendChild(tradingViewScript);
    
    // Widget de Mercado de Criptomonedas
    const cryptoMarketScript = document.createElement('script');
    cryptoMarketScript.type = 'text/javascript';
    cryptoMarketScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    cryptoMarketScript.onload = function() {
        const container = document.getElementById('crypto-market-widget');
        container.innerHTML = '';
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": 400,
            "defaultColumn": "overview",
            "screener_type": "crypto_mkt",
            "displayCurrency": "USD",
            "colorTheme": "dark",
            "locale": "es"
        });
        container.appendChild(script);
    };
    document.head.appendChild(cryptoMarketScript);
    
    // Widget de Datos de Mercado
    const marketDataScript = document.createElement('script');
    marketDataScript.type = 'text/javascript';
    marketDataScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    marketDataScript.onload = function() {
        const container = document.getElementById('market-data-widget');
        container.innerHTML = '';
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": 300,
            "symbolsGroups": [
                {
                    "name": "Índices",
                    "originalName": "Indices",
                    "symbols": [
                        { "name": "FOREXCOM:SPXUSD", "displayName": "S&P 500" },
                        { "name": "FOREXCOM:NSXUSD", "displayName": "Nasdaq 100" },
                        { "name": "FOREXCOM:DJI", "displayName": "Dow 30" }
                    ]
                },
                {
                    "name": "Divisas",
                    "originalName": "Forex",
                    "symbols": [
                        { "name": "FX:EURUSD", "displayName": "EUR/USD" },
                        { "name": "FX:GBPUSD", "displayName": "GBP/USD" },
                        { "name": "FX:USDJPY", "displayName": "USD/JPY" }
                    ]
                }
            ],
            "colorTheme": "dark",
            "locale": "es"
        });
        container.appendChild(script);
    };
    document.head.appendChild(marketDataScript);
    
    // Widget de Calendario Económico
    const economicCalendarScript = document.createElement('script');
    economicCalendarScript.type = 'text/javascript';
    economicCalendarScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    economicCalendarScript.onload = function() {
        const container = document.getElementById('economic-calendar-widget');
        container.innerHTML = '';
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.innerHTML = JSON.stringify({
            "width": "100%",
            "height": 300,
            "colorTheme": "dark",
            "locale": "es"
        });
        container.appendChild(script);
    };
    document.head.appendChild(economicCalendarScript);
}

// Función para cargar los gráficos personalizados (debe ser global)
function loadCustomCharts() {
    // Evitar recargar los gráficos si ya están cargados
    if (document.getElementById('fear-greed-chart').innerHTML !== '') {
        return;
    }
    
    // Gráfico de Fear & Greed Index
    createFearGreedChart();
    
    // Gráfico de Dominancia de Bitcoin
    createBTCDominanceChart();
}

// Funciones auxiliares para los gráficos (deben ser globales)
function createFearGreedChart() {
    const ctx = document.getElementById('fear-greed-chart').getContext('2d');
    
    // Datos de ejemplo - en una implementación real, obtendrías estos datos de una API
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
        data.push(Math.floor(Math.random() * 100));
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fear & Greed Index',
                data: data,
                borderColor: '#00ffff',
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#b0b0b0' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#b0b0b0' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f0f0f0' }
                }
            }
        }
    });
}

function createBTCDominanceChart() {
    const ctx = document.getElementById('btc-dominance-chart').getContext('2d');
    
    // Datos de ejemplo - en una implementación real, obtendrías estos datos de una API
    const labels = [];
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
        data.push(40 + Math.random() * 10);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Dominancia de Bitcoin (%)',
                data: data,
                borderColor: '#ff9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 35,
                    max: 55,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#b0b0b0',
                        callback: function(value) { return value + '%'; }
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#b0b0b0' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f0f0f0' }
                }
            }
        }
    });
}


// --- INICIALIZACIÓN DEL MÓDULO MERCADO ---
// Este bloque se ejecuta solo cuando el DOM está listo.
// Para este módulo, no hay una inicialización automática, ya que todo se carga bajo demanda.
// Dejamos el bloque para mantener la consistencia en la estructura del proyecto.
document.addEventListener('DOMContentLoaded', () => {
    // No se requiere ninguna acción inicial aquí, ya que los widgets y gráficos
    // se cargan cuando el usuario accede a la pestaña "Mercado".
    console.log("Módulo de mercado inicializado y listo para cargar contenido bajo demanda.");
});