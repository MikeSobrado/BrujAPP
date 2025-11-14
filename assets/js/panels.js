// panels.js - Funcionalidad de paneles de semáforos y decisión

// Contador para generar IDs únicos de paneles de usuario
let panelCounter = 0;

// Control para evitar ejecuciones múltiples
let isAddingIndicator = false;

// Función para alternar el estado de las luces
function toggleLight(light) {
    const isCurrentlyActive = light.classList.contains('active');
    
    // Obtener el panel padre
    const panel = light.closest('.control-panel');
    
    // Apagar todas las luces del panel
    const allLights = panel.querySelectorAll('.traffic-light');
    allLights.forEach(l => l.classList.remove('active'));
    
    // Si la luz no estaba activa, encenderla
    if (!isCurrentlyActive) {
        light.classList.add('active');
    }
    
    // Actualizar el panel de decisión después de cambiar las luces
    updateDecisionPanel();
}

// Función para contar las luces rojas y verdes activas (con peso doble para paneles activados)
function countActiveLights() {
    let greenCount = 0;
    let redCount = 0;
    
    // Buscar en todos los paneles de control (fijos y de usuario)
    const allPanels = document.querySelectorAll('.control-panel');
    console.log(`🔥 Contando luces en ${allPanels.length} paneles`); // Debug
    
    allPanels.forEach(panel => {
        const isActivatedPanel = panel.classList.contains('activated');
        const weightMultiplier = isActivatedPanel ? 2 : 1; // Peso doble para paneles activados
        
        console.log(`🔥 Panel activado: ${isActivatedPanel}, peso: x${weightMultiplier}`); // Debug
        
        const activeLights = panel.querySelectorAll('.traffic-light.active');
        activeLights.forEach(light => {
            if (light.classList.contains('green')) {
                greenCount += weightMultiplier;
                console.log(`🔥 Luz verde encontrada, peso: ${weightMultiplier}`); // Debug
            } else if (light.classList.contains('red')) {
                redCount += weightMultiplier;
                console.log(`🔥 Luz roja encontrada, peso: ${weightMultiplier}`); // Debug
            }
            // Las luces ámbar no se cuentan
        });
        
        // Log para debugging (solo si hay luces activas en el panel)
        if (activeLights.length > 0 && isActivatedPanel) {
            const panelName = panel.querySelector('.panel-name-input')?.value || 'Panel sin nombre';
            console.log(`🟡 Panel ACTIVADO "${panelName}": luces cuentan x${weightMultiplier}`);
        }
    });
    
    console.log(`🔥 Conteo final: Verde=${greenCount}, Roja=${redCount}`); // Debug
    return { green: greenCount, red: redCount };
}

// Función para actualizar el panel de decisión basado en los indicadores
function updateDecisionPanel() {
    // Verificar que los elementos existan antes de acceder a ellos
    const greenThresholdElement = document.getElementById('green-threshold');
    const redThresholdElement = document.getElementById('red-threshold');
    if (!greenThresholdElement || !redThresholdElement) {
        console.warn('⚠️ Elementos de threshold no encontrados en updateDecisionPanel');
        return;
    }
    const greenThreshold = parseInt(greenThresholdElement.value) || 40;
    const redThreshold = parseInt(redThresholdElement.value) || 40;

    // Obtener puntajes de los indicadores
    const scores = getIndicatorScores();
    const difference = Math.abs(scores.greenScore - scores.redScore);

    // Log simplificado para depuración
    console.log('--- DECISION DEBUG ---');
    console.log(`Verde: ${scores.greenScore}, Rojo: ${scores.redScore}`);
    console.log(`Diferencia: ${difference}`);
    console.log(`Umbral LONG: ${greenThreshold}, Umbral SHORT: ${redThreshold}`);
    console.log(`Condiciones: Verde>=${greenThreshold} && Verde>Rojo`);

    // Obtener elementos del panel de decisión
    const buySignal = document.getElementById('buy-signal');
    const waitSignal = document.getElementById('wait-signal');
    const sellSignal = document.getElementById('sell-signal');
    if (!buySignal || !waitSignal || !sellSignal) {
        console.warn('⚠️ Elementos de señales no encontrados en updateDecisionPanel');
        return;
    }
    // Resetear todas las señales
    buySignal.classList.remove('active');
    waitSignal.classList.remove('active');
    sellSignal.classList.remove('active');

    // Lógica simplificada: solo umbrales LONG y SHORT
    if (scores.greenScore >= greenThreshold && scores.greenScore > scores.redScore) {
        // LONG: Verde alcanza umbral y es mayor que rojo
        buySignal.classList.add('active');
        console.log(`📈 SEÑAL LONG: Verde=${scores.greenScore} >= ${greenThreshold}`);
    } else if (scores.redScore >= redThreshold && scores.redScore > scores.greenScore) {
        // SHORT: Rojo alcanza umbral y es mayor que verde
        sellSignal.classList.add('active');
        console.log(`📉 SEÑAL SHORT: Rojo=${scores.redScore} >= ${redThreshold}`);
    } else {
        // ESPERA: No se cumplen las condiciones
        waitSignal.classList.add('active');
        console.log('⏸️ SEÑAL ESPERA: Umbrales no alcanzados');
    }

    // Actualizar contador visual con puntajes e información de diferencia
    const lightsCounter = document.getElementById('lights-counter');
    if (lightsCounter) {
        const differenceInfo = ` | 📊 Dif: ${difference}`;
        lightsCounter.innerHTML = `
            <span class="counter-green">🟢 ${scores.greenScore} pts</span> | <span class="counter-red">🔴 ${scores.redScore} pts</span>${differenceInfo}
        `;
    }
    // Trigger evento personalizado para notificar cambio en decisión
    const decisionEvent = new CustomEvent('decisionPanelUpdated', {
        detail: {
            decision: buySignal.classList.contains('active') ? 'LONG' : 
                     sellSignal.classList.contains('active') ? 'SHORT' : 'ESPERA',
            greenScore: scores.greenScore,
            redScore: scores.redScore,
            difference: difference,
            greenThreshold: greenThreshold,
            redThreshold: redThreshold
        }
    });
    document.dispatchEvent(decisionEvent);
}

