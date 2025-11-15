// bitget-positions.js - Orquestación y Renderizado de Posiciones
// ================================================================
// Responsabilidades:
// 1. Renderizar tabla de posiciones cerradas
// 2. Renderizar estadísticas rápidas
// 3. Sincronizar componentes dinámicos (historial + estadísticas)
// 4. Manejar reintentos y errores de carga
// 5. Coordinar entre bitget-api.js y componentes HTML

console.log('📍 bitget-positions.js cargándose...');

// ==========================================
// RENDERIZADO DE TABLA DE POSICIONES
// ==========================================

window.renderPositionsTable = function(positions, container) {
    if (!positions || positions.length === 0) {
        container.innerHTML = '<div class="alert alert-info"><i class="bi bi-info-circle me-2"></i><strong>Sin historial</strong><br><small>No hay posiciones cerradas en tu historial</small></div>';
        return;
    }
    
    console.log('[TABLE] ✅ Mostrando', positions.length, 'posiciones en la tabla');
    let html = '<div class="table-responsive"><table class="table table-hover table-sm"><thead class="table-light"><tr><th>Fecha</th><th>Par</th><th>Lado</th><th>Entrada</th><th>Salida</th><th>Cantidad</th><th>P&L</th><th>%</th></tr></thead><tbody>';
    
    positions.forEach((pos) => {
        try {
            const ts = parseInt(pos.ctime || pos.cTime || pos.timestamp || 0);
            const date = ts > 0 ? new Date(ts).toLocaleString('es-ES') : 'N/A';
            const symbol = pos.symbol || 'N/A';
            const side = (pos.holdSide || pos.side || '').toLowerCase() === 'long' ? '<span class="badge bg-success">LONG</span>' : '<span class="badge bg-danger">SHORT</span>';
            const openPrice = parseFloat(pos.openAvgPrice || 0).toFixed(4);
            const closePrice = parseFloat(pos.closeAvgPrice || 0).toFixed(4);
            const qty = parseFloat(pos.openTotalPos || 0).toFixed(8);
            const pnl = parseFloat(pos.netProfit || pos.unrealizedPL || 0).toFixed(2);
            const invAmount = parseFloat(openPrice) * parseFloat(qty);
            const pnlPercent = invAmount > 0 ? ((parseFloat(pnl) / invAmount) * 100).toFixed(2) : '0.00';
            const pnlClass = parseFloat(pnl) >= 0 ? 'text-success' : 'text-danger';
            html += `<tr><td><small>${date}</small></td><td><strong>${symbol}</strong></td><td>${side}</td><td><small>${openPrice}</small></td><td><small>${closePrice}</small></td><td><small>${qty}</small></td><td class="${pnlClass}"><strong>${pnl}</strong></td><td class="${pnlClass}"><strong>${pnlPercent}%</strong></td></tr>`;
        } catch (e) { 
            console.warn('[TABLE] ⚠️ Error renderizando posición:', e); 
        }
    });
    
    html += '</tbody></table><div class="alert alert-success mt-3"><i class="bi bi-check-circle me-2"></i><strong>✅ Datos cargados</strong><br><small>Total: <strong>' + positions.length + '</strong> posiciones | Fecha: <strong>' + new Date().toLocaleString('es-ES') + '</strong></small></div></div>';
    
    console.log('[TABLE] 📝 HTML generado, tamaño:', html.length, 'caracteres');
    container.innerHTML = html;
    console.log('[TABLE] ✅ HTML insertado en contenedor');
    
    // Trigger para gráficas si existen
    if (window.BitgetCharts && window.BitgetCharts.renderMovementsStats) {
        window.BitgetCharts.renderMovementsStats();
    }
};

// ==========================================
// RENDERIZADO DE ESTADÍSTICAS RÁPIDAS
// ==========================================

