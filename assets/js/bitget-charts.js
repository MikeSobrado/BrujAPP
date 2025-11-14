// bitget-charts.js - Gráficas de monitoreo de posiciones de Bitget
//
// ============================================================================
// ARQUITECTURA MODULARIZADA (Segura)
// ============================================================================
//
// Esta clase implementa un diseño MONOLÍTICO CON MÉTODOS PRIVADOS para:
// 1. Mantener la cohesión entre métodos (evitar problemas de sincronización)
// 2. Reutilizar lógica común (_destroyChart, _getCanvasContext, etc)
// 3. Facilitar pruebas y mantenimiento dentro de una clase unificada
//
// SECCIONES:
// - MÉTODOS PRIVADOS AUXILIARES: Helpers reutilizables
// - MÉTODOS PÚBLICOS - DATOS: Carga y cálculo de estadísticas
// - GRÁFICAS - CHARTS: Métodos de renderizado individual
// - ORQUESTACIÓN: Métodos que coordinan múltiples gráficas
//
// NO SE USAN ES6 IMPORTS para evitar problemas de sincronización con 
// la API y el sistema de cache (window.cache, window.BitgetCharts, etc)
//
// ============================================================================

/**
 * Sistema de monitoreo para datos de Bitget
 */
class BitgetChartsManager {
    constructor() {
        this.charts = {};
        this.positions = [];
    }

    // ==================== MÉTODOS PRIVADOS AUXILIARES ====================
    
