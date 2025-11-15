// dominance.js - Funcionalidad de dominancia para dashboard principal

// Función para obtener la URL del proxy según el entorno
function getDominanceProxyUrl() {
    // En desarrollo local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/global-metrics';
    }
    // En producción (GitHub Pages), usar proxy de Render
    return 'https://trading-dome-dashboard.onrender.com/api/global-metrics';
}

// Detectar si estamos en desarrollo local
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

// Variable global para el gráfico de dominancia
let dominanceChart = null;

/**
 * Función principal para obtener y mostrar datos de dominancia.
 * Adaptada para funcionar en local y en GitHub Pages
 */
async function fetchDominance() {
    try {
        console.log('🔄 Cargando datos de dominancia...');
        console.log('🌍 Hostname:', window.location.hostname);
        console.log('🔍 Es desarrollo local:', isLocalDevelopment);
        
        // Mostrar loading state
        showDominanceLoading();
        
        // Intentar usar caché primero (solo si estamos en el mismo entorno)
        const cachedData = getDominanceFromCache();
        if (cachedData && !shouldSkipCache()) {
            console.log('📁 Usando datos de dominancia desde caché');
            restoreDominanceHTML();
            renderDominanceChart(cachedData.btc_dominance, cachedData.eth_dominance, cachedData.others_dominance);
            updateDominanceData(cachedData);
            document.getElementById('dominance-last-update').textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
            return;
        }

        let dominanceData;

        // Obtener la clave de CMC del input del formulario (más directo que sessionStorage)
        const cmcApiKeyInput = document.getElementById('coinmarketcap-api-key');
        let cmcApiKey = cmcApiKeyInput ? cmcApiKeyInput.value.trim() : '';
        
        console.log('🔐 API Key de CoinMarketCap:', cmcApiKey ? '✓ (longitud: ' + cmcApiKey.length + ')' : '✗ NO CONFIGURADA');

        if (!cmcApiKey) {
            console.warn('⚠️ API Key de CoinMarketCap no configurada. Generando datos simulados.');
            console.log('💡 Nota: Ingresa tu clave en [APIs] tab para usar datos reales de CoinMarketCap');
            dominanceData = generateRealisticDominanceData();
        } else {
            // Usar el proxy (local o Render)
            const proxyUrl = getDominanceProxyUrl();
            console.log(`🔗 Usando proxy: ${proxyUrl}`);
            console.log(`📡 Enviando request con CMC API Key...`);
            
            try {
                const url = new URL(proxyUrl);
                url.searchParams.append('key', cmcApiKey);
                
                const response = await fetch(url.toString());
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const apiData = await response.json();
                console.log('📊 Respuesta de CoinMarketCap:', apiData);
                
                if (!apiData || !apiData.data) {
                    throw new Error('Respuesta de API inválida - estructura inesperada');
                }

                // Extraer datos reales
                const btcDominance = apiData.data.btc_dominance;
                const ethDominance = apiData.data.eth_dominance;
                const othersDominance = 100 - btcDominance - ethDominance;

                dominanceData = {
                    btc_dominance: btcDominance,
                    eth_dominance: ethDominance,
                    others_dominance: othersDominance,
                    timestamp: Date.now(),
                    source: 'CoinMarketCap Real'
                };
                
                console.log('✅ Datos REALES de CoinMarketCap obtenidos:', {
                    btc: btcDominance + '%',
                    eth: ethDominance + '%',
                    others: othersDominance.toFixed(2) + '%'
                });
            } catch (error) {
                console.warn('⚠️ Error al obtener datos reales de CoinMarketCap:', error.message);
                console.log('💾 Usando datos simulados como fallback');
                dominanceData = generateRealisticDominanceData();
                dominanceData.source = 'Simulados (error en API)';
            }
        }

        // Guardar en caché
        saveDominanceToCache(dominanceData);
        
        // Restaurar HTML y mostrar datos
        restoreDominanceHTML();
        renderDominanceChart(dominanceData.btc_dominance, dominanceData.eth_dominance, dominanceData.others_dominance);
        updateDominanceData(dominanceData);
        
        document.getElementById('dominance-last-update').textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
        
        console.log('✅ Datos de dominancia cargados exitosamente');

    } catch (error) {
        console.error('❌ Error al cargar dominancia:', error);
        showDominanceError(error.message);
    }
}

/**
 * Genera datos de dominancia realistas para GitHub Pages
 * (cuando no hay API Key o falla la conexión)
 */