// Función para manejar cambios en el campo del umbral
function onThresholdChange() {
    updateDecisionPanel();
}

// Función para eliminar un panel
function deletePanel(button) {
    const panel = button.closest('.control-panel');
    
    // Animación de salida
    panel.style.transform = 'scale(0.8)';
    panel.style.opacity = '0';
    
    setTimeout(() => {
        panel.remove();
        // Actualizar el panel de decisión después de eliminar
        updateDecisionPanel();
    }, 300);
}

// Función para agregar un nuevo panel
function addNewPanel() {
    panelCounter++;
    const userPanelsContainer = document.getElementById('userPanelsContainer');
    
    // Crear el HTML del nuevo panel
    const newPanel = document.createElement('div');
    newPanel.className = 'control-panel panel-button';
    newPanel.id = `user-panel-${panelCounter}`;
    newPanel.setAttribute('onclick', 'handlePanelClick(this)');
    newPanel.setAttribute('data-panel', `user-panel-${panelCounter}`);
    newPanel.style.transform = 'scale(0.8)';
    newPanel.style.opacity = '0';
    
    newPanel.innerHTML = `
        <div class="panel-lights">
            <div class="traffic-light green" onclick="event.stopPropagation(); toggleLight(this)" title="Luz Verde"></div>
            <div class="traffic-light amber" onclick="event.stopPropagation(); toggleLight(this)" title="Luz Ámbar"></div>
            <div class="traffic-light red" onclick="event.stopPropagation(); toggleLight(this)" title="Luz Roja"></div>
        </div>
        <div class="panel-controls">
            <span class="label-text">${name}</span> ${panelCounter + 6}" onclick="event.stopPropagation()">
            <button class="delete-panel-btn" onclick="event.stopPropagation(); deletePanel(this)" title="Eliminar panel">
                <i class="bi bi-trash"></i>
            </button>
        </div>
        <div class="panel-button-indicator">
            <i class="bi bi-cursor-fill"></i>
        </div>
    `;
    
    // Agregar el panel al contenedor de usuarios
    userPanelsContainer.appendChild(newPanel);
    
    // Animación de entrada
    setTimeout(() => {
        newPanel.style.transform = 'scale(1)';
        newPanel.style.opacity = '1';
        // Actualizar el panel de decisión después de agregar
        updateDecisionPanel();
    }, 100);
}

// Función para obtener el estado de todos los paneles (útil para guardar/cargar)
function getPanelsState() {
    // Limpiar paneles antiguos del DOM antes de exportar
    const fixedPanelContainer = document.getElementById('fixedPanelsContainer');
    const userPanelContainer = document.getElementById('userPanelsContainer');
    if (fixedPanelContainer) {
        Array.from(fixedPanelContainer.children).forEach(child => {
            if (!child.classList.contains('control-panel')) {
                fixedPanelContainer.removeChild(child);
            }
        });
    }
    if (userPanelContainer) {
        Array.from(userPanelContainer.children).forEach(child => {
            if (!child.classList.contains('control-panel')) {
                userPanelContainer.removeChild(child);
            }
        });
    }

    const panels = [];
    // Obtener paneles fijos
    const fixedPanelElements = document.querySelectorAll('#fixedPanelsContainer .control-panel');
    fixedPanelElements.forEach((panel, index) => {
        const lights = panel.querySelectorAll('.traffic-light');
        const nameInput = panel.querySelector('.panel-name-input');
        const panelData = {
            id: panel.id,
            name: nameInput.value,
            type: 'fixed',
            activated: panel.classList.contains('activated'),
            lights: {
                green: lights[0].classList.contains('active'),
                amber: lights[1].classList.contains('active'),
                red: lights[2].classList.contains('active')
            }
        };
        panels.push(panelData);
    });
    // Obtener paneles de usuario
    const userPanelElements = document.querySelectorAll('#userPanelsContainer .control-panel');
    userPanelElements.forEach((panel, index) => {
        const lights = panel.querySelectorAll('.traffic-light');
        const nameInput = panel.querySelector('.panel-name-input');
        const panelData = {
            id: panel.id,
            name: nameInput.value,
            type: 'user',
            activated: panel.classList.contains('activated'),
            lights: {
                green: lights[0].classList.contains('active'),
                amber: lights[1].classList.contains('active'),
                red: lights[2].classList.contains('active')
            }
        };
        panels.push(panelData);
    });
    return panels;
}