    /**
     * Valida que un canvas existe y retorna su contexto 2D
     * @private
     */
    _getCanvasContext(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`❌ Canvas #${canvasId} no encontrado`);
            return null;
        }
        return canvas.getContext('2d');
    }

    /**
     * Destruye una gráfica existente de manera segura
     * @private
     */
    _destroyChart(chartKey) {
        if (this.charts[chartKey] && typeof this.charts[chartKey].destroy === 'function') {
            this.charts[chartKey].destroy();
            this.charts[chartKey] = null;
        }
    }

    /**
     * Reemplaza comillas inteligentes por comillas normales (fix para emoji)
     * @private
     */
    _sanitizeText(text) {
        return text.replace(/[""]/g, '"').replace(/[']/g, "'");
    }

    // ==================== MÉTODOS PÚBLICOS - DATOS ====================

    /**
     * Cargar posiciones del cache
     */
    loadPositionsFromCache() {
        if (window.cache) {
            this.positions = window.cache.get('bitget_positions') || [];
            console.log(`📊 ${this.positions.length} posiciones cargadas del cache`);
            return this.positions;
        }
        return [];
    }

    /**
     * Calcular estadísticas básicas
     */
    calculateStats() {
        // Si no hay posiciones en memoria, intentar cargar del cache
        if (!this.positions || this.positions.length === 0) {
            this.loadPositionsFromCache();
        }

        if (!this.positions || this.positions.length === 0) {
            return {
                totalTrades: 0,
                winningTrades: 0,
                losingTrades: 0,
                winRate: 0,
                totalPnL: 0,
                longTrades: 0,
                shortTrades: 0
            };
        }

        const stats = {
            totalTrades: this.positions.length,
            winningTrades: 0,
            losingTrades: 0,
            totalPnL: 0,
            longTrades: 0,
            shortTrades: 0
        };

        this.positions.forEach(position => {
            const pnl = parseFloat(position.netProfit || position.unrealizedPL || 0);
            const side = (position.holdSide || '').toLowerCase();

            stats.totalPnL += pnl;

            if (pnl >= 0) {
                stats.winningTrades++;
            } else {
                stats.losingTrades++;
            }

            if (side === 'long') {
                stats.longTrades++;
            } else if (side === 'short') {
                stats.shortTrades++;
            }
        });

        stats.winRate = stats.totalTrades > 0 
            ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(2)
            : 0;

        return stats;
    }

    // ==================== GRÁFICAS - CHARTS ====================
    
    /**
     * PHASE 1 - Gráfica 1: Curva de Equidad (P&L Acumulado)
     */
    createEquityCurveChart() {
        const canvas = document.getElementById('chart-equity-curve');
        if (!canvas) {
            console.warn('❌ Canvas para Equity Curve no encontrado');
            console.warn('IDs disponibles de canvas:', Array.from(document.querySelectorAll('canvas')).map(c => c.id));
            return;
        }

        console.log('📊 Canvas encontrado, procesando datos...');

        // Diagnóstico de dimensiones del canvas
        const rect = canvas.getBoundingClientRect();
        console.log(`📐 Canvas Equity Curve - Rect: width=${rect.width}, height=${rect.height}, top=${rect.top}, left=${rect.left}`);
        console.log(`📐 Canvas Equity Curve - Computed: width=${canvas.width}, height=${canvas.height}`);
        
        // Establecer dimensiones reales
        const parent = canvas.parentElement;
        const computedStyle = window.getComputedStyle(parent);
        let parentWidth = parent.offsetWidth;
        let parentHeight = parent.offsetHeight;
        console.log(`📐 Parent dimensions - offset: width=${parentWidth}, height=${parentHeight}`);
        console.log(`📐 Parent style - width: ${computedStyle.width}, height: ${computedStyle.height}`);
        
        // Si el parent no tiene dimensiones, forzar valores mínimos
        if (parentHeight < 100) {
            console.warn('⚠️ Parent tiene altura muy pequeña:', parentHeight);
            parent.style.minHeight = '450px';
            parent.style.height = '450px';
            parentHeight = 450;
        }
        
        if (parentWidth < 100) {
            console.warn('⚠️ Parent tiene ancho muy pequeño:', parentWidth);
            parent.style.width = '100%';
            parentWidth = parent.offsetWidth || 400;
        }
        
        // Forzar dimensiones del parent también
        parent.style.display = 'flex';
        parent.style.alignItems = 'stretch';
        
        // Asegurar que el canvas tenga las dimensiones correctas
        canvas.width = parentWidth || 400;
        canvas.height = parentHeight || 450;
        console.log(`📐 FINAL Canvas dimensions establecidas: width=${canvas.width}, height=${canvas.height}`);

        // Ordenar posiciones por fecha (ctime es minúscula según Bitget)
        // Validar que this.positions sea un array antes de iterar
        if (!Array.isArray(this.positions)) {
            console.warn('⚠️ this.positions no es un array:', this.positions);
            this.positions = [];
        }
        
        const sorted = [...this.positions].sort((a, b) => {
            const timeA = parseInt(a.ctime || a.cTime || 0) || 0;
            const timeB = parseInt(b.ctime || b.cTime || 0) || 0;
            return timeA - timeB;
        });

        // Calcular P&L acumulado
        let cumulative = 0;
        const labels = [];
        const data = [];

        sorted.forEach((position, index) => {
            const pnl = parseFloat(position.netProfit || position.unrealizedPL || 0);
            cumulative += pnl;
            
            let timestamp = parseInt(position.ctime || position.cTime || 0) || 0;
            // Validar que sea un timestamp válido en milisegundos
            if (timestamp > 0 && timestamp <= Date.now() * 2) {
                const date = new Date(timestamp);
                labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
            } else {
                labels.push('N/A');
            }
            data.push(cumulative.toFixed(2));
        });

        // Destruir gráfica anterior si existe
        this._destroyChart('equityCurve');

        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js no disponible');
            return;
        }

        // Crear gráfica
        try {
            const ctx = canvas.getContext('2d');
            this.charts.equityCurve = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'P&L Acumulado (USDT)',
                        data: data,
                        borderColor: cumulative >= 0 ? '#28a745' : '#dc3545',
                        backgroundColor: cumulative >= 0 
                            ? 'rgba(40, 167, 69, 0.1)' 
                            : 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                        pointHoverRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Curva de Equidad - P&L Acumulado',
                            font: { size: 14, weight: 'bold' }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 12 },
                            cornerRadius: 4,
                            displayColors: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'USDT'
                            }
                        }
                    }
                }
            });

            console.log('✅ Equity Curve chart creado');
        } catch (error) {
            console.error('❌ Error al crear Equity Curve:', error);
        }
    }

    /**
     * PHASE 1 - Gráfica 2: P&L por Posición (Barras horizontales)
     */
    createPnLBarChart() {
        const canvas = document.getElementById('chart-pnl-bars');
        if (!canvas) {
            console.warn('❌ Canvas para P&L Bars no encontrado');
            return;
        }

        console.log('📊 Canvas P&L Bars encontrado, procesando datos...');

        // Establecer dimensiones reales
        const parent = canvas.parentElement;
        let parentWidth = parent.offsetWidth;
        let parentHeight = parent.offsetHeight;
        
        if (parentHeight < 100) {
            console.warn('⚠️ Parent tiene altura muy pequeña:', parentHeight);
            parent.style.minHeight = '450px';
            parent.style.height = '450px';
            parentHeight = 450;
        }
        
        if (parentWidth < 100) {
            console.warn('⚠️ Parent tiene ancho muy pequeño:', parentWidth);
            parent.style.width = '100%';
            parentWidth = parent.offsetWidth || 400;
        }
        
        parent.style.display = 'flex';
        parent.style.alignItems = 'stretch';
        
        canvas.width = parentWidth || 400;
        canvas.height = parentHeight || 450;

        const labels = [];
        const data = [];
        const colors = [];

        this.positions.slice(0, 30).forEach((position, index) => {
            const symbol = position.symbol || `Trade ${index + 1}`;
            const pnl = parseFloat(position.netProfit || position.unrealizedPL || 0);
            
            labels.push(symbol);
            data.push(pnl.toFixed(2));
            colors.push(pnl >= 0 ? '#28a745' : '#dc3545');
        });

        // Destruir gráfica anterior si existe
        this._destroyChart('pnlBars');

        try {
            const ctx = canvas.getContext('2d');
            this.charts.pnlBars = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'P&L (USDT)',
                        data: data,
                        backgroundColor: colors,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    indexAxis: 'y',
                    plugins: {
                        title: {
                            display: true,
                            text: 'P&L por Posición (últimas 30)',
                            font: { size: 14, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'USDT'
                            }
                        }
                    }
                }
            });

            console.log('✅ P&L Bar chart creado');
        } catch (error) {
            console.error('❌ Error al crear P&L Bar chart:', error);
        }
    }

    /**
     * PHASE 1 - Gráfica 3: LONG vs SHORT
     */
    createLongVsShortChart() {
        const canvas = document.getElementById('chart-long-vs-short');
        if (!canvas) {
            console.warn('❌ Canvas para Long vs Short no encontrado');
            return;
        }

        console.log('📊 Canvas Long vs Short encontrado, procesando datos...');

        // Establecer dimensiones reales
        const parent = canvas.parentElement;
        let parentWidth = parent.offsetWidth;
        let parentHeight = parent.offsetHeight;
        
        if (parentHeight < 100) {
            console.warn('⚠️ Parent tiene altura muy pequeña:', parentHeight);
            parent.style.minHeight = '450px';
            parent.style.height = '450px';
            parentHeight = 450;
        }
        
        if (parentWidth < 100) {
            console.warn('⚠️ Parent tiene ancho muy pequeño:', parentWidth);
            parent.style.width = '100%';
            parentWidth = parent.offsetWidth || 400;
        }
        
        parent.style.display = 'flex';
        parent.style.alignItems = 'stretch';
        
        canvas.width = parentWidth || 400;
        canvas.height = parentHeight || 450;

        const stats = this.calculateStats();

        // Destruir gráfica anterior si existe
        this._destroyChart('longVsShort');

        try {
            const ctx = canvas.getContext('2d');
            this.charts.longVsShort = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['LONG', 'SHORT'],
                    datasets: [{
                        data: [stats.longTrades, stats.shortTrades],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderColor: ['#1e7e34', '#bd2130'],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución LONG vs SHORT',
                            font: { size: 14, weight: 'bold' }
                        },
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = stats.longTrades + stats.shortTrades;
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            console.log('✅ Long vs Short chart creado');
        } catch (error) {
            console.error('❌ Error al crear Long vs Short chart:', error);
        }
    }

    /**
     * PHASE 1 - Estadísticas: Win Rate
     */
    createWinRateStats() {
        const container = document.getElementById('chart-win-rate-stats');
        if (!container) {
            console.warn('❌ Contenedor para estadísticas no encontrado');
            return;
        }

        const stats = this.calculateStats();

        const html = `
            <div class="row">
                <div class="col-md-2">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h5 class="card-title">Total Trades</h5>
                            <h2 class="text-primary">${stats.totalTrades}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h5 class="card-title">Win Rate</h5>
                            <h2 class="text-success">${stats.winRate}%</h2>
                            <small class="text-muted">${stats.winningTrades}W / ${stats.losingTrades}L</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h5 class="card-title">Total P&L</h5>
                            <h2 class="${stats.totalPnL >= 0 ? 'text-success' : 'text-danger'}">
                                ${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)} USDT
                            </h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body text-center">
                            <h5 class="card-title">Promedio</h5>
                            <h2 class="${(stats.totalPnL / stats.totalTrades) >= 0 ? 'text-success' : 'text-danger'}">
                                ${(stats.totalPnL / stats.totalTrades).toFixed(2)} USDT
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        console.log('✅ Win Rate Stats creado');
    }

    /**
    * Renderizar estadísticas rápidas en la sección de Posiciones
     */
    renderMovementsStats() {
    const container = document.getElementById('posiciones-stats-container');
        if (!container) {
            console.warn('❌ Contenedor para estadísticas de posiciones no encontrado');
            return;
        }

        const stats = this.calculateStats();

        // Si no hay datos, mostrar mensaje
        if (stats.totalTrades === 0) {
            container.innerHTML = '<p class="text-muted text-center">Carga las posiciones para ver las estadísticas</p>';
            return;
        }

        const html = `
            <div class="row">
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">Total de Operaciones</h6>
                            <h3 class="text-primary mb-0">${stats.totalTrades}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">Win Rate</h6>
                            <h3 class="text-success mb-0">${stats.winRate}%</h3>
                            <small class="text-muted">${stats.winningTrades}W / ${stats.losingTrades}L</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">Total P&L</h6>
                            <h3 class="${stats.totalPnL >= 0 ? 'text-success' : 'text-danger'} mb-0">
                                ${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
                            </h3>
                            <small>USDT</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 bg-light">
                        <div class="card-body text-center">
                            <h6 class="card-title text-muted">Promedio</h6>
                            <h3 class="${(stats.totalPnL / stats.totalTrades) >= 0 ? 'text-success' : 'text-danger'} mb-0">
                                ${(stats.totalPnL / stats.totalTrades) >= 0 ? '+' : ''}${(stats.totalPnL / stats.totalTrades).toFixed(2)}
                            </h3>
                            <small>USDT</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    console.log('✅ Estadísticas de Posiciones renderizadas');
    }

    /**
     * PHASE 2 - Gráfica 1: Drawdown Máximo
     */
    createDrawdownChart() {
        const canvas = document.getElementById('chart-drawdown');
        if (!canvas) {
            console.warn('❌ Canvas para Drawdown no encontrado');
            return;
        }

        console.log('📊 Calculando Drawdown Máximo...');

        // Calcular equity curve acumulada
        const equityCurve = [0]; // Comenzar desde 0
        let runningTotal = 0;

        this.positions.forEach(position => {
            const pnl = parseFloat(position.netProfit || position.unrealizedPL || 0);
            runningTotal += pnl;
            equityCurve.push(runningTotal);
        });

        // Calcular drawdown en cada punto
        const drawdowns = [];
        let peak = equityCurve[0];

        equityCurve.forEach(value => {
            if (value > peak) {
                peak = value;
            }
            const drawdown = ((value - peak) / Math.abs(peak) * 100) || 0;
            drawdowns.push(drawdown);
        });

        // Preparar labels (índice de operación)
        const labels = equityCurve.map((_, idx) => idx === 0 ? 'Inicio' : `Op ${idx}`);

        // Destruir gráfica anterior si existe
        this._destroyChart('drawdown');

        try {
            const ctx = canvas.getContext('2d');
            this.charts.drawdown = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Drawdown (%)',
                        data: drawdowns,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#ef4444',
                            borderWidth: 1,
                            cornerRadius: 6,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `Drawdown: ${context.parsed.y.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1) + '%';
                                },
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                }
            });

            console.log('✅ Drawdown chart creado');
        } catch (error) {
            console.error('❌ Error al crear Drawdown chart:', error);
        }
    }

    /**
     * Gráfica 2 Phase 2: Distribución de P&L
     * Histograma que muestra la frecuencia de ganancias/pérdidas en rangos
     */
    createPnLDistributionChart() {
        try {
            const ctx = document.getElementById('chart-pnl-distribution');
            if (!ctx) {
                console.warn('⚠️ Canvas chart-pnl-distribution no encontrado');
                return;
            }

            this._destroyChart('pnlDistribution');

            // Extraer P&L de cada posición
            const pnlValues = this.positions.map(pos => parseFloat(pos.netProfit || 0));
            
            if (pnlValues.length === 0) {
                console.warn('⚠️ Sin datos de P&L para distribuir');
                return;
            }

            // Calcular rango y crear buckets
            const minPnL = Math.min(...pnlValues);
            const maxPnL = Math.max(...pnlValues);
            const range = maxPnL - minPnL;
            const bucketSize = range / 10 || 1; // 10 buckets
            
            // Crear estructura de buckets
            const buckets = {};
            for (let i = 0; i < 10; i++) {
                const bucketMin = minPnL + (i * bucketSize);
                const bucketMax = bucketMin + bucketSize;
                buckets[i] = {
                    min: bucketMin,
                    max: bucketMax,
                    count: 0,
                    label: `${bucketMin.toFixed(2)} - ${bucketMax.toFixed(2)}`
                };
            }

            // Contar valores en cada bucket
            pnlValues.forEach(pnl => {
                for (let i = 0; i < 10; i++) {
                    if (pnl >= buckets[i].min && pnl <= buckets[i].max) {
                        buckets[i].count++;
                        break;
                    }
                }
            });

            // Preparar datos para Chart.js
            const labels = Object.values(buckets).map(b => b.label);
            const counts = Object.values(buckets).map(b => b.count);
            
            // Color según profitabilidad del bucket
            const colors = Object.values(buckets).map(b => {
                const midpoint = (b.min + b.max) / 2;
                return midpoint >= 0 ? '#10b981' : '#ef4444'; // Verde para ganancias, rojo para pérdidas
            });

            this.charts.pnlDistribution = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de Trades',
                        data: counts,
                        backgroundColor: colors,
                        borderColor: colors,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'x',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: {
                                size: 12,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 11
                            },
                            displayColors: true,
                            callbacks: {
                                title: function(tooltipItems) {
                                    return `Rango: ${tooltipItems[0].label}`;
                                },
                                label: function(context) {
                                    return `Trades: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Número de Trades'
                            },
                            ticks: {
                                stepSize: 1,
                                precision: 0,
                                color: '#6b7280'
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: true
                            }
                        },
                        x: {
                            ticks: {
                                color: '#6b7280',
                                maxRotation: 45,
                                minRotation: 0
                            },
                            grid: {
                                display: false,
                                drawBorder: true
                            }
                        }
                    }
                }
            });

            console.log('✅ P&L Distribution chart creado');
        } catch (error) {
            console.error('❌ Error al crear P&L Distribution chart:', error);
        }
    }

    /**
     * Gráfica 3 Phase 2: Comisiones Acumuladas
     * Línea que muestra el total de comisiones pagadas a lo largo del tiempo
     * Suma: openFee + closeFee + totalFunding
     */
    createAccumulatedFeesChart() {
        try {
            const ctx = document.getElementById('chart-accumulated-fees');
            if (!ctx) {
                console.warn('⚠️ Canvas chart-accumulated-fees no encontrado');
                return;
            }

            this._destroyChart('accumulatedFees');

            // Extraer comisiones y crear estructura de datos
            // Las comisiones son: openFee + closeFee + totalFunding
            // - openFee: comisión de apertura (negativa, es lo que pagas)
            // - closeFee: comisión de cierre (negativa, es lo que pagas)
            // - totalFunding: funding rate (puede ser positivo si te pagan, o negativo si te cobran)
            // Mostrar como GASTO ACUMULADO (valores positivos hacia arriba)
            let accumulatedFees = 0;
            const feesData = this.positions.map((pos, index) => {
                const openFee = parseFloat(pos.openFee || 0);
                const closeFee = parseFloat(pos.closeFee || 0);
                const fundingFee = parseFloat(pos.totalFunding || 0);
                const totalPositionFee = openFee + closeFee + fundingFee;
                accumulatedFees += totalPositionFee;
                // Invertir el signo para mostrar como gasto (positivo hacia arriba)
                return -accumulatedFees;
            });

            // Crear labels (índice o timestamp si está disponible)
            const labels = this.positions.map((pos, index) => {
                // ctime es minúscula según Bitget, pero soportamos ambos casos
                if (pos.ctime || pos.cTime) {
                    let timestamp = parseInt(pos.ctime || pos.cTime) || 0;
                    // Bitget devuelve ctime SIEMPRE en milisegundos, no convertir
                    if (timestamp > 0 && timestamp <= Date.now() * 2) {
                        const date = new Date(timestamp);
                        return date.toLocaleDateString('es-ES');
                    }
                }
                if (pos.createdTime) {
                    const date = new Date(pos.createdTime * 1000);
                    return date.toLocaleDateString('es-ES');
                }
                return `Trade ${index + 1}`;
            });

            this.charts.accumulatedFees = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Comisiones Acumuladas (USDT)',
                        data: feesData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                        pointBackgroundColor: '#f59e0b'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                },
                                color: '#374151'
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            titleFont: {
                                size: 12,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 11
                            },
                            displayColors: true,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y;
                                    return `Gastos: ${Math.abs(value).toFixed(4)} USDT`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Gastos en Comisiones (USDT)',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            },
                            ticks: {
                                color: '#6b7280',
                                callback: function(value) {
                                    return Math.abs(value).toFixed(2);
                                }
                            },
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)',
                                drawBorder: true
                            }
                        },
                        x: {
                            ticks: {
                                color: '#6b7280',
                                maxRotation: 45,
                                minRotation: 0
                            },
                            grid: {
                                display: false,
                                drawBorder: true
                            }
                        }
                    }
                }
            });

            console.log('✅ Accumulated Fees chart creado');
        } catch (error) {
            console.error('❌ Error al crear Accumulated Fees chart:', error);
        }
    }

    // ==================== ORQUESTACIÓN - COORDINACIÓN ====================

    /**
     * Renderizar todas las gráficas Phase 1
     * Orquesta la carga de datos y el renderizado de todas las gráficas
     */
    renderAllCharts() {
        console.log('📊 ========== INICIANDO RENDERIZADO DE GRÁFICAS ==========');
        
        this.loadPositionsFromCache();
        
        console.log(`📌 Posiciones en cache: ${this.positions.length}`);
        
        if (this.positions.length === 0) {
            console.warn('⚠️ No hay posiciones para graficar. Verifica que hayas cargado datos en Posiciones');
            return false;
        }

        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js no está disponible. Verifica que la librería esté cargada');
            return false;
        }

        console.log('✅ Chart.js disponible');

        // Verificar que los canvas existan
        const canvasIds = ['chart-equity-curve', 'chart-pnl-bars', 'chart-long-vs-short', 'chart-win-rate-stats', 'chart-drawdown', 'chart-pnl-distribution', 'chart-accumulated-fees'];
        const foundCanvases = canvasIds.filter(id => document.getElementById(id));
        console.log(`📍 Canvas encontrados: ${foundCanvases.length}/${canvasIds.length} - ${foundCanvases.join(', ')}`);        if (foundCanvases.length === 0) {
            console.error('❌ Ningún canvas encontrado. Verifica que estés en la pestaña de Gráficas');
            return false;
        }

        try {
            console.log('📊 Creando Equity Curve...');
            this.createEquityCurveChart();
            
            console.log('📊 Creando P&L Bar Chart...');
            this.createPnLBarChart();
            
            console.log('📊 Creando Long vs Short...');
            this.createLongVsShortChart();
            
            console.log('📊 Creando Win Rate Stats...');
            this.createWinRateStats();

            console.log('📊 Creando Drawdown Máximo...');
            this.createDrawdownChart();

            console.log('📊 Creando Distribución de P&L...');
            this.createPnLDistributionChart();

            console.log('📊 Creando Comisiones Acumuladas...');
            this.createAccumulatedFeesChart();

            console.log('✅ ========== TODAS LAS GRÁFICAS RENDERIZADAS ==========');
            return true;
        } catch (error) {
            console.error('❌ Error renderizando gráficas:', error);
            console.error('Stack:', error.stack);
            return false;
        }
    }

    // ==================== LIMPIEZA Y DESTRUCCIÓN ====================

    /**
     * Limpiar todos los datos y gráficas - Llamado en auto-logout
     * Destruye todas las instancias de Chart.js y resetea el estado
     */
    clearAll() {
        console.log('[CHARTS-CLEAR] 🧹 Limpiando BitgetCharts...');
        
        // 1. Destruir todos los charts
        const chartKeys = Object.keys(this.charts);
        chartKeys.forEach(key => {
            try {
                if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
                    console.log(`[CHARTS-CLEAR] 🔥 Destruyendo chart: ${key}`);
                    this.charts[key].destroy();
                    this.charts[key] = null;
                }
            } catch (e) {
                console.warn(`[CHARTS-CLEAR] ⚠️ Error destruyendo chart ${key}:`, e);
            }
        });
        
        // 2. Limpiar referencias
        this.charts = {};
        this.positions = [];
        
        // 3. Limpiar canvas del DOM
        const monitoreoPane = document.getElementById('monitoreo');
        if (monitoreoPane) {
            const canvases = monitoreoPane.querySelectorAll('canvas');
            canvases.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
            console.log(`[CHARTS-CLEAR] 🧹 ${canvases.length} canvas limpiados`);
        }
        
        console.log('[CHARTS-CLEAR] ✅ BitgetCharts limpiado completamente');
    }
}

