// risk-calculator.js - Calculadora de gestión de riesgo

// Variables de estado para controlar si las alarmas están mostradas
let warningDisplayed = false;  // Alarma de Riesgo/Beneficio

// Función principal para actualizar todos los cálculos de riesgo
function updateRiskCalculations() {
    // Obtener todos los inputs relevantes
    const capitalTotalInput = document.getElementById('capital-total');
    const apalancamientoInput = document.getElementById('apalancamiento');
    const riesgoMaximoInput = document.getElementById('riesgo-maximo');
    const precioEntradaInput = document.getElementById('precio-entrada');
    const precioSlInput = document.getElementById('precio-sl');
    const precioSalidaInput = document.getElementById('precio-salida');
    const riesgoBeneficioInput = document.getElementById('riesgo-beneficio');
    const comisionInput = document.getElementById('comision');
    const financiacionInput = document.getElementById('financiacion');
    const spreadInput = document.getElementById('spread');
    const operacionTipoInput = document.getElementById('operacion-tipo');

    // Verificar que todos los elementos existen
    if (!capitalTotalInput || !apalancamientoInput || !riesgoMaximoInput || 
        !precioEntradaInput || !precioSlInput || !precioSalidaInput ||
        !riesgoBeneficioInput || !comisionInput || !financiacionInput || !spreadInput || !operacionTipoInput) {
        console.warn('Algunos elementos de la calculadora de riesgo no están disponibles');
        return;
    }

        // --- Herramienta 1: Precio Entrada y Precio SL (Distancia de Riesgo) ---
    const capital = parseFloat(capitalTotalInput.value) || 0;
    const apalancamiento = parseFloat(apalancamientoInput.value) || 1;
    const riesgoMaximo = parseFloat(riesgoMaximoInput.value) || 0;
    const precioEntrada = parseFloat(precioEntradaInput.value) || 0;
    const precioSL = parseFloat(precioSlInput.value) || 0;
    const riesgoAsumido = parseFloat(precioSalidaInput.value) || 0;

    // Distancia de Riesgo = ((Precio Entrada - Precio SL) / Precio Entrada) * 100
    // Valor absoluto: sin signo, siempre positivo
    const distanciaRiesgo = precioEntrada > 0 
        ? Math.abs(((precioEntrada - precioSL) / precioEntrada) * 100)
        : 0;
    
    // Margen = [Riesgo Máximo en USDT / (Distancia de Riesgo % / 100)] / Apalancamiento
    // Riesgo Máximo en USDT = (Capital * % a Invertir) / 100
    const margen = distanciaRiesgo > 0 
        ? ((capital * riesgoMaximo) / 100 / (distanciaRiesgo / 100)) / apalancamiento
        : 0;
    
    // Posición Total = Margen × Apalancamiento
    const posicionTotal = margen * apalancamiento;
    
    // Pérdida (en USDT) = Posición × Distancia de Riesgo
    const perdidaEnDolares = posicionTotal * (distanciaRiesgo / 100);
    
    // Ganancia según tipo de operación
    const precioEntradaNum = parseFloat(precioEntradaInput.value) || 0;
    const precioSalidaNum = parseFloat(precioSalidaInput.value) || 0;
    const operacionTipo = operacionTipoInput.value || 'long';
    
    let ganancia = 0;
    if (operacionTipo === 'long') {
        // Ganancia Long = Posición × [(Precio Salida / Precio Entrada) - 1]
        ganancia = precioEntradaNum > 0 
            ? posicionTotal * ((precioSalidaNum / precioEntradaNum) - 1)
            : 0;
    } else {
        // Ganancia Short = Posición × [(Precio Entrada - Precio Salida) / Precio Entrada]
        ganancia = precioEntradaNum > 0 
            ? posicionTotal * ((precioEntradaNum - precioSalidaNum) / precioEntradaNum)
            : 0;
    }

    // Obtener elementos para mostrar resultados
    const slTpCapitalDisplay = document.getElementById('sl-tp-capital');
    const slTpSlDisplay = document.getElementById('sl-tp-sl');
    const slTpPerdidaCombinadaDisplay = document.getElementById('sl-tp-perdida-combinada');
    const gananciResultadoDisplay = document.getElementById('ganancia-resultado');

    if (slTpCapitalDisplay) slTpCapitalDisplay.textContent = `$${margen.toFixed(2)}`;
    if (slTpSlDisplay) slTpSlDisplay.textContent = `${distanciaRiesgo.toFixed(2)}%`;
    if (slTpPerdidaCombinadaDisplay) {
        slTpPerdidaCombinadaDisplay.textContent = `$${perdidaEnDolares.toFixed(2)}`;
    }
    
    if (gananciResultadoDisplay) {
        gananciResultadoDisplay.textContent = `$${ganancia.toFixed(2)}`;
    }
    
    // Validación de Riesgo/Beneficio
    const riesgoBeneficio = parseFloat(riesgoBeneficioInput.value) || 0;
    const ratioGananciaPeridida = perdidaEnDolares > 0 ? ganancia / perdidaEnDolares : 0;
    
    // Si Ratio Ganancia/Pérdida < Riesgo/Beneficio Objetivo, mostrar alarma
    // Redondear a 10 decimales para evitar problemas de precisión flotante
    const ratioRedondeado = Math.round(ratioGananciaPeridida * 10000000000) / 10000000000;
    const debeAlerta = ratioRedondeado < riesgoBeneficio;
    if (debeAlerta) {
        if (!warningDisplayed) {
            showLossWarning(ratioGananciaPeridida, riesgoBeneficio);
            warningDisplayed = true;
        }
        // Agregar clase warning a Ganancia cuando hay alerta
        if (gananciResultadoDisplay) {
            gananciResultadoDisplay.classList.add('warning');
        }
    } else {
        if (warningDisplayed) {
            hideLossWarning();
            warningDisplayed = false;
        }
        // Remover clase warning de Ganancia cuando no hay alerta
        if (gananciResultadoDisplay) {
            gananciResultadoDisplay.classList.remove('warning');
        }
    }

    // --- Herramienta 2: Cálculo de Costes y Ganancia Mínima ---
    const comision = parseFloat(comisionInput.value) || 0;
    const financiacionPorcentaje = parseFloat(financiacionInput.value) || 0;
    const spread = parseFloat(spreadInput.value) || 0;

    // Comisión de entrada = Posición Total × (Comisión % / 100)
    const comisionEntrada = (posicionTotal * (comision / 100));
    
    // Comisión de salida = (Posición Total + Ganancia) × (Comisión % / 100)
    const comisionSalida = ((posicionTotal + ganancia) * (comision / 100));
    
    // Comisiones totales = Comisión entrada + Comisión salida
    const costeComisionDolares = comisionEntrada + comisionSalida;
    
    // Cálculo de financiación: [apalancamiento * margen * financiación (%)]/100
    const financiacionDolares = (apalancamiento * margen * financiacionPorcentaje) / 100;
    
    const gastosTotalesDolares = costeComisionDolares + financiacionDolares + spread;
    
    // El porcentaje a cubrir se calcula sobre el margen
    const porcentajeGananciaMinima = (gastosTotalesDolares / margen) * 100;

    // Obtener elementos para mostrar resultados
    const porcentajeCubrirDisplay = document.getElementById('porcentaje-cubrir');
    const comisionDolaresDisplay = document.getElementById('comision-dolares');
    const gastosDolaresDisplay = document.getElementById('gastos-dolares');

    if (comisionDolaresDisplay) comisionDolaresDisplay.textContent = `$${costeComisionDolares.toFixed(2)}`;
    if (gastosDolaresDisplay) gastosDolaresDisplay.textContent = `$${gastosTotalesDolares.toFixed(2)}`;
    if (porcentajeCubrirDisplay) porcentajeCubrirDisplay.textContent = `${porcentajeGananciaMinima.toFixed(2)}%`;
}