// Función para cargar el estado de los paneles
function loadPanelsState(panelsData) {
    // Cargar paneles fijos
    panelsData.filter(p => p.type === 'fixed').forEach(panelData => {
        const panel = document.getElementById(panelData.id);
        if (panel) {
            const lights = panel.querySelectorAll('.traffic-light');
            const nameInput = panel.querySelector('.panel-name-input');
            
            nameInput.value = panelData.name;
            
            // Aplicar estado de las luces
            lights[0].classList.toggle('active', panelData.lights.green);
            lights[1].classList.toggle('active', panelData.lights.amber);
            lights[2].classList.toggle('active', panelData.lights.red);
            
            // Restaurar estado de activación dorada
            if (panelData.activated) {
                panel.classList.add('activated');
                updatePanelMultiplier(panel);
            } else {
                panel.classList.remove('activated');
                removePanelMultiplier(panel);
            }
        }
    });
    
    // Cargar paneles de usuario
    const userPanelsData = panelsData.filter(p => p.type === 'user');
    userPanelsData.forEach(panelData => {
        // Recrear panel de usuario
        addNewPanel();
        
        // Configurar el panel creado
        setTimeout(() => {
            const panel = document.getElementById(`user-panel-${panelCounter}`);
            if (panel) {
                const lights = panel.querySelectorAll('.traffic-light');
                const nameInput = panel.querySelector('.panel-name-input');
                
                nameInput.value = panelData.name;
                
                // Aplicar estado de las luces
                lights[0].classList.toggle('active', panelData.lights.green);
                lights[1].classList.toggle('active', panelData.lights.amber);
                lights[2].classList.toggle('active', panelData.lights.red);
                
                // Restaurar estado de activación dorada
                if (panelData.activated) {
                    panel.classList.add('activated');
                    updatePanelMultiplier(panel);
                } else {
                    panel.classList.remove('activated');
                    removePanelMultiplier(panel);
                }
            }
        }, 150);
    });
    
    // Actualizar panel de decisión después de cargar
    setTimeout(() => {
        updateDecisionPanel();
    }, 200);
}

// Inicialización de paneles
function initializePanels() {
    console.log('🚦 Inicializando sistema de paneles...');
    
    // Agregar event listeners a los threshold inputs del panel de decisión
    const greenThresholdInput = document.getElementById('green-threshold');
    const redThresholdInput = document.getElementById('red-threshold');
    
    if (greenThresholdInput) {
        greenThresholdInput.addEventListener('input', onThresholdChange);
        greenThresholdInput.addEventListener('change', onThresholdChange);
        console.log('✅ Event listener agregado a green-threshold');
    }
    
    if (redThresholdInput) {
        redThresholdInput.addEventListener('input', onThresholdChange);
        redThresholdInput.addEventListener('change', onThresholdChange);
        console.log('✅ Event listener agregado a red-threshold');
    }
    
    // Realizar cálculo inicial solo si los elementos existen
    if (greenThresholdInput && redThresholdInput) {
        updateDecisionPanel();
        console.log('✅ Panel de decisión actualizado');
    } else {
        console.warn('⚠️ No se puede actualizar panel de decisión - elementos no encontrados');
    }
    
    console.log('🚦 Sistema de paneles inicializado correctamente');
}

// Exportar funciones para uso global
window.toggleLight = toggleLight;
// Función para manejar clicks en paneles como botones
function handlePanelClick(panel) {
    console.log('🔥 HandlePanelClick ejecutado'); // Debug
    
    const panelType = panel.getAttribute('data-panel');
    const panelName = panel.querySelector('.panel-name-input').value;
    
    // Toggle del estado activado
    const isCurrentlyActivated = panel.classList.contains('activated');
    console.log(`🔥 Panel actualmente activado: ${isCurrentlyActivated}`); // Debug
    
    if (!isCurrentlyActivated) {
        // Activar panel
        activatePanel(panel);
        console.log(`🟡 Panel ACTIVADO: ${panelName} (${panelType})`);
        showPanelNotification(panelName, 'activado', true);
    } else {
        // Desactivar panel
        deactivatePanel(panel);
        console.log(`⚫ Panel DESACTIVADO: ${panelName} (${panelType})`);
        showPanelNotification(panelName, 'desactivado', false);
    }
    
    // Ejecutar acciones específicas según el tipo de panel
    switch(panelType) {
        case 'rsi-sobrecompra':
            handleRSIOverBoughtPanel(panel, !isCurrentlyActivated);
            break;
        case 'rsi-divergencias':
            handleRSIDivergencePanel(panel, !isCurrentlyActivated);
            break;
        case 'soporte-resistencia':
            handleSupportResistancePanel(panel, !isCurrentlyActivated);
            break;
        case 'macd':
            handleMACDPanel(panel, !isCurrentlyActivated);
            break;
        case 'macd-divergencias':
            handleMACDDivergencePanel(panel, !isCurrentlyActivated);
            break;
        case 'tendencia':
            handleTrendPanel(panel, !isCurrentlyActivated);
            break;
        default:
            handleGenericPanel(panelType, !isCurrentlyActivated);
    }
}

