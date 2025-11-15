/**
 * pdf-export.js - Exportar reportes a PDF
 */

/**
 * Exportar reporte a PDF
 */
async function exportReportToPDF() {
    try {
        const pdfBtn = document.getElementById('btn-export-pdf');
        const now = new Date();
        
        console.log('📊 Iniciando exportación a PDF...');
        pdfBtn.disabled = true;
        pdfBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Generando...';
        
        // Obtener estadísticas del DOM
        const stats = extractExtendedStats() || extractStatsFromDOM();
        
    // Obtener tabla de posiciones del DOM
        const movementsTableHTML = extractMovementsTableHTML();
        
        // Crear contenedor temporal
        const pdfContainer = document.createElement('div');
        pdfContainer.style.backgroundColor = 'white';
        pdfContainer.style.padding = '0px';
        pdfContainer.style.width = '210mm';
        pdfContainer.id = 'pdf-export-container';
        
        // Construir HTML del PDF
        const pdfHTML = buildPDFHTML(stats, now, movementsTableHTML);
        pdfContainer.innerHTML = pdfHTML;
        
        // Agregar al documento
        document.body.appendChild(pdfContainer);
        
        // Generar PDF
        const opt = {
            margin: [5, 10, 10, 10],
            filename: `Trading-Report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.pdf`,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: [210, 2000], orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all'] }
        };
        
        await html2pdf().set(opt).from(pdfContainer).save();
        
        // Limpiar
        document.body.removeChild(pdfContainer);
        
        console.log('✅ PDF exportado exitosamente');
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = '<i class="bi bi-file-pdf me-1"></i>Exportar PDF';
        
    } catch (error) {
        console.error('❌ Error exportando PDF:', error);
        alert(`Error al exportar PDF: ${error.message}`);
        const pdfBtn = document.getElementById('btn-export-pdf');
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = '<i class="bi bi-file-pdf me-1"></i>Exportar PDF';
    }
}

/**
 * Extraer tabla de posiciones del DOM
 */
