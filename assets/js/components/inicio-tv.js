/**
 * TradingView Widget Initialization
 * Inyecta el widget avanzado de TradingView en el contenedor
 * Soporta cambios dinámicos de tema sin recargar la página
 */

let currentTheme = 'light';

function getThemeConfig() {
    return currentTheme === 'dark'
        ? {
            theme: 'dark',
            backgroundColor: '#0F0F0F',
            gridColor: 'rgba(242, 242, 242, 0.06)'
        }
        : {
            theme: 'light',
            backgroundColor: '#ffffff',
            gridColor: 'rgba(46, 46, 46, 0.06)'
        };
}

function getFullConfig() {
    return {
        allow_symbol_change: true,
        calendar: false,
        details: false,
        hide_side_toolbar: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_volume: false,
        hotlist: false,
        interval: 'D',
        locale: 'es',
        save_image: true,
        style: '1',
        symbol: 'BINANCE:BTCUSDT',
        timezone: 'Etc/UTC',
        watchlist: [],
        withdateranges: false,
        compareSymbols: [],
        show_popup_button: true,
        popup_height: '650',
        popup_width: '1000',
        studies: [],
        autosize: true,
        ...getThemeConfig()
    };
}

function detectTheme() {
    // Detectar desde data-bs-theme
    const htmlTheme = document.documentElement.getAttribute('data-bs-theme');
    if (htmlTheme) {
        return htmlTheme === 'dark' ? 'dark' : 'light';
    }
    
    // Detectar desde localStorage
    const storedTheme = localStorage.getItem('crysapp-theme');
    if (storedTheme) {
        return storedTheme === 'dark' ? 'dark' : 'light';
    }
    
    return 'light';
}

function initTradingViewWidget() {
    const container = document.getElementById('tradingview-chart-container');
    
    if (!container) {
        console.warn('[TV] Contenedor no encontrado, reintentando...');
        setTimeout(initTradingViewWidget, 500);
        return;
    }

    console.log(`[TV] Contenedor encontrado, inyectando widget (tema: ${currentTheme})...`);

    // HTML del widget - sin el script
    const widgetHTML = `
        <!-- TradingView Widget BEGIN -->
        <div class="tradingview-widget-container" style="height:100%;width:100%">
          <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
          <div class="tradingview-widget-copyright"><a href="https://es.tradingview.com/symbols/BTCUSDT/?exchange=BINANCE" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div>
        </div>
        <!-- TradingView Widget END -->
    `;

    container.innerHTML = widgetHTML;

    // Crear y agregar el script de TradingView dinámicamente
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    // Configuración del widget con tema actual
    const config = getFullConfig();
    script.textContent = JSON.stringify(config);

    // Agregar el script al widget container
    const widgetDiv = container.querySelector('.tradingview-widget-container__widget');
    if (widgetDiv) {
        widgetDiv.appendChild(script);
        console.log('[TV] Widget inyectado correctamente');
    }
}

function reloadTradingViewWidget() {
    const newTheme = detectTheme();
    
    // Solo recargar si el tema cambió
    if (newTheme !== currentTheme) {
        console.log(`[TV] Tema cambió de ${currentTheme} a ${newTheme}, recargando widget...`);
        currentTheme = newTheme;
        initTradingViewWidget();
    }
}

function setupThemeListeners() {
    console.log('[TV] Configurando listeners de tema...');
    
    // Listener para cambios en localStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'crysapp-theme') {
            console.log(`[TV] Cambio de tema detectado en storage: ${e.newValue}`);
            reloadTradingViewWidget();
        }
    });

    // MutationObserver para cambios en data-bs-theme
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-bs-theme') {
                const newTheme = document.documentElement.getAttribute('data-bs-theme');
                console.log(`[TV] Cambio de tema detectado en HTML: ${newTheme}`);
                reloadTradingViewWidget();
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme']
    });

    // Listener en ThemeManager si existe
    if (window.TradingDome?.ThemeManager?.toggle) {
        const originalToggle = window.TradingDome.ThemeManager.toggle;
        window.TradingDome.ThemeManager.toggle = function() {
            console.log('[TV] Toggle de tema disparado');
            originalToggle.call(this);
            setTimeout(reloadTradingViewWidget, 100);
        };
    }

    if (window.TradingDome?.ThemeManager?.setTheme) {
        const originalSetTheme = window.TradingDome.ThemeManager.setTheme;
        window.TradingDome.ThemeManager.setTheme = function(theme) {
            console.log(`[TV] setTheme disparado: ${theme}`);
            originalSetTheme.call(this, theme);
            setTimeout(reloadTradingViewWidget, 100);
        };
    }

    // Polling continuo como fallback (chequea cada 500ms)
    setInterval(() => {
        const detectedTheme = detectTheme();
        if (detectedTheme !== currentTheme) {
            console.log(`[TV] Cambio de tema detectado por polling: ${currentTheme} -> ${detectedTheme}`);
            reloadTradingViewWidget();
        }
    }, 500);
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        currentTheme = detectTheme();
        initTradingViewWidget();
        setupThemeListeners();
    });
} else {
    currentTheme = detectTheme();
    initTradingViewWidget();
    setupThemeListeners();
}