window.renderPositionsStats = function(positions) {
    const container = document.getElementById('posiciones-stats-container');
    if (!container) {
        console.warn('[STATS] ⚠️ Contenedor posiciones-stats-container no encontrado');
        return;
    }
    
    if (!positions || positions.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Carga las posiciones para ver las estadísticas</p>';
        return;
    }
    
    console.log('[STATS] 📊 Calculando estadísticas de', positions.length, 'posiciones...');
    
    // Calcular estadísticas
    let totalPnL = 0;
    let winPositions = 0;
    let lossPositions = 0;
    let longCount = 0;
    let shortCount = 0;
    let totalVolume = 0;
    let maxProfit = -Infinity;
    let maxLoss = Infinity;
    
    positions.forEach((pos) => {
        try {
            const pnl = parseFloat(pos.netProfit || pos.unrealizedPL || 0);
            const qty = parseFloat(pos.openTotalPos || 0);
            const openPrice = parseFloat(pos.openAvgPrice || 0);
            const side = (pos.holdSide || pos.side || '').toLowerCase();
            
            totalPnL += pnl;
            totalVolume += (qty * openPrice);
            
            if (pnl > 0) {
                winPositions++;
                if (pnl > maxProfit) maxProfit = pnl;
            } else if (pnl < 0) {
                lossPositions++;
                if (pnl < maxLoss) maxLoss = pnl;
            }
            
            if (side === 'long') longCount++;
            else if (side === 'short') shortCount++;
        } catch (e) {
            console.warn('[STATS] ⚠️ Error calculando estadísticas:', e);
        }
    });
    
    const winRate = positions.length > 0 ? ((winPositions / positions.length) * 100).toFixed(1) : 0;
    const avgPnL = positions.length > 0 ? (totalPnL / positions.length).toFixed(2) : 0;
    const pnlClass = parseFloat(totalPnL) >= 0 ? 'success' : 'danger';
    
    // Construcción del HTML con grid de estadísticas
    let html = `
    <div class="row">
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">P&L Total</small>
                    <h5 class="mb-0 text-${pnlClass}"><strong>${parseFloat(totalPnL).toFixed(2)}</strong></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Win Rate</small>
                    <h5 class="mb-0"><strong>${winRate}%</strong> <small>(${winPositions}/${positions.length})</small></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Promedio P&L</small>
                    <h5 class="mb-0"><strong>${parseFloat(avgPnL).toFixed(2)}</strong></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Total Posiciones</small>
                    <h5 class="mb-0"><strong>${positions.length}</strong></h5>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Long</small>
                    <h5 class="mb-0 text-success"><strong>${longCount}</strong></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Short</small>
                    <h5 class="mb-0 text-danger"><strong>${shortCount}</strong></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Máx Ganancia</small>
                    <h5 class="mb-0 text-success"><strong>${maxProfit === -Infinity ? 'N/A' : parseFloat(maxProfit).toFixed(2)}</strong></h5>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-3">
            <div class="card border-0 bg-light">
                <div class="card-body p-3">
                    <small class="text-muted">Máx Pérdida</small>
                    <h5 class="mb-0 text-danger"><strong>${maxLoss === Infinity ? 'N/A' : parseFloat(maxLoss).toFixed(2)}</strong></h5>
                </div>
            </div>
        </div>
    </div>
    `;
    
    container.innerHTML = html;
    console.log('[STATS] ✅ Estadísticas renderizadas');
};

// ==========================================
// SINCRONIZACIÓN CON COMPONENTES
// ==========================================

// Funciones que son llamadas por los componentes HTML cuando se cargan dinámicamente
window.loadAndDisplayPositions = function() {
    console.log('[SYNC] Sincronización de tabla de posiciones iniciada');
    
    let positions = null;
    
    // Buscar datos de múltiples fuentes
    if (window.currentPositions && window.currentPositions.length > 0) {
        positions = window.currentPositions;
        console.log('[SYNC] ✅ Datos de window.currentPositions:', positions.length);
    } else if (typeof window.cache !== 'undefined') {
        positions = window.cache.get('bitget_positions');
        if (positions && positions.length > 0) {
            console.log('[SYNC] ✅ Datos del cache:', positions.length);
        }
    }
    
    if (positions && positions.length > 0) {
        const container = document.getElementById('positions-container');
        if (container && typeof window.renderPositionsTable === 'function') {
            console.log('[SYNC] 🔄 Renderizando tabla en componente...');
            window.renderPositionsTable(positions, container);
        }
    } else {
        console.log('[SYNC] ℹ️ Sin datos para renderizar tabla');
    }
};