// Función para activar un panel (ponerlo dorado)
function activatePanel(panel) {
    console.log('🔥 Activando panel...'); // Debug
    
    // Agregar animación de activación
    panel.classList.add('activating');
    
    // Crear y agregar badge ×2 dinámicamente
    createMultiplierBadge(panel);
    
    // Después de la animación, establecer el estado activado
    setTimeout(() => {
        panel.classList.remove('activating');
        panel.classList.add('activated');
        console.log('🔥 Panel activado, clases aplicadas'); // Debug
        // Actualizar el panel de decisión inmediatamente después de activar
        updateDecisionPanel();
    }, 500);
}

// Función para desactivar un panel (volver al estado normal)
function deactivatePanel(panel) {
    console.log('🔥 Desactivando panel...'); // Debug
    
    panel.classList.remove('activated', 'activating');
    
    // Remover badge ×2
    removeMultiplierBadge(panel);
    
    // Efecto de desactivación
    panel.classList.add('clicked');
    setTimeout(() => {
        panel.classList.remove('clicked');
        // Actualizar el panel de decisión inmediatamente después de desactivar
        updateDecisionPanel();
    }, 300);
}

// Función para crear badge ×2 dinámicamente
function createMultiplierBadge(panel) {
    // Remover badge existente si lo hay
    removeMultiplierBadge(panel);
    
    const badge = document.createElement('div');
    badge.className = 'multiplier-badge';
    badge.textContent = '×2';
    badge.style.cssText = `
        position: absolute;
        top: 12px;
        left: 16px;
        background: linear-gradient(145deg, #cc6600, #b85500);
        color: white;
        font-size: 14px;
        font-weight: bold;
        padding: 6px 10px;
        border-radius: 16px;
        box-shadow: 0 3px 8px rgba(204, 102, 0, 0.5);
        z-index: 100;
        pointer-events: none;
        border: 2px solid rgba(255, 255, 255, 0.8);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    `;
    
    panel.appendChild(badge);
    console.log('🔥 Badge ×2 creado y agregado'); // Debug
}

// Función para remover badge ×2
function removeMultiplierBadge(panel) {
    const existingBadge = panel.querySelector('.multiplier-badge');
    if (existingBadge) {
        existingBadge.remove();
        console.log('🔥 Badge ×2 removido'); // Debug
    }
}

// Función auxiliar para actualizar multiplicador de panel
function updatePanelMultiplier(panel) {
    createMultiplierBadge(panel);
}

// Función auxiliar para remover multiplicador de panel
function removePanelMultiplier(panel) {
    removeMultiplierBadge(panel);
}