function generateRealisticDominanceData() {
    // Datos basados en rangos típicos del mercado crypto
    const btcDominance = 52 + (Math.random() * 10); // 52-62%
    const ethDominance = 15 + (Math.random() * 5);  // 15-20%
    const othersDominance = 100 - btcDominance - ethDominance;

    return {
        btc_dominance: parseFloat(btcDominance.toFixed(2)),
        eth_dominance: parseFloat(ethDominance.toFixed(2)),
        others_dominance: parseFloat(othersDominance.toFixed(2)),
        timestamp: Date.now(),
        source: 'Simulados (sin API Key)',
        isSimulated: true
    };
}

/**
 * Determina si debe saltar la caché
 */
function shouldSkipCache() {
    // Limpiar caché antigua después de cambios en el proxy
    const PROXY_VERSION_KEY = 'dominanceProxyVersion';
    const currentVersion = '2.0-render'; // Incrementa si cambias lógica del proxy
    const lastVersion = localStorage.getItem(PROXY_VERSION_KEY);
    
    if (lastVersion !== currentVersion) {
        console.log('🔄 Nueva versión del proxy detectada, limpiando caché');
        localStorage.removeItem('dominanceData');
        localStorage.setItem(PROXY_VERSION_KEY, currentVersion);
        return true;
    }
    
    return false;
}

