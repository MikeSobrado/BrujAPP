function showAPIs() {
    console.log('🔌 Mostrando APIs...');
    hideAllMainTabs();

    const apisTab = document.getElementById('apis');
    if (apisTab) {
        apisTab.classList.add('show', 'active');
        const apisBtn = document.getElementById('apis-tab');
        if (apisBtn) {
            apisBtn.classList.add('active');
        }
        // Cargar componente de conexión API si no está cargado
        const apiconDynamic = document.getElementById('apicon-dynamic');
        if (apiconDynamic && !apiconDynamic.dataset.loaded) {
            loadComponent('components/sections/apicon.html', 'apicon-dynamic').then(() => {
                apiconDynamic.dataset.loaded = 'true';
                console.log('✅ apicon.html cargado dinámicamente');
                if (typeof initializeSaveKey === 'function') {
                    console.log('✅ Inicializando botón Crear Llave');
                    initializeSaveKey();
                } else {
                    console.warn('⚠️ initializeSaveKey no está disponible');
                }
                if (typeof initializeConnectButton === 'function') {
                    console.log('✅ Inicializando botón Conectar');
                    initializeConnectButton();
                } else {
                    console.warn('⚠️ initializeConnectButton no está disponible');
                }
            });
        }
    }
}
// main.js - Archivo principal de la aplicación

// Variables globales de estado
let appInitialized = false;

// Función principal de inicialización
function initializeApp() {
    if (appInitialized) return;
    
    console.log('🚀 Inicializando Trading Dome Dashboard...');
    
    // Inicializar módulos en orden
    try {
        // 1. Inicializar sistema de paneles
        if (typeof initializePanels === 'function') {
            initializePanels();
        }
        
        // 2. Inicializar calculadora de riesgo
        if (typeof initializeRiskCalculator === 'function') {
            initializeRiskCalculator();
        }
        
        // 3. Inicializar sistema de gráficas
        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }
        
        // 4. Inicializar funcionalidades de importación/exportación
        initializeDataManagement();
        
        // 5. Configurar navegación de pestañas
        initializeTabNavigation();

        // 6. Inicializar campo de prueba en contacto
        setTimeout(() => {
            // Elementos de Contacto
            const testBtn = document.getElementById('test-calc-btn');
            const testResult = document.getElementById('test-calc-result');

            // Inputs para el cálculo de comisiones
            // Usamos los ids de la calculadora de riesgos si existen
            const entryInput = document.getElementById('entry-contacto');
            const exitInput = document.getElementById('exit-contacto');

            if (testBtn && testResult) {
                testBtn.addEventListener('click', () => {
                    // Obtener valores
                    const entry = parseFloat(entryInput?.value);
                    const exit = parseFloat(exitInput?.value);

                    // Obtener parámetros globales de la calculadora de riesgos
                    const apalancamiento = parseFloat(document.getElementById('apalancamiento')?.value) || 1;
                    const comision = parseFloat(document.getElementById('comision')?.value) || 0;
                    const riesgoMaximo = parseFloat(document.getElementById('riesgo-maximo')?.value) || 0;
                    const capitalTotal = parseFloat(document.getElementById('capital-total')?.value) || 0;

                    // Validar datos
                    if (isNaN(entry) || isNaN(exit) || isNaN(capitalTotal) || isNaN(riesgoMaximo)) {
                        testResult.textContent = 'Introduce precio de entrada, salida y parámetros de riesgo.';
                        return;
                    }

                    // Calcular capital arriesgado
                    const capitalArriesgado = capitalTotal * (riesgoMaximo / 100);
                    // Cálculo de comisión entrada
                    const comisionEntrada = (apalancamiento * capitalArriesgado * comision) / 100;

                    // Cálculo de diferencia porcentual entre entrada y salida
                    const diffPorcentaje = (((exit - entry) / entry) * 100).toFixed(2);

                    testResult.innerHTML = `Comisión entrada: $${comisionEntrada.toFixed(2)}<br>Diferencia entre entrada y salida: ${diffPorcentaje}%`;
                });
            }
        }, 500);
        
        appInitialized = true;
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
    }
    
    // Inicializar sistema de perfiles
    setTimeout(() => {
        if (typeof initializeProfiles === 'function') {
            initializeProfiles();
        }
        if (typeof setupProfileEvents === 'function') {
            setupProfileEvents();
        }
    }, 500);
}