// Función para mostrar notificación visual (modificada para estado)
function showPanelNotification(panelName, actionType, isActivated) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'panel-notification';
    
    const icon = isActivated ? 'bi-toggle-on' : 'bi-toggle-off';
    const bgColor = isActivated ? 'linear-gradient(145deg, #ffc107, #ff8f00)' : 'linear-gradient(145deg, #6c757d, #495057)';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi ${icon}"></i>
            <span><strong>${panelName}</strong> ${actionType}</span>
        </div>
    `;
    
    // Agregar estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(67, 97, 238, 0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        font-size: 14px;
        min-width: 200px;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Funciones específicas para cada tipo de panel
function handleRSIOverBoughtPanel(panel, isActivated) {
    if (isActivated) {
        console.log('📊 ✅ RSI Sobrecompra/Sobreventa ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('📊 ❌ RSI Sobrecompra/Sobreventa DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleRSIDivergencePanel(panel, isActivated) {
    if (isActivated) {
        console.log('🔍 ✅ RSI Divergencias ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('🔍 ❌ RSI Divergencias DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleSupportResistancePanel(panel, isActivated) {
    if (isActivated) {
        console.log('📈 ✅ Soporte/Resistencia ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('📈 ❌ Soporte/Resistencia DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleMACDPanel(panel, isActivated) {
    if (isActivated) {
        console.log('📉 ✅ MACD Cruces ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('📉 ❌ MACD Cruces DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleMACDDivergencePanel(panel, isActivated) {
    if (isActivated) {
        console.log('📊 ✅ MACD Divergencias ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('📊 ❌ MACD Divergencias DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleTrendPanel(panel, isActivated) {
    if (isActivated) {
        console.log('📈 ✅ Tendencia ACTIVADO');
        // Aquí puedes agregar lógica específica cuando se activa
    } else {
        console.log('📈 ❌ Tendencia DESACTIVADO');
        // Aquí puedes agregar lógica específica cuando se desactiva
    }
}

function handleGenericPanel(panelType, isActivated) {
    if (isActivated) {
        console.log(`⚙️ ✅ Panel ${panelType} ACTIVADO`);
        // Lógica para paneles personalizados cuando se activan
    } else {
        console.log(`⚙️ ❌ Panel ${panelType} DESACTIVADO`);
        // Lógica para paneles personalizados cuando se desactivan
    }
}

// FUNCIONALIDAD DEL PANEL DE DECISIÓN
function initializeDecisionPanel() {
    // Proteger contra múltiples inicializaciones
    if (window._decisionPanelInitialized) {
        console.log('⏭️ Panel de decisión ya fue inicializado, saltando...');
        return;
    }
    window._decisionPanelInitialized = true;
    
    const decisionItems = document.querySelectorAll('.decision-item');
    
    // Agregar event listeners a cada item de decisión
    decisionItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover clase 'active' de todos los items
            decisionItems.forEach(i => i.classList.remove('active'));
            
            // Agregar clase 'active' al item clickeado
            this.classList.add('active');
            
            // Log de la decisión
            const label = this.querySelector('.decision-label').textContent;
            console.log(`🎯 Decisión seleccionada: ${label}`);
            
            // Trigger de evento personalizado
            const decisionEvent = new CustomEvent('decisionChanged', {
                detail: {
                    decision: label.toLowerCase(),
                    element: this
                }
            });
            document.dispatchEvent(decisionEvent);
        });
    });
    
    // Event listeners para los threshold inputs
    const thresholdInputs = document.querySelectorAll('.threshold-input');
    console.log(`🔧 DEBUG: Encontrados ${thresholdInputs.length} threshold inputs:`, Array.from(thresholdInputs).map(input => input.id));
    
    thresholdInputs.forEach(input => {
        console.log(`🔧 Agregando listener a: ${input.id}`);
        input.addEventListener('change', function() {
            const value = this.value;
            const id = this.id;
            console.log(`📊 Threshold ${id} cambiado a: ${value}`);
            
            // Actualizar panel de decisión cuando cambien los umbrales
            updateDecisionPanel();
            
            // Trigger de evento personalizado
            const thresholdEvent = new CustomEvent('thresholdChanged', {
                detail: {
                    inputId: id,
                    value: parseInt(value),
                    element: this
                }
            });
            document.dispatchEvent(thresholdEvent);
        });
    });
    
    // Inicializar solo con los thresholds LONG y SHORT
    updateDecisionPanel();
}

// Función para obtener la decisión actual
function getCurrentDecision() {
    const activeItem = document.querySelector('.decision-item.active');
    if (activeItem) {
        const label = activeItem.querySelector('.decision-label').textContent;
        return label.toLowerCase();
    }
    return 'espera'; // valor por defecto
}

// Función para establecer una decisión programáticamente
function setDecision(decision) {
    const decisionItems = document.querySelectorAll('.decision-item');
    decisionItems.forEach(item => {
        const label = item.querySelector('.decision-label').textContent.toLowerCase();
        if (label === decision.toLowerCase()) {
            // Remover active de todos
            decisionItems.forEach(i => i.classList.remove('active'));
            // Activar el seleccionado
            item.classList.add('active');
            
            // Trigger del evento
            const decisionEvent = new CustomEvent('decisionChanged', {
                detail: {
                    decision: decision.toLowerCase(),
                    element: item
                }
            });
            document.dispatchEvent(decisionEvent);
        }
    });
}

// Función para obtener los valores de threshold
function getThresholds() {
    const greenThreshold = document.getElementById('green-threshold');
    const redThreshold = document.getElementById('red-threshold');
    
    return {
        long: greenThreshold ? parseInt(greenThreshold.value) : 40,
        short: redThreshold ? parseInt(redThreshold.value) : 40
    };
}

// Inicializar el panel de decisión cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, inicializando paneles...');
    
    // Usar setTimeout para asegurar que todo esté renderizado
    setTimeout(() => {
        initializeDecisionPanel();
        initializeIndicatorsPanel();
    }, 500);
    
    console.log('✅ Paneles programados para inicialización');
});

// También escuchar el evento de componentes cargados por si acaso se ejecuta antes
document.addEventListener('componentsLoaded', function() {
    console.log('🔄 Componentes cargados, re-inicializando paneles...');
    
    // Usar setTimeout para asegurar que los componentes están completamente renderizados
    setTimeout(() => {
        initializeDecisionPanel();
        initializeIndicatorsPanel();
    }, 300);
    
    console.log('✅ Paneles programados para re-inicialización después de cargar componentes');
});

// FUNCIONALIDAD DEL PANEL DE INDICADORES
const defaultIndicators = {
    "RSI (Sobreventa/Sobrecompra)": { state: null, weight: 10 },
    "RSI (Divergencia)": { state: null, weight: 10 },
    "MACD (Cruces)": { state: null, weight: 10 },
    "MACD (Divergencia)": { state: null, weight: 10 },
    "Soporte/Resistencia": { state: null, weight: 10 },
    "Tendencia (Mayor temporalidad)": { state: null, weight: 10 },
    "Patrones": { state: null, weight: 10 },
    "Media Móvil": { state: null, weight: 10 }
};

// Inicializar indicatorsData asegurando que tenga todos los indicadores por defecto
let indicatorsData = { ...defaultIndicators };

// Mezclar con datos guardados si existen (preservando estructura)
function initIndicatorsData() {
    indicatorsData = { ...defaultIndicators };
}

// Función utilitaria para esperar hasta que un elemento esté disponible
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver((mutations, obs) => {
            const element = document.getElementById(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento ${selector} no encontrado después de ${timeout}ms`));
        }, timeout);
    });
}