function showDominanceLoading() {
    const dominanceSection = document.getElementById('dominance-section');
    if (dominanceSection) {
        dominanceSection.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="color: #eaeaea; font-size: 16px; margin-bottom: 10px;">
                    🔄 Cargando datos de dominancia...
                </div>
                <div style="color: #888; font-size: 12px;">
                    Conectando con CoinMarketCap
                </div>
            </div>
        `;
    }
}

function showDominanceError(message) {
    const dominanceSection = document.getElementById('dominance-section');
    if (dominanceSection) {
        dominanceSection.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="color: #ff4757; font-size: 16px; margin-bottom: 10px;">
                    ❌ Error al cargar dominancia
                </div>
                <div style="color: #888; font-size: 12px;">
                    ${message}
                </div>
                <button onclick="fetchDominance()" style="margin-top: 15px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

function restoreDominanceHTML() {
    const dominanceSection = document.getElementById('dominance-section');
    if (dominanceSection) {
        dominanceSection.innerHTML = `
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
        `;
    }
}

// Cache de dominancia usando el sistema centralizado
function getDominanceFromCache() {
    // Intentar cargar de sessionStorage cifrado primero
    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
        const chartsData = SessionStorageManager.loadChartsData();
        if (chartsData && chartsData.dominance && chartsData.dominance.data) {
            const data = chartsData.dominance.data;
            // Verificar si está dentro del tiempo válido (4 horas)
            if (Date.now() - (data.timestamp || 0) < 14400000) {
                return data;
            }
        }
    }
    
    // Fallback a cache en memoria
    if (!window.cache) return null;
    return window.cache.get('dominanceData', 'dominance');
}

function saveDominanceToCache(dominanceData) {
    // Guardar en sessionStorage cifrado si está disponible
    if (typeof SessionStorageManager !== 'undefined' && SessionStorageManager.getEncryptionKey()) {
        const chartsData = SessionStorageManager.loadChartsData() || {};
        chartsData.dominance = {
            data: dominanceData,
            timestamp: Date.now()
        };
        SessionStorageManager.saveChartsData(chartsData);
    }
    
    // También guardar en cache en memoria
    if (!window.cache) return;
    window.cache.set('dominanceData', dominanceData, { 
        namespace: 'dominance',
        maxAge: 14400000 // 4 horas
    });
}

function renderDominanceChart(btcDominance, ethDominance, othersDominance) {
    const ctx = document.getElementById('dominanceChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (dominanceChart) {
        dominanceChart.destroy();
    }

    dominanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Bitcoin', 'Ethereum', 'Otros'],
            datasets: [{
                data: [btcDominance, ethDominance, othersDominance],
                backgroundColor: ['#FF9500', '#627EEA', '#8A92B2'],
                borderWidth: 2,
                borderColor: '#1a2332'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function updateDominanceData(data) {
    // Actualizar valores actuales
    document.getElementById('btc-dominance').textContent = data.btc_dominance.toFixed(1) + '%';
    document.getElementById('eth-dominance').textContent = data.eth_dominance.toFixed(1) + '%';
    document.getElementById('others-dominance').textContent = data.others_dominance.toFixed(1) + '%';

    // Agregar indicador de si son datos reales o simulados
    const dataSourceBadge = document.getElementById('dominance-data-source');
    if (dataSourceBadge) {
        if (data.isSimulated) {
            dataSourceBadge.innerHTML = '<span class="badge bg-warning text-dark">📊 Datos Simulados (sin API Key)</span>';
            dataSourceBadge.style.display = 'inline-block';
            console.log('⚠️ Mostrando datos SIMULADOS de dominancia');
        } else if (data.source === 'CoinMarketCap Real') {
            dataSourceBadge.innerHTML = '<span class="badge bg-success">✅ Datos Reales (CoinMarketCap)</span>';
            dataSourceBadge.style.display = 'inline-block';
            console.log('✅ Mostrando datos REALES de CoinMarketCap');
        } else if (data.source && data.source.includes('error')) {
            dataSourceBadge.innerHTML = '<span class="badge bg-danger">❌ Error en API (datos de fallback)</span>';
            dataSourceBadge.style.display = 'inline-block';
        }
    }

    // Simular cambios (en el original estos vendrían de datos históricos)
    document.getElementById('btc-change').textContent = '+0.1%';
    document.getElementById('btc-change').className = 'crypto-change positive';
    
    document.getElementById('eth-change').textContent = '-0.1%';
    document.getElementById('eth-change').className = 'crypto-change negative';
    
    document.getElementById('others-change').textContent = '0.0%';
    document.getElementById('others-change').className = 'crypto-change neutral';

    // Simular datos históricos (en el original estos vendrían de la API)
    const btc = data.btc_dominance;
    const eth = data.eth_dominance;
    const others = data.others_dominance;

    // Ayer
    document.getElementById('yesterday-btc').textContent = (btc - 0.1).toFixed(1) + '%';
    document.getElementById('yesterday-eth').textContent = (eth + 0.1).toFixed(1) + '%';
    document.getElementById('yesterday-others').textContent = (others + 0.0).toFixed(1) + '%';

    // Semana pasada
    document.getElementById('week-btc').textContent = (btc - 0.5).toFixed(1) + '%';
    document.getElementById('week-eth').textContent = (eth + 0.3).toFixed(1) + '%';
    document.getElementById('week-others').textContent = (others + 0.2).toFixed(1) + '%';

    // Mes pasado
    document.getElementById('month-btc').textContent = (btc + 1.2).toFixed(1) + '%';
    document.getElementById('month-eth').textContent = (eth - 0.8).toFixed(1) + '%';
    document.getElementById('month-others').textContent = (others - 0.4).toFixed(1) + '%';

    // Máximos del año
    document.getElementById('max-btc').textContent = (btc + 5.0).toFixed(1) + '%';
    document.getElementById('max-eth').textContent = (eth + 2.0).toFixed(1) + '%';
    document.getElementById('max-others').textContent = (others + 3.0).toFixed(1) + '%';

    // Mínimos del año
    document.getElementById('min-btc').textContent = (btc - 3.0).toFixed(1) + '%';
    document.getElementById('min-eth').textContent = (eth - 1.5).toFixed(1) + '%';
    document.getElementById('min-others').textContent = (others - 4.0).toFixed(1) + '%';
}

/**
 * Función para mostrar datos de dominancia desde sessionStorage
 * Usada por graficas.html para cargar datos sin hacer nuevas peticiones a la API
 */
function displayDominanceData(data) {
    if (!data) return;
    restoreDominanceHTML();
    renderDominanceChart(data.btc_dominance, data.eth_dominance, data.others_dominance);
    updateDominanceData(data);
    document.getElementById('dominance-last-update').textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
}

// Exportar funciones para uso en otros scripts
window.fetchDominance = fetchDominance;
window.displayDominanceData = displayDominanceData;

/**
 * Limpiar datos y gráficos de dominancia - Llamado en auto-logout
 */
window.clearDominanceData = function() {
    console.log('[DOMINANCE-CLEAR] 🧹 Limpiando datos de dominancia...');
    
    // 1. Destruir chart
    if (dominanceChart) {
        try {
            dominanceChart.destroy();
            dominanceChart = null;
            console.log('[DOMINANCE-CLEAR] 🔥 Gráfico de dominancia destruido');
        } catch (e) {
            console.warn('[DOMINANCE-CLEAR] ⚠️ Error destruyendo dominanceChart:', e);
        }
    }
    
    // 2. Limpiar canvas
    const canvasDominance = document.getElementById('dominanceChart');
    if (canvasDominance) {
        const ctx = canvasDominance.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvasDominance.width, canvasDominance.height);
        }
    }
    
    // 3. Limpiar HTML del contenedor si existe
    const dominanceContainer = document.getElementById('dominance-container');
    if (dominanceContainer) {
        dominanceContainer.innerHTML = '';
    }
    
    console.log('[DOMINANCE-CLEAR] ✅ Datos de dominancia limpiados');
};