// Instancia global
window.BitgetCharts = new BitgetChartsManager();

/**
 * Función global para renderizar gráficas - Llamada desde botones HTML
 */
async function renderBitgetCharts() {
    console.log('🎨 ========== RENDERIZADO MANUAL DE GRÁFICAS INICIADO ==========');
    
    // DIAGNÓSTICO DE CONTENEDORES
    const graficasPane = document.getElementById('monitoreo');
    if (graficasPane) {
        // Forzar dimensiones del pane
        graficasPane.style.display = 'block';
        graficasPane.style.visibility = 'visible';
        graficasPane.style.opacity = '1';
        graficasPane.style.minHeight = '600px';
        graficasPane.style.width = '100%';
        
        // Forzar reflow
        const _ = graficasPane.offsetHeight;
        const _2 = graficasPane.offsetWidth;
        
        const paneRect = graficasPane.getBoundingClientRect();
        const paneStyle = window.getComputedStyle(graficasPane);
        console.log(`🔍 DIAGNÓSTICO del pane #monitoreo (DESPUÉS de forzar):`);
        console.log(`   - Display: ${paneStyle.display}`);
        console.log(`   - Visibility: ${paneStyle.visibility}`);
        console.log(`   - Opacity: ${paneStyle.opacity}`);
        console.log(`   - Rect: width=${paneRect.width}, height=${paneRect.height}`);
        console.log(`   - Offset: width=${graficasPane.offsetWidth}, height=${graficasPane.offsetHeight}`);
        console.log(`   - ScrollHeight: ${graficasPane.scrollHeight}`);
    }
    
    // Verificar contenedor y forzar sus dimensiones
    const monitoreoPane = document.getElementById('monitoreo');
    if (monitoreoPane) {
        monitoreoPane.style.minHeight = '500px';
        const rect = monitoreoPane.getBoundingClientRect();
        console.log(`🔍 DIAGNÓSTICO del #monitoreo (DESPUÉS):`);
        console.log(`   - Rect: width=${rect.width}, height=${rect.height}`);
        console.log(`   - Offset: width=${monitoreoPane.offsetWidth}, height=${monitoreoPane.offsetHeight}`);
    }
    
    // Verificar cards y forzar sus dimensiones
    const cards = document.querySelectorAll('#monitoreo .card');
    console.log(`🔍 Cards encontradas en #monitoreo: ${cards.length}`);
    cards.forEach((card, idx) => {
        card.style.minHeight = '500px';
        const body = card.querySelector('.card-body');
        if (body) {
            body.style.minHeight = '450px';
            body.style.height = '450px';
        }
        
        const rect = card.getBoundingClientRect();
        const bodyRect = body ? body.getBoundingClientRect() : null;
        console.log(`   Card ${idx} (DESPUÉS): width=${rect.width}, height=${rect.height}`);
        if (body) console.log(`   Card ${idx} body: width=${bodyRect.width}, height=${bodyRect.height}`);
    });
    
    // Primero, intentar cargar datos del cache
    if (window.cache) {
        const cachedData = window.cache.get('bitget_positions');
        console.log(`📦 Datos en cache:`, cachedData ? `${cachedData.length} posiciones` : 'NINGUNO');
        
        if (!cachedData || cachedData.length === 0) {
            console.warn('⚠️ No hay datos en cache. Intentando cargar desde API...');
            
            // Si no hay datos, intentar cargar desde la API
            if (window.BitgetAPI && window.BitgetAPI.credentials) {
                try {
                    const positions = await window.BitgetAPI.getAllOrders(100);
                    console.log(`✅ ${positions.length} posiciones cargadas desde API`);
                    
                    // Guardar en cache
                    window.cache.set('bitget_positions', positions);
                    console.log('💾 Posiciones guardadas en cache');
                } catch (error) {
                    console.error('❌ Error cargando desde API:', error.message);
                    // Sin conexión - no mostrar cartel, simplemente retornar false
                    // El usuario verá que no hay gráficas, lo que indica que no está conectado
                    return false;
                }
            } else {
                console.error('❌ No hay credenciales guardadas');
                // Sin conexión - no mostrar cartel
                return false;
            }
        }
    }
    
    // Ahora renderizar las gráficas
    if (window.BitgetCharts) {
        // IMPORTANTE: Asegurar que el pane está visible y tiene dimensiones
        const graficasPane = document.getElementById('monitoreo');
        if (graficasPane) {
            const currentDisplay = graficasPane.style.display;
            const wasHidden = currentDisplay === 'none' || window.getComputedStyle(graficasPane).display === 'none';
            
            if (wasHidden) {
                console.warn('⚠️ La pestaña Monitoreo estaba oculta, forzando visibilidad...');
                graficasPane.style.display = 'block';
            }
            
            // Forzar reflow del navegador para recalcular dimensiones
            const _ = graficasPane.offsetHeight;
            
            // Esperar un poco para que se complete el reflow
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const result = window.BitgetCharts.renderAllCharts();
        console.log(`📊 Resultado del renderizado: ${result ? 'ÉXITO' : 'FALLO'}`);
        return result;
    } else {
        console.error('❌ BitgetCharts no disponible');
        return false;
    }
}

/**
 * Mostrar mensaje en la pestaña de Monitoreo (en un contenedor centralizado, sin acumulación)
 */
function showMonitoreoMessage(message, type = 'info') {
    // Limpiar mensajes previos
    clearMonitoreoMessages();
    
    // Crear contenedor si no existe
    let container = document.getElementById('monitoreo-messages');
    if (!container) {
        const pane = document.getElementById('monitoreo');
        if (!pane) return;
        
        container = document.createElement('div');
        container.id = 'monitoreo-messages';
        container.style.position = 'sticky';
        container.style.top = '0';
        container.style.zIndex = '100';
        container.style.padding = '1rem';
        pane.insertBefore(container, pane.firstChild);
    }
    
    // Agregar el nuevo mensaje
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alertDiv);
}

