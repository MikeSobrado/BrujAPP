/**
 * positions-buttons-handlers.js
 * Manejador de eventos para botones en la sección de Posiciones
 * Usa event delegation para capturar botones cargados dinámicamente
 */

console.log('🎯 positions-buttons-handlers.js cargándose...');

/**
 * Event delegation para botones de filtro de posiciones
 */
document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    
    if (!target) return;
    
    // Botón: Exportar PDF
    if (target.id === 'btn-export-pdf') {
        console.log('🎯 Click en botón Exportar PDF (delegación)');
        e.preventDefault();
        if (typeof exportReportToPDF === 'function') {
            exportReportToPDF().catch(err => {
                console.error('❌ Error exportando PDF:', err);
            });
        } else {
            console.error('❌ exportReportToPDF no está disponible');
        }
        return;
    }
    
    // Botones de filtro (data-filter="all|long|short")
    if (target.dataset.filter) {
        console.log('🎯 Click en filtro:', target.dataset.filter);
        const filterValue = target.dataset.filter;
        
        // Remover active de todos los botones de filtro
        document.querySelectorAll('button[data-filter]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Agregar active al botón clickeado
        target.classList.add('active');
        
        // Aplicar filtro
        if (typeof filterPositionsByType === 'function') {
            filterPositionsByType(filterValue);
        } else {
            console.warn('⚠️ filterPositionsByType no disponible');
        }
        return;
    }
});

/**
 * Event delegation para select de filtro por par
 */
document.addEventListener('change', (e) => {
    const target = e.target;
    
    if (!target) return;
    
    // Select: Filtro por par
    if (target.id === 'pair-filter') {
        const pairValue = target.value;
        console.log('🎯 Select cambió a:', pairValue);
        
        if (typeof filterPositionsByPair === 'function') {
            filterPositionsByPair(pairValue);
        } else {
            console.warn('⚠️ filterPositionsByPair no disponible');
        }
        return;
    }
});

/**
 * Filtrar posiciones por tipo (all, long, short)
 */
function filterPositionsByType(filterType) {
    console.log('[FILTER] Filtrando por tipo:', filterType);
    
    const table = document.querySelector('#positions-container table');
    if (!table) {
        console.warn('⚠️ No hay tabla de posiciones');
        return;
    }
    
    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Buscar la columna "Lado" (3era columna)
        const sideCell = row.cells[2];
        if (!sideCell) return;
        
        const sideText = sideCell.textContent.toLowerCase();
        let shouldShow = false;
        
        if (filterType === 'all') {
            shouldShow = true;
        } else if (filterType === 'long' && sideText.includes('long')) {
            shouldShow = true;
        } else if (filterType === 'short' && sideText.includes('short')) {
            shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log(`✅ Filtro aplicado: ${visibleCount}/${rows.length} filas visibles`);
}

/**
 * Filtrar posiciones por par
 */
function filterPositionsByPair(pairValue) {
    console.log('[FILTER] Filtrando por par:', pairValue);
    
    const table = document.querySelector('#positions-container table');
    if (!table) {
        console.warn('⚠️ No hay tabla de posiciones');
        return;
    }
    
    const rows = table.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        // Buscar la columna "Par" (2nda columna)
        const pairCell = row.cells[1];
        if (!pairCell) return;
        
        const pairText = pairCell.textContent.trim();
        let shouldShow = false;
        
        if (pairValue === 'all') {
            shouldShow = true;
        } else if (pairText === pairValue) {
            shouldShow = true;
        }
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    console.log(`✅ Filtro de par aplicado: ${visibleCount}/${rows.length} filas visibles`);
}

/**
 * Actualizar opciones de select cuando la tabla se actualiza
 */
function updatePairFilterOptions() {
    console.log('[PAIRS] Actualizando opciones de filtro por par...');
    
    const table = document.querySelector('#positions-container table');
    const pairSelect = document.getElementById('pair-filter');
    
    if (!table || !pairSelect) {
        console.warn('⚠️ No hay tabla o select');
        return;
    }
    
    // Obtener todos los pares únicos
    const pairs = new Set();
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const pairCell = row.cells[1];
        if (pairCell) {
            pairs.add(pairCell.textContent.trim());
        }
    });
    
    // Guardar opción seleccionada
    const currentValue = pairSelect.value;
    
    // Limpiar y repoblar select
    pairSelect.innerHTML = '<option value="all">Todos los pares</option>';
    
    // Ordenar pares alfabéticamente
    Array.from(pairs).sort().forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        option.textContent = pair;
        pairSelect.appendChild(option);
    });
    
    // Restaurar valor seleccionado si aún existe
    if (Array.from(pairSelect.options).some(opt => opt.value === currentValue)) {
        pairSelect.value = currentValue;
    }
    
    console.log(`✅ ${pairs.size} pares únicos encontrados`);
}

/**
 * MutationObserver para detectar cuando la tabla se actualiza
 */
const observerPositions = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Verificar si se agregó una tabla
            const addedNodes = Array.from(mutation.addedNodes);
            const hasTable = addedNodes.some(node => 
                node.nodeName === 'TABLE' || 
                (node.nodeType === Node.ELEMENT_NODE && node.querySelector('table'))
            );
            
            if (hasTable) {
                console.log('🔄 Tabla de posiciones detectada, actualizando filtros...');
                setTimeout(() => {
                    updatePairFilterOptions();
                }, 100);
            }
        }
    });
});

// Iniciar observador cuando el DOM esté listo
if (document.body) {
    observerPositions.observe(document.getElementById('positions-container') || document.body, {
        childList: true,
        subtree: true,
        characterData: false,
        attributes: false
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observerPositions.observe(document.getElementById('positions-container') || document.body, {
            childList: true,
            subtree: true,
            characterData: false,
            attributes: false
        });
    });
}

console.log('✅ positions-buttons-handlers.js cargado con event delegation');
