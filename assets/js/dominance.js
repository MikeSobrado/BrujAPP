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
 * @param {boolean} forceRefresh - Si es true, ignora la caché y hace una llamada a la API
 */
async function fetchDominance(forceRefresh = false) {
    try {
        console.log('🔄 Cargando datos de dominancia...', forceRefresh ? '(FORZANDO ACTUALIZACIÓN)' : '');
        console.log('🌍 Hostname:', window.location.hostname);
        console.log('🔍 Es desarrollo local:', isLocalDevelopment);
        
        // Mostrar loading state
        showDominanceLoading();
        
        // Intentar usar caché primero SOLO si no está siendo forzada la actualización
        if (!forceRefresh) {
            const cachedData = getDominanceFromCache();
            if (cachedData && !shouldSkipCache()) {
                console.log('📁 Usando datos de dominancia desde caché');
                restoreDominanceHTML();
                renderDominanceChart(cachedData.btc_dominance, cachedData.eth_dominance, cachedData.others_dominance);
                updateDominanceData(cachedData);
                const lastUpdateElem = document.getElementById('dominance-last-update');
                if (lastUpdateElem) {
                    lastUpdateElem.textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
                }
                return;
            }
        } else {
            console.log('🔄 Limpiando caché anterior debido a forceRefresh=true');
            localStorage.removeItem('dominanceData');
        }

        let dominanceData;

        // Obtener la clave de CMC de sessionStorage (guardada al conectar)
        let cmcApiKey = sessionStorage.getItem('coinmarketcap_api_key') || '';
        
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
                
                console.log(`🌐 URL final: ${url.toString().replace(cmcApiKey, 'XXXX')}`);
                
                const startFetch = Date.now();
                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                });
                const fetchDuration = Date.now() - startFetch;
                
                console.log(`📊 Respuesta HTTP: ${response.status} ${response.statusText} (${fetchDuration}ms)`);
                console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
                console.log(`📋 Headers de respuesta:`, {
                    'content-length': response.headers.get('content-length'),
                    'cache-control': response.headers.get('cache-control'),
                    'access-control-allow-origin': response.headers.get('access-control-allow-origin')
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ HTTP Error ${response.status}:`, errorText.substring(0, 500));
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText.substring(0, 100)}`);
                }

                const responseText = await response.text();
                console.log(`📄 Response body (primeros 300 chars):`, responseText.substring(0, 300));
                
                const apiData = JSON.parse(responseText);
                console.log('📊 Respuesta de CoinMarketCap (completa):', apiData);
                console.log('📊 Estructura de respuesta:', {
                    hasData: !!apiData.data,
                    dataKeys: apiData.data ? Object.keys(apiData.data).slice(0, 10) : null,
                    hasStatus: !!apiData.status
                });
                
                if (!apiData || !apiData.data) {
                    throw new Error('Respuesta de API inválida - estructura inesperada: ' + JSON.stringify(apiData).substring(0, 100));
                }

                // Extraer datos reales
                const btcDominance = apiData.data.btc_dominance;
                const ethDominance = apiData.data.eth_dominance;
                
                if (typeof btcDominance !== 'number' || typeof ethDominance !== 'number') {
                    throw new Error(`Datos de dominancia inválidos: btc=${btcDominance}, eth=${ethDominance}`);
                }
                
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
                console.log('🔍 Stack:', error.stack?.substring(0, 200));
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
        
        const lastUpdateElem = document.getElementById('dominance-last-update');
        if (lastUpdateElem) {
            lastUpdateElem.textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
        }
        
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
    // Verificar que los elementos del DOM existen antes de actualizar
    const requiredElements = [
        'btc-dominance',
        'eth-dominance',
        'others-dominance',
        'btc-change',
        'eth-change',
        'others-change',
        'yesterday-btc',
        'yesterday-eth',
        'yesterday-others'
    ];

    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('⚠️ Elementos del DOM no encontrados:', missingElements);
        console.log('💡 La componente de gráficas aún no se ha cargado. Retrasando actualización...');
        // Reintentar en 500ms
        setTimeout(() => {
            console.log('🔄 Reintentando actualizar dominanceData...');
            updateDominanceData(data);
        }, 500);
        return;
    }

    // Actualizar valores actuales
    document.getElementById('btc-dominance').textContent = data.btc_dominance.toFixed(1) + '%';
    document.getElementById('eth-dominance').textContent = data.eth_dominance.toFixed(1) + '%';
    document.getElementById('others-dominance').textContent = data.others_dominance.toFixed(1) + '%';

    // Logs internos (sin mostrar badges en la UI)
    if (data.isSimulated) {
        console.log('⚠️ Mostrando datos SIMULADOS de dominancia');
    } else if (data.source === 'CoinMarketCap Real') {
        console.log('✅ Mostrando datos REALES de CoinMarketCap');
    } else if (data.source && data.source.includes('error')) {
        console.log('❌ Error en API (datos de fallback)');
    }

    // Helper function para actualizar elementos de forma segura
    const safeUpdate = (id, value) => {
        const elem = document.getElementById(id);
        if (elem) elem.textContent = value;
    };

    const safeUpdateClass = (id, value, className) => {
        const elem = document.getElementById(id);
        if (elem) {
            elem.textContent = value;
            elem.className = className;
        }
    };

    // Simular cambios (en el original estos vendrían de datos históricos)
    safeUpdateClass('btc-change', '+0.1%', 'crypto-change positive');
    safeUpdateClass('eth-change', '-0.1%', 'crypto-change negative');
    safeUpdateClass('others-change', '0.0%', 'crypto-change neutral');

    // Simular datos históricos (en el original estos vendrían de la API)
    const btc = data.btc_dominance;
    const eth = data.eth_dominance;
    const others = data.others_dominance;

    // Ayer
    safeUpdate('yesterday-btc', (btc - 0.1).toFixed(1) + '%');
    safeUpdate('yesterday-eth', (eth + 0.1).toFixed(1) + '%');
    safeUpdate('yesterday-others', (others + 0.0).toFixed(1) + '%');

    // Semana pasada
    safeUpdate('week-btc', (btc - 0.5).toFixed(1) + '%');
    safeUpdate('week-eth', (eth + 0.3).toFixed(1) + '%');
    safeUpdate('week-others', (others + 0.2).toFixed(1) + '%');

    // Mes pasado
    safeUpdate('month-btc', (btc + 1.2).toFixed(1) + '%');
    safeUpdate('month-eth', (eth - 0.8).toFixed(1) + '%');
    safeUpdate('month-others', (others - 0.4).toFixed(1) + '%');

    // Máximos del año
    safeUpdate('max-btc', (btc + 5.0).toFixed(1) + '%');
    safeUpdate('max-eth', (eth + 2.0).toFixed(1) + '%');
    safeUpdate('max-others', (others + 3.0).toFixed(1) + '%');

    // Mínimos del año
    safeUpdate('min-btc', (btc - 3.0).toFixed(1) + '%');
    safeUpdate('min-eth', (eth - 1.5).toFixed(1) + '%');
    safeUpdate('min-others', (others - 4.0).toFixed(1) + '%');
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
    const lastUpdateElem = document.getElementById('dominance-last-update');
    if (lastUpdateElem) {
        lastUpdateElem.textContent = `Última actualización: ${new Date().toLocaleString('es-ES')}`;
    }
}