async function initializeIndicatorsPanel() {
    // Proteger contra múltiples inicializaciones
    if (window._indicatorsPanelInitialized) {
        console.log('⏭️ Panel de indicadores ya fue inicializado, saltando...');
        return;
    }
    window._indicatorsPanelInitialized = true;
    
    console.log('🔍 Inicializando panel de indicadores...');
    
    try {
        // Esperar hasta que el elemento esté disponible
        const indicatorList = await waitForElement('indicator-list', 3000);
        console.log('✅ Elemento indicator-list encontrado');
        
        // Agregar event listeners
        indicatorList.addEventListener('click', handleIndicatorClick);
        indicatorList.addEventListener('input', handleIndicatorInput);
        indicatorList.addEventListener('blur', handleIndicatorInput, true); // true para captura
        
        // Agregar event listener al botón de añadir indicador
        const addIndicatorBtn = document.getElementById('add-indicator-btn');
        if (addIndicatorBtn) {
            addIndicatorBtn.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir cualquier comportamiento por defecto
                event.stopPropagation(); // Evitar que el evento se propague
                event.stopImmediatePropagation(); // Evitar que otros listeners se ejecuten
                console.log('🖱️ Click en botón añadir indicador');
                addNewIndicator(); // Llamar sin parámetros para que use su propio prompt
            });
            console.log('✅ Event listener agregado al botón añadir indicador');
        }
        
        // Inicializar datos de indicadores (asegurar todos los por defecto)
        initIndicatorsData();
        
        // Renderizar indicadores iniciales
        await renderIndicators();
        
        // Actualizar panel de decisión inicial
        updateDecisionPanel();
        
        console.log('🎯 Panel de indicadores inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando panel de indicadores:', error);
        
        // Intentar una vez más después de un delay
        setTimeout(async () => {
            console.log('🔄 Reintentando inicialización del panel de indicadores...');
            try {
                const indicatorList = document.getElementById('indicator-list');
                if (indicatorList) {
                    indicatorList.addEventListener('click', handleIndicatorClick);
                    indicatorList.addEventListener('input', handleIndicatorInput);
                    await renderIndicators();
                    console.log('✅ Panel de indicadores inicializado en segundo intento');
                } else {
                    console.error('❌ Elemento indicator-list aún no encontrado en segundo intento');
                }
            } catch (retryError) {
                console.error('❌ Error en segundo intento:', retryError);
            }
        }, 1000);
    }
}

async function renderIndicators() {
    // Evitar renderizaciones simultáneas
    if (window._renderingIndicators) {
        console.log('⏳ Ya hay un renderizado en progreso, esperando...');
        return new Promise(resolve => {
            const checkRender = setInterval(() => {
                if (!window._renderingIndicators) {
                    clearInterval(checkRender);
                    resolve();
                }
            }, 50);
        });
    }
    
    window._renderingIndicators = true;
    window._renderCallCount = (window._renderCallCount || 0) + 1;
    console.log(`📞 renderIndicators() llamada #${window._renderCallCount}`);
    
    const indicatorList = document.getElementById('indicator-list');
    
    if (!indicatorList) {
        console.warn('❌ No se puede renderizar - elemento indicator-list no encontrado');
        
        // Intentar esperar un poco más
        try {
            const element = await waitForElement('indicator-list', 2000);
            window._renderingIndicators = false;
            return await renderIndicators(); // Llamada recursiva con await
        } catch (error) {
            console.error('❌ No se pudo encontrar indicator-list después de esperar:', error);
            window._renderingIndicators = false;
            return;
        }
    }
    
    console.log('✅ Elemento indicator-list encontrado para renderizado');
    
    // Si ya se renderizó completamente, no repetir el log
    if (indicatorList.innerHTML && indicatorList.innerHTML.trim().length > 0) {
        console.log('✓ Indicadores ya renderizados, actualizando...');
    }
    
    indicatorList.innerHTML = '';
    
    if (!indicatorsData || Object.keys(indicatorsData).length === 0) {
        console.log('⚠️ No hay datos de indicadores');
        indicatorList.innerHTML = '<p class="text-center text-muted py-3">No hay indicadores configurados.</p>';
        window._renderingIndicators = false;
        return;
    }
    
    console.log(`📊 Renderizando ${Object.keys(indicatorsData).length} indicadores...`);
    
    Object.keys(indicatorsData).forEach(name => {
        const indicator = indicatorsData[name];
        const li = document.createElement('li');
        li.className = 'indicator-item';
        li.dataset.indicatorName = name;
        
        li.innerHTML = `
            <button class="indicator-button btn-green" data-state="green" title="Bullish"></button>
            <input type="number" class="weight-input" value="${indicator.weight}" min="0" max="99" title="Peso del indicador">
            <svg class="trash-icon-btn" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="Eliminar indicador">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <input type="text" class="label-input" value="${name}" title="Nombre del indicador (editable)">
            <button class="indicator-button btn-red" data-state="red" title="Bearish"></button>
        `;
        
        // Establecer estado activo si existe
        if (indicator.state === 'green') {
            li.querySelector('.btn-green').classList.add('active');
        } else if (indicator.state === 'red') {
            li.querySelector('.btn-red').classList.add('active');
        }
        
        indicatorList.appendChild(li);
        console.log(`✅ Indicador añadido: ${name}`);
    });
    
    console.log('🎯 Renderizado de indicadores completado');
    window._renderingIndicators = false;
}