// Función para inicializar la calculadora de riesgo
function initializeRiskCalculator() {
    // Obtener todos los inputs relevantes para las herramientas de riesgo
    const riskInputs = [
        'capital-total', 'apalancamiento', 'riesgo-maximo', 
        'precio-entrada', 'precio-sl', 'precio-salida', 'riesgo-beneficio',
        'comision', 'financiacion', 'spread', 'operacion-tipo'
    ];

    // Establecer valores iniciales por defecto
    const defaultValues = {
        'riesgo-maximo': 3,
        'apalancamiento': 20,
        'precio-entrada': 100,
        'precio-sl': 95,
        'precio-salida': 110,
        'riesgo-beneficio': 2
    };

    riskInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && defaultValues[inputId] !== undefined) {
            // Solo establecer valor por defecto si el input está vacío o es cero
            if (!input.value || input.value == 0 || input.value == '') {
                input.value = defaultValues[inputId];
            }
        }

        if (input) {
            // Event listeners para cálculos
            input.addEventListener('input', updateRiskCalculations);
            input.addEventListener('change', updateRiskCalculations);
            
            // Validación para solo permitir números (excepto para select)
            if (input.type !== 'select-one') {
                input.addEventListener('keypress', function(e) {
                    // Permitir: números (0-9), punto decimal (.), teclas de control
                    const allowedKeys = [8, 9, 27, 13, 46, 110, 190]; // backspace, tab, escape, enter, delete, decimal
                    const key = e.which || e.keyCode;
                    
                    // Permitir teclas de control
                    if (allowedKeys.indexOf(key) !== -1 ||
                        // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                        (key === 65 && e.ctrlKey === true) ||
                        (key === 67 && e.ctrlKey === true) ||
                        (key === 86 && e.ctrlKey === true) ||
                        (key === 88 && e.ctrlKey === true) ||
                        (key === 90 && e.ctrlKey === true) ||
                        // Permitir home, end, left, right
                        (key >= 35 && key <= 39)) {
                        return;
                    }
                    
                    // Permitir solo números (0-9) y punto decimal
                    if ((key < 48 || key > 57) && key !== 46) {
                        e.preventDefault();
                    }
                    
                    // Permitir solo un punto decimal
                    if (key === 46 && input.value.indexOf('.') !== -1) {
                        e.preventDefault();
                    }
                });
            }
        }
    });
    
    // Ejecutar cálculo inicial con los valores por defecto
    updateRiskCalculations();
    
    console.log('💰 Calculadora de riesgo inicializada correctamente');
}