/**
 * Limpiar todos los mensajes de Monitoreo
 */
function clearMonitoreoMessages() {
    const container = document.getElementById('monitoreo-messages');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Funciones de renderizado de gráficas
 */
async function renderEquityCurve(positions) {
    const canvasId = 'chart-equity-curve';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`📈 Renderizando Equity Curve con ${positions.length} posiciones...`);
    
    try {
        // Procesando datos de posiciones para la curva de capital
        const data = positions
            .sort((a, b) => (a.createTime || 0) - (b.createTime || 0))
            .map(pos => ({
                time: pos.createTime,
                equity: parseFloat(pos.totalFee || 0)
            }));
        
        if (!data.length) {
            console.warn('⚠️ No hay datos para Equity Curve');
            return;
        }
        
        // Crear contexto y dibujar gráfica simple
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Gráfica simple de línea
        ctx.strokeStyle = '#00dd00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const maxValue = Math.max(...data.map(d => d.equity));
        
        data.forEach((point, idx) => {
            const x = (idx / data.length) * width;
            const y = height - (point.equity / maxValue) * height;
            idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        console.log('✅ Equity Curve renderizada');
    } catch (error) {
        console.error(`❌ Error en Equity Curve:`, error);
    }
}

async function renderPnLBars(positions) {
    const canvasId = 'chart-pnl-bars';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`📊 Renderizando P&L Bars con ${positions.length} posiciones...`);
    
    try {
        // Calcular P&L por posición
        const data = positions
            .filter(p => p.totalFee !== undefined)
            .slice(0, 10) // Primeras 10 para claridad
            .map((pos, idx) => ({
                label: `Pos ${idx + 1}`,
                value: parseFloat(pos.totalFee || 0)
            }));
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        const barWidth = width / data.length * 0.8;
        const maxValue = Math.max(...data.map(d => d.value));
        const padding = 20;
        
        ctx.fillStyle = '#2196F3';
        data.forEach((bar, idx) => {
            const x = (idx + 0.1) * (width / data.length);
            const barHeight = (bar.value / maxValue) * (height - padding);
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
        });
        
        console.log('✅ P&L Bars renderizada');
    } catch (error) {
        console.error(`❌ Error en P&L Bars:`, error);
    }
}

async function renderLongVsShort(positions) {
    const canvasId = 'chart-long-vs-short';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`📈 Renderizando Long vs Short...`);
    
    try {
        const longs = positions.filter(p => p.posSide === 'LONG').length;
        const shorts = positions.filter(p => p.posSide === 'SHORT').length;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Gráfica de pastel simple
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 3;
        
        const total = longs + shorts;
        const longAngle = (longs / total) * Math.PI * 2;
        
        // Dibujar longs (verde)
        ctx.fillStyle = '#00dd00';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, longAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        // Dibujar shorts (rojo)
        ctx.fillStyle = '#dd0000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, longAngle, Math.PI * 2);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        
        console.log(`✅ Long vs Short: ${longs} longs, ${shorts} shorts`);
    } catch (error) {
        console.error(`❌ Error en Long vs Short:`, error);
    }
}