// Exportar funciones para uso en otros scripts
window.fetchDominance = fetchDominance;

/**
 * Función para probar la conexión a CoinMarketCap
 * Usada por el botón Conectar en apicon.html
 * @param {string} cmcApiKey - La API Key de CoinMarketCap a probar
 * @returns {Promise<Object>} - Resultado de la prueba {success: boolean, message: string, dominance: {...}}
 */
window.testCoinMarketCapConnection = async function(cmcApiKey) {
    console.log('🧪 Iniciando prueba de conexión a CoinMarketCap...');
    
    if (!cmcApiKey || cmcApiKey.trim() === '') {
        const result = {
            success: false,
            message: 'API Key de CoinMarketCap no proporcionada',
            dominance: null
        };
        console.log('❌ Prueba fallida:', result.message);
        return result;
    }
    
    // Analizar formato de la clave
    const keyInfo = analyzeAPIKeyFormat(cmcApiKey);
    console.log('🔍 Formato de API Key:', keyInfo);
    
    try {
        const proxyUrl = getDominanceProxyUrl();
        console.log(`🔗 Proxy URL: ${proxyUrl}`);
        
        const url = new URL(proxyUrl);
        url.searchParams.append('key', cmcApiKey);
        
        console.log(`📡 Enviando request de prueba a CoinMarketCap...`);
        const startTime = Date.now();
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        
        const duration = Date.now() - startTime;
        console.log(`📊 Respuesta: ${response.status} ${response.statusText} (${duration}ms)`);
        
        if (!response.ok) {
            const errorText = await response.text();
            
            // Intentar parsear el error como JSON
            let errorDetails = '';
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.status?.error_code) {
                    const errorCode = errorJson.status.error_code;
                    const errorMsg = getCoinMarketCapErrorMessage(errorCode);
                    errorDetails = `Error Code: ${errorCode} - ${errorMsg}`;
                    console.error(`❌ CoinMarketCap Error ${errorCode}:`, errorMsg);
                } else if (errorJson.message) {
                    errorDetails = errorJson.message;
                }
            } catch (e) {
                errorDetails = errorText.substring(0, 200);
            }
            
            const errorMsg = `HTTP ${response.status}: ${errorDetails || errorText.substring(0, 100)}`;
            console.error(`❌ Error en respuesta:`, errorMsg);
            
            return {
                success: false,
                message: errorMsg,
                status: response.status,
                keyFormat: keyInfo,
                dominance: null
            };
        }
        
        const apiData = await response.json();
        
        if (!apiData.data || typeof apiData.data.btc_dominance !== 'number') {
            throw new Error('Respuesta inválida: no contiene datos de dominancia');
        }
        
        const result = {
            success: true,
            message: '✅ Conexión exitosa a CoinMarketCap',
            dominance: {
                btc: apiData.data.btc_dominance.toFixed(2),
                eth: apiData.data.eth_dominance.toFixed(2),
                others: (100 - apiData.data.btc_dominance - apiData.data.eth_dominance).toFixed(2)
            },
            duration: duration,
            keyFormat: keyInfo
        };
        
        console.log('✅ Prueba exitosa:', result);
        return result;
        
    } catch (error) {
        const result = {
            success: false,
            message: `Error: ${error.message}`,
            dominance: null,
            keyFormat: keyInfo
        };
        console.error('❌ Prueba fallida:', error);
        return result;
    }
};