function handleIndicatorClick(event) {
    const target = event.target;
    
    if (target.classList.contains('indicator-button')) {
        const indicatorItem = target.closest('.indicator-item');
        const indicatorName = indicatorItem.dataset.indicatorName;
        const state = target.dataset.state;
        const otherButton = indicatorItem.querySelector(`.btn-${state === 'green' ? 'red' : 'green'}`);
        
        if (target.classList.contains('active')) {
            // Si ya está activo, desactivarlo
            target.classList.remove('active');
            indicatorsData[indicatorName].state = null;
        } else {
            // Activar este botón y desactivar el otro
            target.classList.add('active');
            otherButton.classList.remove('active');
            indicatorsData[indicatorName].state = state;
        }
        
        console.log(`📊 Indicador ${indicatorName}: ${indicatorsData[indicatorName].state || 'neutral'}`);
        
        // Actualizar panel de decisión cuando cambie un indicador
        updateDecisionPanel();
        
        // Trigger evento personalizado
        const indicatorEvent = new CustomEvent('indicatorChanged', {
            detail: {
                indicatorName: indicatorName,
                state: indicatorsData[indicatorName].state,
                weight: indicatorsData[indicatorName].weight
            }
        });
        document.dispatchEvent(indicatorEvent);
        
    } else if (target.classList.contains('trash-icon-btn')) {
        const indicatorItem = target.closest('.indicator-item');
        const indicatorName = indicatorItem.dataset.indicatorName;
        deleteIndicator(indicatorName);
    }
}

function handleIndicatorInput(event) {
    if (event.target.classList.contains('weight-input')) {
        const indicatorItem = event.target.closest('.indicator-item');
        const indicatorName = indicatorItem.dataset.indicatorName;
        
        // Permitir campo vacío como peso 0
        const inputValue = event.target.value.trim();
        const weight = inputValue === '' ? 0 : Math.max(0, parseInt(inputValue) || 0);
        
        indicatorsData[indicatorName].weight = weight;
        
        // Si el campo está vacío y el usuario sale del campo (blur), mostrar "0"
        if (event.type === 'blur' && inputValue === '') {
            event.target.value = '0';
        }
        
        console.log(`⚖️ Peso de ${indicatorName} cambiado a: ${weight}`);
        
        // Actualizar panel de decisión cuando cambie el peso
        updateDecisionPanel();
        
        // Trigger evento personalizado
        const weightEvent = new CustomEvent('indicatorWeightChanged', {
            detail: {
                indicatorName: indicatorName,
                weight: weight,
                state: indicatorsData[indicatorName].state
            }
        });
        document.dispatchEvent(weightEvent);
    } else if (event.target.classList.contains('label-input')) {
        const indicatorItem = event.target.closest('.indicator-item');
        const oldName = indicatorItem.dataset.indicatorName;
        const newName = event.target.value.trim();
        
        // Si el nombre no cambió, no hacer nada
        if (newName === oldName) {
            return;
        }
        
        if (newName && !indicatorsData[newName]) {
            // Crear entrada con nuevo nombre
            indicatorsData[newName] = { ...indicatorsData[oldName] };
            delete indicatorsData[oldName];
            
            // Actualizar el dataset del elemento
            indicatorItem.dataset.indicatorName = newName;
            
            console.log(`📝 Indicador renombrado: "${oldName}" → "${newName}"`);
            
            // Trigger evento personalizado
            const renameEvent = new CustomEvent('indicatorRenamed', {
                detail: {
                    oldName: oldName,
                    newName: newName,
                    indicator: indicatorsData[newName]
                }
            });
            document.dispatchEvent(renameEvent);
        } else if (newName && indicatorsData[newName]) {
            // Si ya existe un indicador con ese nombre, revertir el cambio
            event.target.value = oldName;
            alert('Ya existe un indicador con ese nombre.');
        } else if (!newName) {
            // Si está vacío, revertir
            event.target.value = oldName;
        }
    }
}