async function renderPnLDistribution(positions) {
    const canvasId = 'chart-pnl-distribution';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`📊 Renderizando P&L Distribution...`);
    
    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Histograma simple de distribución de P&L
        const fees = positions.map(p => parseFloat(p.totalFee || 0));
        const minFee = Math.min(...fees);
        const maxFee = Math.max(...fees);
        
        const buckets = 5;
        const histogram = Array(buckets).fill(0);
        const bucketSize = (maxFee - minFee) / buckets;
        
        fees.forEach(fee => {
            const bucket = Math.floor((fee - minFee) / bucketSize);
            if (bucket < buckets) histogram[bucket]++;
        });
        
        const maxCount = Math.max(...histogram);
        const barWidth = width / buckets * 0.8;
        
        ctx.fillStyle = '#FF9800';
        histogram.forEach((count, idx) => {
            const x = (idx) * (width / buckets) + width / buckets * 0.1;
            const barHeight = (count / maxCount) * (height - 20);
            const y = height - 20 - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
        });
        
        console.log('✅ P&L Distribution renderizada');
    } catch (error) {
        console.error(`❌ Error en P&L Distribution:`, error);
    }
}

async function renderDrawdown(positions) {
    const canvasId = 'chart-drawdown';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`📉 Renderizando Drawdown...`);
    
    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Calcular drawdown máximo
        const fees = positions.map(p => parseFloat(p.totalFee || 0)).sort((a, b) => a - b);
        let peak = fees[0];
        let maxDrawdown = 0;
        
        fees.forEach(fee => {
            if (fee > peak) peak = fee;
            const drawdown = peak - fee;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });
        
        // Dibujar línea de drawdown
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        fees.forEach((fee, idx) => {
            const x = (idx / fees.length) * width;
            const y = height - (fee / Math.max(...fees)) * height;
            idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        console.log(`✅ Drawdown renderizada (máximo: ${maxDrawdown.toFixed(2)})`);
    } catch (error) {
        console.error(`❌ Error en Drawdown:`, error);
    }
}