// Función para manejar importación y exportación de datos
function initializeDataManagement() {
    // Botón de exportación
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            try {
                const dataToExport = {
                    version: '1.0',
                    panels: getPanelsState ? getPanelsState() : [],
                    riskCalculator: getRiskCalculatorState ? getRiskCalculatorState() : {},
                    profile: {
                        name: typeof currentProfileName !== 'undefined' ? currentProfileName : 'Perfil desconocido',
                        data: typeof currentProfileData !== 'undefined' ? currentProfileData : {}
                    },
                    exportDate: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Full-data-' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('📤 Datos exportados correctamente');
            } catch (error) {
                console.error('❌ Error al exportar datos:', error);
                alert('Error al exportar los datos');
            }
        });
    }

    // Botón de importación
    const importBtn = document.getElementById('importDataBtn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'application/json';
            fileInput.addEventListener('change', async function(event) {
                const file = event.target.files[0];
                if (!file) return;

                try {
                    const fileContent = await file.text();
                    const importedData = JSON.parse(fileContent);

                    if (importedData.profile) {
                        currentProfileName = importedData.profile.name || 'Perfil desconocido';
                        currentProfileData = importedData.profile.data || {};
                        console.log(`Perfil importado: ${currentProfileName}`);
                    }

                    if (importedData.panels && typeof loadPanelsState === 'function') {
                        loadPanelsState(importedData.panels);
                    }

                    if (importedData.riskCalculator && typeof loadRiskCalculatorState === 'function') {
                        loadRiskCalculatorState(importedData.riskCalculator);
                    }

                    console.log('📥 Datos importados correctamente');
                } catch (error) {
                    console.error('❌ Error al importar datos:', error);
                    alert('Error al importar los datos');
                }
            });
            fileInput.click();
        });
    }
}

// Función para configurar la navegación entre pestañas
function initializeTabNavigation() {
    console.log('🔧 Inicializando navegación de pestañas...');
    
    // Configurar carga automática de gráficas cuando se activa la pestaña
    const tabs = document.querySelectorAll('.nav-link[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target');

            if (targetId === '#graficas') {
                // Cargar gráficas cuando se accede a la pestaña
                setTimeout(() => {
                    if (typeof fetchFearGreed === 'function' && typeof fetchFundingRate === 'function') {
                        console.log('📊 Cargando gráficas automáticamente...');
                        Promise.allSettled([
                            fetchFearGreed(),
                            fetchFundingRate()
                        ]).then(results => {
                            console.log('📈 Carga de gráficas completada');
                        });
                    }
                }, 100);
            }
        });
    });
    
    // Inicializar pestañas internas de la sección inicio
    // Hacer esto después de dar tiempo para que el DOM se estabilice
    setTimeout(() => {
        setupSidebarTabHandlers();
    }, 500);
}

// Función para configurar manejadores de pestañas de la barra lateral
function setupSidebarTabHandlers() {
    console.log('🔧 Configurando manejadores de pestañas de barra lateral...');
    
    const dashboardBtn = document.getElementById('dashboard-tab');
    const graficasBtn = document.getElementById('graficas-tab');
    const riesgoBtn = document.getElementById('riesgo-tab');
    const posicionesBtn = document.getElementById('posiciones-tab');
        const monitoreoBtn = document.getElementById('monitoreo-tab');
    
    if (graficasBtn) {
        graficasBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showGraficas();
        });
    }
    
    if (riesgoBtn) {
        riesgoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showGestionRiesgo();
        });
    }
    
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showDashboard();
        });
    }
    
    if (posicionesBtn) {
        posicionesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showPosiciones();
        });
    }
    const apisBtn = document.getElementById('apis-tab');
    if (apisBtn) {
        apisBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAPIs();
        });
    }
    
        if (monitoreoBtn) {
            monitoreoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                showMonitoreo();
        });
    }
    
    console.log('✅ Manejadores de barra lateral configurados');
}

function showDashboard() {
    console.log('📊 Mostrando Dashboard...');
    hideAllMainTabs();
    
    const inicioTab = document.getElementById('inicio');
    if (inicioTab) {
        inicioTab.classList.add('show', 'active');
        const dashboardBtn = document.getElementById('dashboard-tab');
        if (dashboardBtn) {
            dashboardBtn.classList.add('active');
        }
    }
}

function showGraficas() {
    console.log('📈 Mostrando Gráficas...');
    hideAllMainTabs();
    
    const graficasTab = document.getElementById('graficas');
    if (graficasTab) {
        graficasTab.classList.add('show', 'active');
        const graficasBtn = document.getElementById('graficas-tab');
        if (graficasBtn) {
            graficasBtn.classList.add('active');
        }
        // Cargar gráficas
        setTimeout(() => {
            if (typeof fetchFearGreed === 'function' && typeof fetchFundingRate === 'function') {
                console.log('📊 Cargando gráficas...');
                Promise.allSettled([
                    fetchFearGreed(),
                    fetchFundingRate()
                ]);
            }
        }, 100);
    }
}