window.loadAndDisplayStats = function() {
    console.log('[SYNC] Sincronización de estadísticas iniciada');
    
    let positions = null;
    
    // Buscar datos de múltiples fuentes
    if (window.currentPositions && window.currentPositions.length > 0) {
        positions = window.currentPositions;
        console.log('[SYNC] ✅ Datos de window.currentPositions:', positions.length);
    } else if (typeof window.cache !== 'undefined') {
        positions = window.cache.get('bitget_positions');
        if (positions && positions.length > 0) {
            console.log('[SYNC] ✅ Datos del cache:', positions.length);
        }
    }
    
    if (positions && positions.length > 0) {
        if (typeof window.renderPositionsStats === 'function') {
            console.log('[SYNC] 🔄 Renderizando estadísticas en componente...');
            window.renderPositionsStats(positions);
        }
    } else {
        console.log('[SYNC] ℹ️ Sin datos para renderizar estadísticas');
    }
};

// ==========================================
// ORQUESTADOR CENTRALIZADO
// ==========================================

window.positionsManager = {
    // Sincronizar todo cuando se carga o actualiza
    syncAll: function(positions) {
        console.log('[MANAGER] 🔄 Sincronización total iniciada con', positions?.length || 0, 'posiciones');
        
        if (!positions || positions.length === 0) {
            console.log('[MANAGER] ℹ️ Sin posiciones para sincronizar');
            return;
        }
        
        // Guardar en memoria global
        window.currentPositions = positions;
        
        this.syncPositions();
        this.syncStats();
        
        console.log('[MANAGER] ✅ Sincronización completada');
    },
    
    // Sincronizar tabla de posiciones
    syncPositions: function() {
        console.log('[MANAGER] 🔄 syncPositions iniciado');
        
        let positions = null;
        
        // 1. Desde window.currentPositions (datos más recientes)
        if (window.currentPositions && window.currentPositions.length > 0) {
            positions = window.currentPositions;
            console.log('[MANAGER] ✅ Datos de window.currentPositions:', positions.length);
        } else if (typeof window.cache !== 'undefined') {
            positions = window.cache.get('bitget_positions');
            if (positions && positions.length > 0) {
                console.log('[MANAGER] ✅ Datos del cache:', positions.length);
            }
        }
        
        if (positions && positions.length > 0) {
            const container = document.getElementById('positions-container');
            if (container && typeof window.renderPositionsTable === 'function') {
                console.log('[MANAGER] 🎨 Renderizando tabla de posiciones...');
                window.renderPositionsTable(positions, container);
            } else {
                console.log('[MANAGER] ⏳ Contenedor o función de renderizado no disponible');
            }
        } else {
            console.log('[MANAGER] ℹ️ Sin datos para renderizar tabla');
        }
    },
    
    // Sincronizar estadísticas
    syncStats: function() {
        console.log('[MANAGER] 🔄 syncStats iniciado');
        
        let positions = null;
        
        // 1. Desde window.currentPositions (datos más recientes)
        if (window.currentPositions && window.currentPositions.length > 0) {
            positions = window.currentPositions;
            console.log('[MANAGER] ✅ Datos de window.currentPositions:', positions.length);
        } else if (typeof window.cache !== 'undefined') {
            positions = window.cache.get('bitget_positions');
            if (positions && positions.length > 0) {
                console.log('[MANAGER] ✅ Datos del cache:', positions.length);
            }
        }
        
        if (positions && positions.length > 0) {
            if (typeof window.renderPositionsStats === 'function') {
                console.log('[MANAGER] 📊 Renderizando estadísticas...');
                window.renderPositionsStats(positions);
            } else {
                console.log('[MANAGER] ⏳ Función de renderizado de estadísticas no disponible');
            }
        } else {
            console.log('[MANAGER] ℹ️ Sin datos para renderizar estadísticas');
        }
    },
    
    // Limpiar todo
    clearAll: function() {
        console.log('[MANAGER] 🧹 Limpiando datos...');
        
        window.currentPositions = [];
        
        const tableContainer = document.getElementById('positions-container');
        if (tableContainer) {
            tableContainer.innerHTML = '<p class="text-muted text-center">Conecta a la API en la pestaña de "APIs" para cargar tu historial de posiciones</p>';
        }
        
        const statsContainer = document.getElementById('posiciones-stats-container');
        if (statsContainer) {
            statsContainer.innerHTML = '<p class="text-muted text-center">Carga las posiciones para ver las estadísticas</p>';
        }
        
        console.log('[MANAGER] ✅ Datos limpiados');
    }
};

console.log('✅ bitget-positions.js cargado correctamente');