async function renderAccumulatedFees(positions) {
    const canvasId = 'chart-accumulated-fees';
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`⚠️ Canvas ${canvasId} no encontrado`);
        return;
    }
    
    console.log(`💰 Renderizando Accumulated Fees...`);
    
    try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Calcular fees acumuladas
        const fees = positions
            .sort((a, b) => (a.createTime || 0) - (b.createTime || 0))
            .map(p => parseFloat(p.totalFee || 0));
        
        let accumulated = 0;
        const accumulatedData = fees.map(fee => {
            accumulated += fee;
            return accumulated;
        });
        
        // Dibujar línea de fees acumuladas
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const maxAccum = Math.max(...accumulatedData);
        accumulatedData.forEach((value, idx) => {
            const x = (idx / accumulatedData.length) * width;
            const y = height - (value / maxAccum) * height;
            idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        
        ctx.stroke();
        console.log(`✅ Accumulated Fees renderizada (total: ${accumulated.toFixed(2)})`);
    } catch (error) {
        console.error(`❌ Error en Accumulated Fees:`, error);
    }
}

/**
 * Diagnóstico visual del DOM para debugging
 */
/**
 * Calcular timestamps para rangos de tiempo
 */
function getTimeRange(range) {
    const now = Date.now();
    let startTime;
    
    switch(range) {
        case '1w':
            startTime = now - (7 * 24 * 60 * 60 * 1000); // 7 días
            break;
        case '1m':
            startTime = now - (30 * 24 * 60 * 60 * 1000); // 30 días
            break;
        case '3m':
            startTime = now - (90 * 24 * 60 * 60 * 1000); // 90 días
            break;
        default:
            startTime = now - (30 * 24 * 60 * 60 * 1000); // Default 30 días
    }
    
    return {
        startTime: Math.floor(startTime),
        endTime: Math.floor(now)
    };
}