function showGestionRiesgo() {
    console.log('⚠️ Mostrando Gestión de Riesgo...');
    hideAllMainTabs();
    
    const riesgoTab = document.getElementById('gestion-riesgo');
    if (riesgoTab) {
        riesgoTab.classList.add('show', 'active');
        const riesgoBtn = document.getElementById('riesgo-tab');
        if (riesgoBtn) {
            riesgoBtn.classList.add('active');
        }
    }
}

function showPosiciones() {
        // Cargar componente de historial de posiciones si no está cargado
        const historialDynamic = document.getElementById('posiciones-historial-dynamic');
        if (historialDynamic && !historialDynamic.dataset.loaded) {
            console.log('📥 Cargando componente posiciones-historial.html...');
            loadComponent('components/sections/posiciones-historial.html', 'posiciones-historial-dynamic').then(() => {
                historialDynamic.dataset.loaded = 'true';
                console.log('✅ Componente posiciones-historial cargado');
            });
        }
    console.log('📊 Mostrando Posiciones...');
    hideAllMainTabs();

    const posicionesTab = document.getElementById('posiciones');
    if (posicionesTab) {
        posicionesTab.classList.add('show', 'active');
        const posicionesBtn = document.getElementById('posiciones-tab');
        if (posicionesBtn) {
            posicionesBtn.classList.add('active');
        }
        // Cargar componente de estadísticas rápidas si no está cargado
        const statsDynamic = document.getElementById('posiciones-stats-dynamic');
        if (statsDynamic && !statsDynamic.dataset.loaded) {
            console.log('📥 Cargando componente posiciones.html (stats)...');
            loadComponent('components/sections/posiciones.html', 'posiciones-stats-dynamic').then(() => {
                statsDynamic.dataset.loaded = 'true';
                console.log('✅ Componente posiciones.html cargado');
            });
        }
        
        // 🔑 Asegurar que los datos se carguen si existen en memoria
        console.log('🔄 Verificando datos en memoria...');
        if (window.currentPositions && window.currentPositions.length > 0) {
            console.log('✅ Datos encontrados en memoria, disparando recarga...');
            // Esperar un poco para que los componentes se carguen
            setTimeout(() => {
                if (typeof window.loadAndDisplayPositions === 'function') {
                    window.loadAndDisplayPositions();
                }
                if (typeof window.loadAndDisplayStats === 'function') {
                    window.loadAndDisplayStats();
                }
            }, 200);
        }
    }
}

function showMonitoreo() {
    console.log('📈 Mostrando Monitoreo...');
    hideAllMainTabs();
    
    const monitoreoTab = document.getElementById('monitoreo');
    if (monitoreoTab) {
        monitoreoTab.classList.add('show', 'active');
        const monitoreoBtn = document.getElementById('monitoreo-tab');
        if (monitoreoBtn) {
            monitoreoBtn.classList.add('active');
        }
        
        // Inicializar las gráficas de monitoreo
        if (typeof renderBitgetCharts === 'function') {
            console.log('🎨 Inicializando gráficas de monitoreo...');
            setTimeout(() => {
                renderBitgetCharts().catch(err => {
                    console.error('❌ Error al renderizar gráficas:', err);
                });
            }, 100);
        }
    }
}

function hideAllMainTabs() {
    console.log('🔄 Ocultando todas las pestañas principales...');
    
    // Obtener todas las pestañas principales
    const tabs = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.classList.remove('show', 'active');
    });
    
    // Remover clase activa solo de los botones de navegación principales (nav-tabs en la barra lateral)
    const mainNavTabs = document.getElementById('myTab');
    if (mainNavTabs) {
        const navLinks = mainNavTabs.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        });
    }
}

// Función para manejar las pestañas internas de la sección inicio
function initializeInicioTabs() {
    console.log('🔧 Iniciando configuración de pestañas internas...');
    
    const inicioTabs = document.querySelectorAll('.inicio-tab');
    const inicioPanes = document.querySelectorAll('.inicio-pane');
    
    console.log('📋 Pestañas encontradas:', inicioTabs.length);
    console.log('📋 Paneles encontrados:', inicioPanes.length);
    
    if (inicioTabs.length === 0 || inicioPanes.length === 0) {
        console.log('⚠️ Pestañas no encontradas, configurando observer...');
        setupTabObserver();
        return;
    }
    
    // Configurar cada pestaña
    inicioTabs.forEach((tab) => {
        tab.removeEventListener('click', handleInicioTabClick);
        tab.addEventListener('click', handleInicioTabClick);
    });
    
    console.log('✅ Pestañas internas configuradas correctamente');
}