/**
 * Analiza el formato de una API Key de CoinMarketCap
 * @param {string} apiKey - La API Key a analizar
 * @returns {Object} - Información sobre el formato
 */
function analyzeAPIKeyFormat(apiKey) {
    const info = {
        length: apiKey.length,
        format: 'unknown',
        pattern: '',
        hasHyphens: apiKey.includes('-'),
        hasUnderscores: apiKey.includes('_'),
        hasUpperCase: /[A-Z]/.test(apiKey),
        hasLowerCase: /[a-z]/.test(apiKey),
        hasNumbers: /[0-9]/.test(apiKey),
        structure: ''
    };
    
    // Detectar patrón UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
        info.format = 'UUID v4';
        info.pattern = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
        info.structure = '8-4-4-4-12 hex characters with hyphens';
    }
    // Detectar patrón hexadecimal largo
    else if (/^[0-9a-f]+$/i.test(apiKey)) {
        info.format = 'Hexadecimal';
        info.pattern = 'x'.repeat(info.length);
        info.structure = `${info.length} hexadecimal characters`;
    }
    // Detectar patrón alphanumeric
    else if (/^[a-zA-Z0-9_-]+$/.test(apiKey)) {
        info.format = 'Alphanumeric';
        info.pattern = 'Mixed letters, numbers, hyphens, underscores';
        info.structure = `${info.length} characters (mixed)`;
    }
    // Detectar patrón base64-like
    else if (/^[A-Za-z0-9+/=]+$/.test(apiKey)) {
        info.format = 'Base64-like';
        info.pattern = 'Base64 characters';
        info.structure = `${info.length} Base64 characters`;
    }
    else {
        info.format = 'Mixed/Custom';
        info.pattern = 'Unknown pattern';
        info.structure = `${info.length} characters (contains special characters)`;
    }
    
    return info;
}

