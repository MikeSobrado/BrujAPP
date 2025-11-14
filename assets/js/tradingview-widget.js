// tradingview-widget.js - Carga del widget de TradingView con reintentos mejorados

(function() {
    'use strict';
    
    let tradingViewInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 5;
    
    function initTradingViewCalendar() {
        const container = document.getElementById('tradingview-economic-calendar');
        if (!container) {
            console.log('⚠️ [TradingView] Contenedor no encontrado, reintentando...');
            return false;
        }

        // Si ya está inicializado correctamente, no hacer nada
        if (tradingViewInitialized) {
            console.log('ℹ️ [TradingView] Ya inicializado, ignorando reintentos');
            return true;
        }

        console.log('📊 [TradingView] Inicializando calendario económico (intento ' + (retryCount + 1) + '/' + MAX_RETRIES + ')...');

        try {
            // Limpiar contenedor SOLO si está vacío o tiene placeholder
            if (container.innerHTML.includes('Cargando') || container.innerHTML === '' || container.children.length === 0) {
                container.innerHTML = '';
            } else {
                // Si ya hay contenido de TradingView, no reintentar
                if (container.querySelector('.tradingview-widget-container')) {
                    console.log('ℹ️ [TradingView] Widget ya presente en el DOM');
                    tradingViewInitialized = true;
                    return true;
                }
            }

            // Crear estructura de TradingView
            const widgetContainer = document.createElement('div');
            widgetContainer.className = 'tradingview-widget-container';
            widgetContainer.style.cssText = 'width: 100%; height: 100%;';

            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'tradingview-widget-container__widget';
            widgetDiv.id = 'tradingview-widget-container';

            const copyrightDiv = document.createElement('div');
            copyrightDiv.className = 'tradingview-widget-copyright';
            copyrightDiv.innerHTML = '<a href="https://es.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';

            widgetContainer.appendChild(widgetDiv);
            widgetContainer.appendChild(copyrightDiv);
            container.appendChild(widgetContainer);

            // Crear script con configuración correcta
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
            script.async = true;
            
            // Configuración como atributo data (más confiable)
            script.setAttribute('data-colorTheme', 'light');
            script.setAttribute('data-isTransparent', 'false');
            script.setAttribute('data-locale', 'es');
            script.setAttribute('data-countryFilter', 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu');
            script.setAttribute('data-importanceFilter', '0,1');
            script.setAttribute('data-width', '400');
            script.setAttribute('data-height', '550');

            // Configuración alternativa en innerHTML (por si falla data)
            script.innerHTML = `{
                "colorTheme": "light",
                "isTransparent": false,
                "locale": "es",
                "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
                "importanceFilter": "0,1",
                "width": 400,
                "height": 550
            }`;

            // Evento para verificar si el widget se cargó correctamente
            script.onload = function() {
                console.log('✅ [TradingView] Script cargado desde CDN');
                tradingViewInitialized = true;
                retryCount = 0; // Reset en caso de éxito
            };

            script.onerror = function() {
                console.error('❌ [TradingView] Error al cargar script de CDN');
                tradingViewInitialized = false;
                retryCount++;
                // No permitir reintentos infinitos
            };

            // Agregar el script al widget container
            widgetDiv.appendChild(script);
            
            // Esperar a que el widget se cargue (TradingView lo hace async)
            // No marcar como inicializado hasta que realmente se cargue
            setTimeout(() => {
                if (widgetDiv.innerHTML.includes('tradingview')) {
                    console.log('✅ [TradingView] Widget detectado en el DOM');
                    tradingViewInitialized = true;
                } else {
                    console.log('⏳ [TradingView] Esperando a que TradingView cargue el widget...');
                }
            }, 1000);
            
            console.log('📍 [TradingView] Estructura HTML creada y script agregado');
            return true;
            
        } catch (error) {
            console.error('❌ [TradingView] Error durante inicialización:', error);
            tradingViewInitialized = false;
            retryCount++;
            return false;
        }
    }

    function loadTradingView() {
        // Si ya está inicializado, no reintentar
        if (tradingViewInitialized) {
            console.log('ℹ️ [TradingView] Ya inicializado correctamente');
            return;
        }

        // Verificar límite de reintentos
        if (retryCount >= MAX_RETRIES) {
            console.warn('⚠️ [TradingView] Se alcanzó el límite de reintentos (' + MAX_RETRIES + ')');
            return;
        }

        // Esperar a que la pestaña Gráficas esté activa
        const graficasTab = document.getElementById('graficas');
        if (!graficasTab || !graficasTab.classList.contains('active')) {
            console.log('📊 [TradingView] Esperando a que se active la pestaña Gráficas...');
            retryCount++;
            setTimeout(loadTradingView, 500);
            return;
        }

        // Intentar inicializar
        const success = initTradingViewCalendar();
        if (success) {
            console.log('✅ [TradingView] Widget inicializado exitosamente en intento ' + (retryCount + 1));
            retryCount = 0;
        } else {
            console.warn('⚠️ [TradingView] Fallo en intento ' + (retryCount + 1) + ', reintentando...');
            retryCount++;
            setTimeout(loadTradingView, 1000);
        }
    }

    // Cargar cuando se activa la pestaña de gráficas (evento click)
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'graficas-tab' || e.target.closest('#graficas-tab'))) {
            console.log('📊 [TradingView] Pestaña Gráficas clickeada, iniciando carga...');
            setTimeout(loadTradingView, 300);
        }
    });

    // Evento Bootstrap cuando la pestaña se muestra (más confiable que click)
    const graficasLink = document.getElementById('graficas-tab');
    if (graficasLink) {
        graficasLink.addEventListener('shown.bs.tab', function() {
            console.log('📊 [TradingView] Evento shown.bs.tab detectado, iniciando carga...');
            setTimeout(loadTradingView, 300);
        });
        
        // Resetear cuando se oculta la pestaña (para que recargue al volver)
        graficasLink.addEventListener('hidden.bs.tab', function() {
            console.log('📊 [TradingView] Pestaña Gráficas oculta, preparándose para recarga...');
            tradingViewInitialized = false;
            retryCount = 0;
        });
    }

    // También intentar cargar si ya estamos en la pestaña de gráficas
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📊 [TradingView] DOMContentLoaded - verificando si gráficas ya activa...');
        setTimeout(function() {
            const graficasTab = document.getElementById('graficas');
            if (graficasTab && graficasTab.classList.contains('active')) {
                console.log('📊 [TradingView] Ya en pestaña Gráficas, iniciando carga...');
                loadTradingView();
            }
        }, 1500);
    });

    // Escuchar evento Bootstrap tab.shown para mayor confiabilidad
    document.addEventListener('shown.bs.tab', function(e) {
        if (e.target && (e.target.id === 'graficas-tab' || e.target.getAttribute('data-bs-target') === '#graficas')) {
            console.log('🔔 [TradingView] Evento shown.bs.tab para gráficas, iniciando carga...');
            setTimeout(loadTradingView, 300);
        }
    });

    // Exportar función para uso manual si es necesario
    window.loadTradingViewWidget = loadTradingView;
    
    // Log de inicialización
    console.log('📊 [TradingView] Script cargado y listo para inicializar widget');
})();