// Función para obtener el estado actual de la calculadora
function getRiskCalculatorState() {
    const inputs = [
        'capital-total', 'apalancamiento', 'riesgo-maximo', 
        'precio-entrada', 'precio-sl', 'precio-salida',
        'comision', 'financiacion', 'spread'
    ];
    
    const state = {};
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            state[inputId] = input.value;
        }
    });
    
    return state;
}

// Función para cargar el estado de la calculadora
function loadRiskCalculatorState(state) {
    // Migrar IDs viejos a nuevos (compatibilidad hacia atrás)
    const migrationMap = {
        'take-profit': 'precio-entrada',
        'risk-reward-ratio': 'precio-sl',
        'perdida-maxima': 'precio-salida',
        'porcentaje-cuenta': 'riesgo-maximo'
    };
    
    const migratedState = {};
    Object.keys(state).forEach(inputId => {
        const newId = migrationMap[inputId] || inputId;
        migratedState[newId] = state[inputId];
    });
    
    Object.keys(migratedState).forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input && migratedState[inputId] !== undefined) {
            input.value = migratedState[inputId];
        }
    });
    
    // Actualizar cálculos después de cargar
    setTimeout(() => {
        updateRiskCalculations();
    }, 100);
}

// Función para resetear la calculadora a valores por defecto
function resetRiskCalculator() {
    const defaults = {
        'capital-total': '1000',
        'apalancamiento': '20',
        'riesgo-maximo': '3',
        'precio-entrada': '100',
        'precio-sl': '95',
        'precio-salida': '110',
        'riesgo-beneficio': '2',
        'comision': '0.06',
        'financiacion': '0',
        'spread': '0'
    };
    
    loadRiskCalculatorState(defaults);
}

// Funciones para la alarma de Riesgo/Beneficio
function showLossWarning(ratioPorcentaje, riesgoBeneficioObjetivo) {
    // Remover cualquier advertencia anterior
    hideLossWarning();
    
    const mensaje = `Riesgo/Beneficio actual (${parseFloat(ratioPorcentaje).toFixed(2)}) es menor al objetivo (${parseFloat(riesgoBeneficioObjetivo).toFixed(2)})`;
    
    // Crear elemento de advertencia
    const warningDiv = document.createElement('div');
    warningDiv.id = 'loss-warning-alert';
    warningDiv.className = 'loss-warning-alert';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">
                <strong>¡ATENCIÓN!</strong><br>
                ${mensaje}
            </span>
            <button class="warning-close" onclick="hideLossWarning()">×</button>
        </div>
    `;
    
    // Insertar al principio del contenedor de herramientas de riesgo
    const riskContainer = document.querySelector('.risk-tools-container') || document.body;
    riskContainer.insertBefore(warningDiv, riskContainer.firstChild);
    
    // Animación de entrada
    setTimeout(() => {
        warningDiv.classList.add('show');
    }, 100);
}

function hideLossWarning() {
    const existingWarning = document.getElementById('loss-warning-alert');
    if (existingWarning) {
        existingWarning.classList.remove('show');
        setTimeout(() => {
            existingWarning.remove();
        }, 300);
    }
}



// Exportar funciones para uso global
window.updateRiskCalculations = updateRiskCalculations;
window.showLossWarning = showLossWarning;
window.hideLossWarning = hideLossWarning;
window.initializeRiskCalculator = initializeRiskCalculator;
window.getRiskCalculatorState = getRiskCalculatorState;
window.loadRiskCalculatorState = loadRiskCalculatorState;
window.resetRiskCalculator = resetRiskCalculator;