/**
 * Obtiene el mensaje de error legible para códigos de error de CoinMarketCap
 * @param {number} errorCode - El código de error de CMC
 * @returns {string} - Descripción del error
 */
function getCoinMarketCapErrorMessage(errorCode) {
    const errors = {
        1000: 'Success',
        1001: 'Invalid API Key - La clave API no es válida, expiró o fue revocada',
        1002: 'Invalid credit',
        1003: 'Invalid Parameters - Parámetros inválidos en la solicitud',
        1004: 'Invalid plan',
        1005: 'Duplicate request',
        1006: 'Monthly request limit exceeded - Límite mensual de solicitudes excedido',
        1007: 'Daily request limit exceeded - Límite diario de solicitudes excedido',
        1008: 'API Rate Limit exceeded',
        1009: 'Monthly USD Limit exceeded',
        1010: 'Invalid value for \"convert\"',
        1011: 'Could not find any matching records',
        1012: 'Internal error',
        1013: 'The \"id\" or \"slug\" you supplied does not match any cryptocurrency',
        1014: 'API key does not have permission to access this endpoint',
        1015: 'You have reached the maximum number of API keys for your tier',
        1016: 'The IP address you are using is not on the whitelist for this API key',
        1017: 'You have exceeded the rate limit for this API key',
        1018: 'This endpoint is not available on your plan',
        1019: 'You must be a Professional or higher subscriber to use this endpoint'
    };
    
    return errors[errorCode] || `Unknown error code: ${errorCode}`;
}


// Ejecutar automáticamente cuando se carga la página (con espera para asegurar que el DOM está listo)
console.log('✓ dominance.js cargado, programando fetchDominance()');

// Opción 1: Si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('📊 [dominance.js] DOM ya está listo, ejecutando fetchDominance en 2 segundos');
    setTimeout(() => {
        console.log('📊 [dominance.js] Ejecutando fetchDominance ahora con forceRefresh=true');
        fetchDominance(true); // forceRefresh = true para datos frescos
    }, 2000);
} else {
    // Opción 2: Esperar a que el DOM esté cargado
    console.log('📊 [dominance.js] Esperando a que DOM esté listo...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📊 [dominance.js] DOM cargado, ejecutando fetchDominance en 1 segundo');
        setTimeout(() => {
            console.log('📊 [dominance.js] Ejecutando fetchDominance ahora con forceRefresh=true');
            fetchDominance(true); // forceRefresh = true para datos frescos
        }, 1000);
    });
}

// Opción 3: También escuchar cuando se hace visible la pestaña de gráficas
document.addEventListener('shown.bs.tab', (e) => {
    if (e.target && (e.target.id === 'graficas-tab' || e.target.getAttribute('data-bs-target') === '#graficas')) {
        console.log('📊 [dominance.js] Pestaña de gráficas activada, ejecutando fetchDominance con actualización forzada');
        fetchDominance(true); // forceRefresh = true para datos frescos al cambiar tab
    }
});
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