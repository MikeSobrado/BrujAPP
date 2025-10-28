// --- FUNCIONES GLOBALES DEL MERCADO ---

// Función para cargar los widgets de TradingView (debe ser global para que tabs.js pueda llamarla)
function loadTradingViewWidgets() {
    // Evitar recargar los widgets si ya están cargados
    if (document.getElementById('tradingview-advanced-chart').querySelector('script')) {
        return;
    }

    // --- Widget 1: Gráfico Avanzado ---
    const advancedChartContainer = document.getElementById('tradingview-advanced-chart');
    const advancedChartScript = document.createElement('script');
    advancedChartScript.type = 'text/javascript';
    advancedChartScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    advancedChartScript.async = true;
    advancedChartScript.innerHTML = JSON.stringify({
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": false,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "es",
        "save_image": true,
        "style": "1",
        "symbol": "BITSTAMP:BTCUSD",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "#0F0F0F",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "compareSymbols": [],
        "show_popup_button": true,
        "popup_height": "650",
        "popup_width": "1000",
        "studies": [],
        "autosize": true
    });
    advancedChartContainer.appendChild(advancedChartScript);

        // --- Widget 1.5: Gráfico de Resumen de BTC (NUEVO) ---
    const btcOverviewContainer = document.getElementById('btc-overview-widget');
    const btcOverviewScript = document.createElement('script');
    btcOverviewScript.type = 'text/javascript';
    btcOverviewScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    btcOverviewScript.async = true;
    btcOverviewScript.innerHTML = JSON.stringify({
        "symbols": [
            [
                "BINANCE:BTCUSDT"
            ]
        ],
        "chartOnly": false,
        "width": "100%",
        "height": "150",
        "locale": "es",
        "colorTheme": "dark",
        "autosize": true,
        "showVolume": false,
        "showMA": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
        "fontSize": "10",
        "noTimeScale": false,
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "chartType": "area",
        "maLineColor": "#2962FF",
        "maLineWidth": 1,
        "maLength": 9,
        "lineWidth": 2,
        "lineType": 0,
        "dateRanges": [
            "1d|1",
            "1m|30",
            "3m|60",
            "12m|1D",
            "60m|1W",
            "all|1M"
        ]
    });
    btcOverviewContainer.appendChild(btcOverviewScript);

    // --- Widget 2: Mercado de Criptomonedas ---
    const cryptoScreenerContainer = document.getElementById('crypto-screener-widget');
    const cryptoScreenerScript = document.createElement('script');
    cryptoScreenerScript.type = 'text/javascript';
    cryptoScreenerScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    cryptoScreenerScript.async = true;
    cryptoScreenerScript.innerHTML = JSON.stringify({
    "defaultColumn": "overview",
    "screener_type": "crypto_mkt",
    "displayCurrency": "USD",
    "colorTheme": "dark",
    "isTransparent": false,
    "locale": "es",
    "width": "100%",
    "height": "500"
    });
    cryptoScreenerContainer.appendChild(cryptoScreenerScript);

    // --- Widget 3: Datos de Mercado ---
    const marketOverviewContainer = document.getElementById('market-overview-widget');
    const marketOverviewScript = document.createElement('script');
    marketOverviewScript.type = 'text/javascript';
    marketOverviewScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    marketOverviewScript.async = true;
    marketOverviewScript.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "locale": "es",
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "backgroundColor": "#0F0F0F",
        "support_host": "https://www.tradingview.com",
        "width": "100%",
        "height": "550",
        "symbolsGroups": [
            { "name": "Indices", "symbols": [
                { "name": "FOREXCOM:SPXUSD", "displayName": "S&P 500 Index" },
                { "name": "FOREXCOM:NSXUSD", "displayName": "US 100 Cash CFD" },
                { "name": "FOREXCOM:DJI", "displayName": "Dow Jones Industrial Average Index" },
                { "name": "INDEX:NKY", "displayName": "Japan 225" },
                { "name": "INDEX:DEU40", "displayName": "DAX Index" },
                { "name": "FOREXCOM:UKXGBP", "displayName": "FTSE 100 Index" }
            ]},
            { "name": "Futures", "symbols": [
                { "name": "BMFBOVESPA:ISP1!", "displayName": "S&P 500" },
                { "name": "BMFBOVESPA:EUR1!", "displayName": "Euro" },
                { "name": "CMCMARKETS:GOLD", "displayName": "Gold" },
                { "name": "PYTH:WTI3!", "displayName": "WTI Crude Oil" },
                { "name": "BMFBOVESPA:CCM1!", "displayName": "Corn" },
                { "name": "MCX:SILVER1!", "displayName": "Silver" }
            ]},
            { "name": "Bonds", "symbols": [
                { "name": "EUREX:FGBL1!", "displayName": "Euro Bund" },
                { "name": "EUREX:FBTP1!", "displayName": "Euro BTP" },
                { "name": "EUREX:FGBM1!", "displayName": "Euro BOBL" }
            ]},
            { "name": "Forex", "symbols": [
                { "name": "FX:EURUSD", "displayName": "EUR to USD" },
                { "name": "FX:GBPUSD", "displayName": "GBP to USD" },
                { "name": "FX:USDJPY", "displayName": "USD to JPY" },
                { "name": "FX:USDCHF", "displayName": "USD to CHF" },
                { "name": "FX:AUDUSD", "displayName": "AUD to USD" },
                { "name": "FX:USDCAD", "displayName": "USD to CAD" }
            ]}
        ]
    });
    marketOverviewContainer.appendChild(marketOverviewScript);

    // --- Widget 4: Calendario Económico ---
    const calendarContainer = document.getElementById('economic-calendar-widget');
    const calendarScript = document.createElement('script');
    calendarScript.type = 'text/javascript';
    calendarScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    calendarScript.async = true;
    calendarScript.innerHTML = JSON.stringify({
        "colorTheme": "dark",
        "isTransparent": false,
        "locale": "es",
        "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
        "importanceFilter": "0,1",
        "width": "100%",
        "height": "550"
    });
    calendarContainer.appendChild(calendarScript);
}


// --- INICIALIZACIÓN DEL MÓDULO MERCADO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Módulo de mercado inicializado. Los widgets se cargarán dinámicamente.");
});