/**
 * Cargar gráficas con rango temporal específico
 */
async function loadChartsWithTimeRange(timeRange = '1m') {
    console.log(`📅 Cargando gráficas para: ${timeRange}`);
    
    const { startTime, endTime } = getTimeRange(timeRange);
    
    // Mostrar indicador de carga
    const loader = document.querySelector('.loader');
    if (loader) loader.style.display = 'block';
    
    try {
        // Cargar datos con el rango temporal
        const positions = await window.BitgetAPI.getAllOrders(100, startTime, endTime);
        
        if (positions && positions.length > 0) {
            console.log(`✅ ${positions.length} posiciones cargadas para ${timeRange}`);
            
            // Actualizar el gestor de gráficas
            window.BitgetCharts.positions = positions;
            
            // Guardar en cache
            if (window.cache) {
                window.cache.set('bitget_positions', positions);
            }
            
            // Re-renderizar todas las gráficas
            window.BitgetCharts.renderAllCharts();
        } else {
            console.warn(`⚠️ No hay posiciones para ${timeRange}`);
        }
    } catch (error) {
        console.error(`❌ Error cargando datos para ${timeRange}:`, error);
        alert(`Error al cargar datos: ${error.message}`);
    } finally {
        if (loader) loader.style.display = 'none';
    }
}