function extractMovementsTableHTML() {
    const container = document.getElementById('positions-container');
    
    if (!container) {
    console.warn('⚠️ No hay contenedor de posiciones');
    return '<p>No hay posiciones disponibles</p>';
    }
    
    // Buscar la tabla dentro del contenedor
    const table = container.querySelector('table');
    
    if (!table) {
    console.warn('⚠️ No hay tabla de posiciones');
    return '<p>No hay posiciones disponibles</p>';
    }
    
    // Extraer solo las filas (thead y tbody)
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    if (!tbody || tbody.querySelectorAll('tr').length === 0) {
        console.warn('⚠️ No hay filas en la tabla');
    return '<p>No hay posiciones disponibles</p>';
    }
    
    // Crear HTML de la tabla para el PDF
    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
            <thead style="background: #1a3a5f; color: white;">
    `;
    
    // Agregar encabezados
    if (thead) {
        const headerCells = thead.querySelectorAll('th');
        tableHTML += '<tr>';
        headerCells.forEach(cell => {
            tableHTML += `<td style="padding: 6px; font-weight: bold; border: 1px solid #ddd; text-align: left;">${cell.textContent}</td>`;
        });
        tableHTML += '</tr>';
    }
    
    tableHTML += '</thead><tbody>';
    
    // Agregar filas del cuerpo
    let rowCount = 0;
    tbody.querySelectorAll('tr').forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
            tableHTML += '<tr>';
            cells.forEach((cell, cellIndex) => {
                // Extraer solo el texto, sin HTML (para eliminar badges y estilos)
                let cellContent = cell.textContent.trim();
                
                // Determinar si es una celda con color (P&L)
                const isDataCell = cellIndex >= 6; // Últimas dos columnas (P&L)
                const bgColor = cell.classList.contains('text-success') ? '#d4edda' : 
                               cell.classList.contains('text-danger') ? '#f8d7da' : 'white';
                const textColor = cell.classList.contains('text-success') ? '#28a745' : 
                                 cell.classList.contains('text-danger') ? '#dc3545' : '#000';
                
                tableHTML += `<td style="padding: 4px 6px; border: 1px solid #e9ecef; background: ${bgColor}; color: ${textColor}; text-align: left;">${cellContent}</td>`;
            });
            tableHTML += '</tr>';
            rowCount++;
        }
    });
    
    tableHTML += '</tbody></table>';
    
    console.log(`✅ Tabla de posiciones extraída: ${rowCount} filas`);
    return tableHTML;
}

function extractStatsFromDOM() {
    // Intentar obtener de window.BitgetCharts (funciona siempre que haya datos cargados)
    if (window.BitgetCharts && typeof window.BitgetCharts.calculateStats === 'function') {
        const baseStats = window.BitgetCharts.calculateStats();
        
        // Calcular el promedio
        const average = baseStats.totalTrades > 0 
            ? (baseStats.totalPnL / baseStats.totalTrades)
            : 0;
        
        const stats = {
            totalTrades: baseStats.totalTrades,
            winRate: baseStats.winRate,
            totalPnL: baseStats.totalPnL,
            average: average
        };
        
        console.log('✅ Estadísticas extraídas de BitgetCharts:', stats);
        return stats;
    }
    
    console.warn('⚠️ No hay estadísticas disponibles');
    return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        average: 0
    };
}

/**
 * Extraer las 8 estadísticas rápidas del DOM
 */
function extractExtendedStats() {
    const container = document.getElementById('posiciones-stats-container');
    
    if (!container) {
        console.warn('⚠️ Contenedor de estadísticas no encontrado');
        return null;
    }
    
    // El HTML contiene tarjetas con <small> para label y <h5> para valor
    const cards = container.querySelectorAll('.card');
    
    if (cards.length === 0) {
        console.warn('⚠️ No hay tarjetas de estadísticas en el contenedor');
        return null;
    }
    
    // Extraer valores de cada tarjeta
    const stats = {
        totalPnL: 0,
        winRate: 0,
        avgPnL: 0,
        totalPositions: 0,
        longCount: 0,
        shortCount: 0,
        maxProfit: 0,
        maxLoss: 0
    };
    
    // Mapear las tarjetas al objeto stats
    cards.forEach((card) => {
        const label = card.querySelector('small')?.textContent?.trim().toLowerCase() || '';
        const valueElement = card.querySelector('h5');
        const valueText = valueElement?.textContent?.trim() || '0';
        
        // Extraer solo el número, quitando símbolos
        const numValue = parseFloat(valueText.replace(/[$,%()]/g, '').split('/')[0].split(' ')[0]) || 0;
        
        console.log(`[PDF] Extrayendo: "${label}" = "${valueText}" -> ${numValue}`);
        
        if (label.includes('p&l total')) stats.totalPnL = numValue;
        if (label.includes('win rate')) stats.winRate = numValue;
        if (label.includes('promedio')) stats.avgPnL = numValue;
        if (label.includes('total posiciones')) stats.totalPositions = parseInt(numValue);
        if (label === 'long') stats.longCount = parseInt(numValue);
        if (label === 'short') stats.shortCount = parseInt(numValue);
        if (label.includes('máx ganancia')) stats.maxProfit = numValue;
        if (label.includes('máx pérdida')) stats.maxLoss = numValue;
    });
    
    console.log('✅ Estadísticas extendidas extraídas:', stats);
    return stats;
}

/**
 * Construir HTML del PDF
 */
function buildPDFHTML(stats, now, movementsTableHTML) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; font-size: 11px; }
                
                .header {
                    text-align: center;
                    margin-bottom: 6px;
                    border-bottom: 2px solid #1a3a5f;
                    padding-bottom: 8px;
                }
                
                .header h1 {
                    color: #1a3a5f;
                    font-size: 18px;
                    margin-bottom: 3px;
                }
                
                .header p {
                    color: #666;
                    font-size: 10px;
                    margin: 1px 0;
                }
                
                .logo {
                    text-align: center;
                    margin-bottom: 4px;
                }
                
                .logo img {
                    max-width: 70px;
                    height: auto;
                }
                
                .section-title {
                    font-size: 11px;
                    font-weight: bold;
                    color: white;
                    background: linear-gradient(135deg, #1a3a5f, #2c5282);
                    padding: 8px;
                    margin: 12px 0 10px 0;
                    border-radius: 3px;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                
                .stat-box {
                    background: #f8f9fa;
                    padding: 12px;
                    border-left: 3px solid #2c5282;
                    border-radius: 3px;
                }
                
                .stat-label {
                    font-size: 8px;
                    color: #666;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    font-weight: 600;
                }
                
                .stat-value {
                    font-size: 16px;
                    font-weight: bold;
                    color: #1a3a5f;
                }
                
                .stat-positive {
                    color: #28a745;
                }
                
                .stat-negative {
                    color: #dc3545;
                }
                
                .footer {
                    text-align: center;
                    font-size: 8px;
                    color: #999;
                    margin-top: 12px;
                    padding-top: 8px;
                    border-top: 1px solid #e0e0e0;
                }
            </style>
        </head>
        <body>
            <!-- Header -->
            <div class="header">
                <div class="logo">
                    <img src="assets/images/namelogo.png" alt="Logo" style="max-height: 70px;">
                </div>
                <h1>Trading Analytics Report</h1>
                <p>Reporte de Monitoreo de Trading</p>
                <p style="margin-top: 6px; font-size: 11px;">
                    Generado: ${now.toLocaleString('es-ES')}
                </p>
            </div>
            
            <!-- Estadísticas -->
            <div class="section-title">📊 ESTADÍSTICAS</div>
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-label">Total de Operaciones</div>
                    <div class="stat-value">${stats.totalPositions || stats.totalTrades || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Win Rate</div>
                    <div class="stat-value ${(stats.winRate || 0) >= 50 ? 'stat-positive' : 'stat-negative'}">
                        ${stats.winRate || 0}%
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Total P&L</div>
                    <div class="stat-value ${(stats.totalPnL || 0) >= 0 ? 'stat-positive' : 'stat-negative'}">
                        $${(stats.totalPnL || 0)?.toFixed(2)}
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Promedio P&L</div>
                    <div class="stat-value ${(stats.avgPnL || stats.average || 0) >= 0 ? 'stat-positive' : 'stat-negative'}">
                        $${(stats.avgPnL || stats.average || 0)?.toFixed(2)}
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Long</div>
                    <div class="stat-value stat-positive">${stats.longCount || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Short</div>
                    <div class="stat-value stat-negative">${stats.shortCount || 0}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Máx Ganancia</div>
                    <div class="stat-value stat-positive">
                        $${(stats.maxProfit || 0)?.toFixed(2)}
                    </div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Máx Pérdida</div>
                    <div class="stat-value stat-negative">
                        $${(stats.maxLoss || 0)?.toFixed(2)}
                    </div>
                </div>
            </div>
            
            <!-- Posiciones -->
            <div class="section-title">📋 POSICIONES</div>
            ${movementsTableHTML}
            
            <!-- Disclaimer -->
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 8px; border-radius: 3px; margin-top: 12px; font-size: 8px; line-height: 1.3;">
                <div style="font-weight: bold; color: #856404; margin-bottom: 5px;">⚠️ DISCLAIMER</div>
                <div style="color: #856404;">
                    Este reporte ha sido generado automáticamente por Trading Dome Dashboard basándose en datos de la API de Bitget. Los resultados pasados no garantizan resultados futuros. El trading de futuros conlleva riesgos significativos. Consulta con un asesor financiero antes de tomar decisiones de inversión.
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p>Plataforma: Bitget Futures | Aplicación: Trading Dome Dashboard</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Inicializar evento del botón
 */
document.addEventListener('DOMContentLoaded', () => {
    const pdfBtn = document.getElementById('btn-export-pdf');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await exportReportToPDF();
        });
    }
});