function deleteIndicator(indicatorName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el indicador "${indicatorName}"?`)) {
        delete indicatorsData[indicatorName];
        renderIndicators();
        
        console.log(`🗑️ Indicador eliminado: ${indicatorName}`);
        
        // Trigger evento personalizado
        const deleteEvent = new CustomEvent('indicatorDeleted', {
            detail: {
                indicatorName: indicatorName
            }
        });
        document.dispatchEvent(deleteEvent);
    }
}

function addNewIndicator(name = null) {
    // Protección contra ejecuciones múltiples
    if (isAddingIndicator) {
        console.log('⚠️ Evitando ejecución múltiple de addNewIndicator');
        return;
    }
    
    isAddingIndicator = true;
    
    try {
        console.log('🔄 Iniciando addNewIndicator', { name });
        
        let indicatorName;
        if (name && name.trim()) {
            indicatorName = name.trim();
        } else {
            indicatorName = prompt('Introduce el nombre del nuevo indicador:');
        }
        
        if (!indicatorName || !indicatorName.trim()) {
            console.log('❌ Nombre de indicador vacío o cancelado');
            return;
        }
        
        const trimmedName = indicatorName.trim();
        if (indicatorsData.hasOwnProperty(trimmedName)) {
            alert('Ya existe un indicador con ese nombre.');
            console.log('❌ Indicador duplicado:', trimmedName);
            return;
        }
        
        indicatorsData[trimmedName] = { state: null, weight: 10 };
        renderIndicators();
        
        // Hacer foco en el campo del nuevo indicador para facilitar la edición
        setTimeout(() => {
            const newIndicatorInput = document.querySelector(`[data-indicator-name="${trimmedName}"] .label-input`);
            if (newIndicatorInput) {
                newIndicatorInput.focus();
                newIndicatorInput.select(); // Seleccionar todo el texto
            }
        }, 100);
        
        console.log(`➕ Nuevo indicador agregado: ${trimmedName}`);
        
        // Trigger evento personalizado
        const addEvent = new CustomEvent('indicatorAdded', {
            detail: {
                indicatorName: trimmedName,
                weight: 10
            }
        });
        document.dispatchEvent(addEvent);
        
    } finally {
        // Liberar el lock después de un pequeño delay para evitar clicks rápidos
        setTimeout(() => {
            isAddingIndicator = false;
        }, 500);
    }
}

// Funciones utilitarias para el panel de indicadores
function getIndicatorsData() {
    return { ...indicatorsData };
}

function setIndicatorsData(newData) {
    indicatorsData = { ...newData };
    renderIndicators();
}

function resetIndicators() {
    indicatorsData = { ...defaultIndicators };
    renderIndicators();
    console.log('🔄 Indicadores reseteados a valores por defecto');
}

function getIndicatorScores() {
    let greenScore = 0;
    let redScore = 0;
    
    Object.keys(indicatorsData).forEach(name => {
        const indicator = indicatorsData[name];
        if (indicator.state === 'green') {
            greenScore += indicator.weight;
        } else if (indicator.state === 'red') {
            redScore += indicator.weight;
        }
    });
    
    return { greenScore, redScore };
}

// Función de debugging manual
function forceRenderIndicators() {
    console.log('🔧 DEBUG: Forzando renderizado de indicadores...');
    const indicatorList = document.getElementById('indicator-list');
    console.log('🔧 DEBUG: Elemento encontrado:', !!indicatorList);
    if (indicatorList) {
        console.log('🔧 DEBUG: Contenido actual:', indicatorList.innerHTML);
        console.log('🔧 DEBUG: Datos de indicadores:', indicatorsData);
    }
    renderIndicators();
}

// Función para resetear todos los paneles (apagar luces y desactivar)
function resetAllPanels() {
    // Resetear paneles fijos
    const fixedPanels = document.querySelectorAll('#fixedPanelsContainer .control-panel');
    fixedPanels.forEach(panel => {
        const lights = panel.querySelectorAll('.traffic-light');
        lights.forEach(light => light.classList.remove('active'));
        panel.classList.remove('activated');
        removeMultiplierBadge(panel);
    });
    
    // Resetear paneles de usuario
    const userPanels = document.querySelectorAll('#userPanelsContainer .control-panel');
    userPanels.forEach(panel => {
        const lights = panel.querySelectorAll('.traffic-light');
        lights.forEach(light => light.classList.remove('active'));
        panel.classList.remove('activated');
        removeMultiplierBadge(panel);
    });
    
    // Resetear el panel de decisión
    const decisionItems = document.querySelectorAll('.decision-item');
    decisionItems.forEach(item => item.classList.remove('active'));
    const waitItem = document.getElementById('wait-signal');
    if (waitItem) waitItem.classList.add('active');
    
    // Actualizar el panel de decisión
    updateDecisionPanel();
    
    console.log('🔄 Todos los paneles reseteados');
}

// Exportar funciones globales
window.addNewPanel = addNewPanel;
window.deletePanel = deletePanel;
window.getPanelsState = getPanelsState;
window.loadPanelsState = loadPanelsState;
window.initializePanels = initializePanels;
window.handlePanelClick = handlePanelClick;
window.initializeDecisionPanel = initializeDecisionPanel;
window.getCurrentDecision = getCurrentDecision;
window.setDecision = setDecision;
window.getThresholds = getThresholds;
window.initializeIndicatorsPanel = initializeIndicatorsPanel;
window.addNewIndicator = addNewIndicator;
window.getIndicatorsData = getIndicatorsData;
window.setIndicatorsData = setIndicatorsData;
window.resetIndicators = resetIndicators;
window.resetAllPanels = resetAllPanels;
window.getIndicatorScores = getIndicatorScores;
window.defaultIndicators = defaultIndicators;
window.forceRenderIndicators = forceRenderIndicators;