/**
 * Configurar event listeners para botones de temporalidad
 */
function setupTimeRangeButtons() {
    const buttons = document.querySelectorAll('.time-range-btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Actualizar botón activo
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Cargar gráficas con el rango seleccionado
            const timeRange = button.dataset.timerange;
            await loadChartsWithTimeRange(timeRange);
        });
    });
    
    console.log('✅ Event listeners de temporalidad configurados');
}

// Configurar botones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupTimeRangeButtons, 100);
});

window.DiagnosticoGraficas = {
    check() {
        console.log('🔍 ====== DIAGNÓSTICO DE GRÁFICAS ======');
        
    const graficasPane = document.getElementById('monitoreo');
    console.log('✅ Pane #monitoreo existe:', !!graficasPane);
        if (graficasPane) {
            console.log('   - className:', graficasPane.className);
            console.log('   - tiene clase active:', graficasPane.classList.contains('active'));
            console.log('   - display:', window.getComputedStyle(graficasPane).display);
            console.log('   - offsetHeight:', graficasPane.offsetHeight);
            console.log('   - offsetWidth:', graficasPane.offsetWidth);
            console.log('   - scrollHeight:', graficasPane.scrollHeight);
        }
        
    const containerFluid = document.querySelector('#monitoreo .container-fluid');
    console.log('✅ container-fluid existe:', !!containerFluid);
        if (containerFluid) {
            console.log('   - offsetHeight:', containerFluid.offsetHeight);
            console.log('   - offsetWidth:', containerFluid.offsetWidth);
        }
        
    const cards = document.querySelectorAll('#monitoreo .card');
    console.log('✅ Cards en #monitoreo:', cards.length);
        cards.forEach((card, i) => {
            const body = card.querySelector('.card-body');
            console.log(`   Card ${i}: height=${card.offsetHeight}, body-height=${body ? body.offsetHeight : 'N/A'}`);
        });
        
        const canvas = document.getElementById('chart-equity-curve');
        console.log('✅ Canvas #chart-equity-curve existe:', !!canvas);
        if (canvas) {
            console.log('   - width:', canvas.width);
            console.log('   - height:', canvas.height);
            console.log('   - offsetHeight:', canvas.offsetHeight);
            console.log('   - offsetWidth:', canvas.offsetWidth);
        }
        
        console.log('🔍 ====== FIN DIAGNÓSTICO ======');
    },
    
    forceActive() {
        console.log('🔨 Forzando clase active en #monitoreo...');
        const pane = document.getElementById('monitoreo');
        if (pane) {
            pane.classList.add('active');
            console.log('✅ Clase active agregada');
        } else {
            console.error('❌ No se encontró el pane #monitoreo');
        }
    }
};

console.log('💡 Usa window.DiagnosticoGraficas.check() para diagnosticar');

// Exportar función para que sea accesible desde main.js
window.renderBitgetCharts = renderBitgetCharts;


