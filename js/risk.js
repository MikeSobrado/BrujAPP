// --- SECCIÓN DE GESTIÓN DE RIESGO ---

// Obtener todos los inputs relevantes para las herramientas de riesgo
const capitalTotalInput = document.getElementById('capital-total');
const apalancamientoInput = document.getElementById('apalancamiento');
const porcentajeCuentaInput = document.getElementById('porcentaje-cuenta');
const stopLossInput = document.getElementById('stop-loss');
const riskRewardRatioInput = document.getElementById('risk-reward-ratio');
const perdidaMaximaInput = document.getElementById('perdida-maxima');
const comisionInput = document.getElementById('comision');
const financiacionInput = document.getElementById('financiacion');
const spreadInput = document.getElementById('spread');

// Obtener los elementos para mostrar los resultados
const slTpCapitalDisplay = document.getElementById('sl-tp-capital');
const slTpTpDisplay = document.getElementById('sl-tp-tp');
const slTpPerdidaDolaresDisplay = document.getElementById('sl-tp-perdida-dolares');
const slTpPerdidaDisplay = document.getElementById('sl-tp-perdida');

const porcentajeCubrirDisplay = document.getElementById('porcentaje-cubrir');
const comisionDolaresDisplay = document.getElementById('comision-dolares');
const gastosDolaresDisplay = document.getElementById('gastos-dolares');

// Función principal para actualizar todos los cálculos de riesgo
function updateRiskCalculations() {
    // --- Herramienta 1: Stop Loss y Take Profit ---
    const capital = parseFloat(capitalTotalInput.value) || 0;
    const apalancamiento = parseFloat(apalancamientoInput.value) || 1;
    const porcentajeCuenta = parseFloat(porcentajeCuentaInput.value) || 0;
    const stopLoss = parseFloat(stopLossInput.value) || 0;
    const riskRewardRatio = parseFloat(riskRewardRatioInput.value) || 1;
    const perdidaMaximaDeseada = parseFloat(perdidaMaximaInput.value) || 0;

    const capitalArriesgado = capital * (porcentajeCuenta / 100);
    const posicionTotal = capitalArriesgado * apalancamiento;
    const takeProfitPorcentaje = stopLoss * riskRewardRatio;
    const perdidaEnDolares = posicionTotal * (stopLoss / 100);
    const perdidaPorcentualReal = (perdidaEnDolares / capital) * 100;

    slTpCapitalDisplay.textContent = `$${capitalArriesgado.toFixed(2)}`;
    slTpTpDisplay.textContent = `${takeProfitPorcentaje.toFixed(2)}%`;
    slTpPerdidaDolaresDisplay.textContent = `$${perdidaEnDolares.toFixed(2)}`;
    slTpPerdidaDisplay.textContent = `${perdidaPorcentualReal.toFixed(2)}%`;
    
    // Añadir clase de advertencia si la pérdida real supera la máxima deseada
    if (perdidaPorcentualReal > perdidaMaximaDeseada) {
        slTpPerdidaDisplay.classList.add('warning');
    } else {
        slTpPerdidaDisplay.classList.remove('warning');
    }

    // --- Herramienta 2: Cálculo de Costes y Ganancia Mínima ---
    const comision = parseFloat(comisionInput.value) || 0;
    const financiacion = parseFloat(financiacionInput.value) || 0;
    const spread = parseFloat(spreadInput.value) || 0;

    // --- LÍNEA CORREGIDA ---
    // La comisión se aplica al valor total de la posición y se cobra al entrar y al salir (x2)
    const costeComisionDolares = (posicionTotal * (comision / 100)) * 2;
    
    const gastosTotalesDolares = costeComisionDolares + financiacion + spread;
    
    // El porcentaje a cubrir se calcula sobre el capital arriesgado (margen)
    const porcentajeGananciaMinima = (gastosTotalesDolares / capitalArriesgado) * 100;

    comisionDolaresDisplay.textContent = `$${costeComisionDolares.toFixed(2)}`;
    gastosDolaresDisplay.textContent = `$${gastosTotalesDolares.toFixed(2)}`;
    porcentajeCubrirDisplay.textContent = `${porcentajeGananciaMinima.toFixed(2)}%`;
}

// Añadir event listeners a todos los inputs para que los cálculos se actualicen en tiempo real
const riskInputs = [
    capitalTotalInput, apalancamientoInput, porcentajeCuentaInput, 
    stopLossInput, riskRewardRatioInput, perdidaMaximaInput,
    comisionInput, financiacionInput, spreadInput
];

riskInputs.forEach(input => {
    if (input) {
        input.addEventListener('input', updateRiskCalculations);
    }
});

// Llamar a la función una vez al cargar la página para mostrar los valores iniciales
document.addEventListener('DOMContentLoaded', updateRiskCalculations);