function handleInicioTabClick(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('data-target');
    console.log('� Click en pestaña:', targetId);
    
    const inicioTabs = document.querySelectorAll('.inicio-tab');
    const inicioPanes = document.querySelectorAll('.inicio-pane');
    
    // Remover active de todos
    inicioTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    inicioPanes.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none';
    });
    
    // Activar el clickeado
    this.classList.add('active');
    
    const targetPane = document.getElementById(targetId);
    if (targetPane) {
        targetPane.classList.add('active');
        targetPane.style.display = 'block';
        console.log('✅ Panel mostrado:', targetId);
    } else {
        console.error('❌ Panel no encontrado:', targetId);
    }
}

function setupTabObserver() {
    console.log('🔍 Configurando MutationObserver para pestañas...');
    
    const observer = new MutationObserver(() => {
        const tabs = document.querySelectorAll('.inicio-tab');
        if (tabs.length > 0) {
            console.log('🎉 Pestañas detectadas, inicializando...');
            observer.disconnect();
            initializeInicioTabs();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Timeout de seguridad
    setTimeout(() => {
        observer.disconnect();
        console.log('⏰ Observer de pestañas desconectado por timeout');
    }, 10000);
}

// Función para manejar errores globales
function handleGlobalError(error, context = 'Unknown') {
    console.error(`❌ Error en ${context}:`, error);
    
    // Aquí se pueden agregar funciones de reporte de errores
    // o notificaciones al usuario según sea necesario
}

// Función de diagnóstico para desarrollo
function runDiagnostics() {
    console.log('🔧 === DIAGNÓSTICO DE LA APLICACIÓN ===');
    
    // Verificar Chart.js
    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js está cargado correctamente');
    } else {
        console.error('❌ Chart.js NO está cargado');
    }
    
    // Verificar elementos HTML críticos
    const criticalElements = [
        'decision-number', 'buy-signal', 'wait-signal', 'sell-signal',
        'capital-total', 'apalancamiento', 'riesgo-maximo', 'spread'
    ];
    
    console.log('📋 Verificando elementos HTML críticos:');
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(`✅ ${id}: Encontrado`);
        } else {
            // Solo mostrar error si la pestaña actual es la que debería tener el elemento
            const tabActive = document.querySelector('.tab-pane.show.active');
            if (tabActive && tabActive.innerHTML.includes(id)) {
                console.error(`❌ ${id}: NO encontrado`);
            } else {
                console.log(`ℹ️ ${id}: No aplica en esta pestaña`);
            }
        }
    });
    
    // Verificar funciones de módulos
    const criticalFunctions = [
        'toggleLight', 'updateDecisionPanel', 'updateRiskCalculations',
        'addNewPanel', 'deletePanel'
    ];
    
    console.log('🔧 Verificando funciones críticas:');
    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName}: Disponible`);
        } else {
            console.error(`❌ ${funcName}: NO disponible`);
        }
    });
    
    // Probar conectividad básica de APIs
    console.log('🌐 Probando conectividad básica de APIs...');
    
    fetch('https://api.alternative.me/fng/?limit=1')
        .then(response => response.json())
        .then(data => {
            console.log('✅ Fear & Greed API: Funciona correctamente');
            console.log('📊 Valor actual:', data.data[0].value, data.data[0].value_classification);
        })
        .catch(error => {
            console.error('❌ Fear & Greed API: Error -', error.message);
        });
    
    console.log('ℹ️ Diagnóstico completado. Revisa los resultados arriba.');
}

// Función para resetear la aplicación
function resetApplication() {
    if (confirm('¿Estás seguro de que quieres resetear toda la aplicación? Se perderán todos los datos.')) {
        // Limpiar localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('panels') || key.includes('risk') || key.includes('fearGreed') || key.includes('funding'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Resetear calculadora de riesgo
        if (typeof resetRiskCalculator === 'function') {
            resetRiskCalculator();
        }
        
        // Recargar la página para un reset completo
        window.location.reload();
    }
}

// Event listeners principales
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM completamente cargado');
    
    // Configurar diagnóstico automático en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🔧 Modo desarrollo detectado');
        setTimeout(() => {
            runDiagnostics();
        }, 3000); // Aumentado a 3 segundos para dar tiempo a los componentes
    }
});

// Inicializar la aplicación después de que los componentes estén cargados
document.addEventListener('componentsLoaded', function() {
    console.log('📦 Componentes cargados, inicializando aplicación...');
    initializeApp();
});

// Manejar errores no capturados
window.addEventListener('error', function(event) {
    handleGlobalError(event.error, 'Global Error Handler');
});

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', function(event) {
    handleGlobalError(event.reason, 'Unhandled Promise Rejection');
});

// Exportar funciones para uso en consola
window.runDiagnostics = runDiagnostics;
window.resetApplication = resetApplication;
window.initializeApp = initializeApp;