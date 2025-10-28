document.addEventListener('DOMContentLoaded', () => {
    const journalTbody = document.getElementById('journal-tbody');
    const addTradeBtn = document.getElementById('add-trade-btn');
    const downloadCsvBtn = document.getElementById('download-csv-btn');
    const notesModal = document.getElementById('notes-modal');
    const notesModalTextarea = document.getElementById('notes-modal-textarea');
    const saveNotesBtn = document.getElementById('save-notes-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');

    let journalData = [];
    let currentEditingIndex = null;

    // --- FUNCIONES DE GESTIÓN DE DATOS ---

    /**
     * Carga los datos del registro desde localStorage.
     */
    function loadJournalData() {
        const savedData = localStorage.getItem('journalData');
        if (savedData) {
            journalData = JSON.parse(savedData);
        }
        renderJournal();
    }

    /**
     * Guarda los datos del registro en localStorage.
     */
    function saveJournalData() {
        localStorage.setItem('journalData', JSON.stringify(journalData));
    }

    // --- FUNCIONES DE RENDERIZADO Y ACTUALIZACIÓN ---

    /**
     * Recalcula el ROI y actualiza todos los datos de una operación específica en el array journalData.
     * Luego, guarda los cambios en localStorage.
     * @param {HTMLTableRowElement} row - La fila (<tr>) de la tabla que se va a actualizar.
     */
    /**
 * Recalcula el ROI y actualiza todos los datos de una operación específica en el array journalData.
 * Utiliza la lógica avanzada con apalancamiento y costes.
 * Luego, guarda los cambios en localStorage.
 * @param {HTMLTableRowElement} row - La fila (<tr>) de la tabla que se va a actualizar.
 */
function recalculateAndUpdateRow(row) {
    const rowIndex = Array.from(row.parentNode.children).indexOf(row);
    if (rowIndex === -1 || !journalData[rowIndex]) return;

    const trade = journalData[rowIndex];
    
    // 1. Actualizar datos básicos del trade desde la fila visible
    trade.date = row.querySelector('td:nth-child(1) input').value;
    trade.asset = row.querySelector('td:nth-child(2) input').value;
    trade.position = row.querySelector('td:nth-child(3) select').value;
    trade.amount = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
    trade.entry = parseFloat(row.querySelector('td:nth-child(5) input').value) || 0;
    trade.exit = parseFloat(row.querySelector('td:nth-child(6) input').value) || 0;

    // --- INICIO DEL CÁLCULO DE ROI AVANZADO ---

    // 2. Obtener parámetros de riesgo desde la pestaña "G. Riesgo"
    const apalancamiento = parseFloat(document.getElementById('apalancamiento')?.value) || 1;
    const comision = parseFloat(document.getElementById('comision')?.value) || 0;
    const financiacion = parseFloat(document.getElementById('financiacion')?.value) || 0;
    const spread = parseFloat(document.getElementById('spread')?.value) || 0;

    // 3. Calcular el Costo Inicial (Margen)
    const valorNocional = trade.amount * trade.entry;
    const costoInicial = valorNocional / apalancamiento;

    // 4. Calcular la Ganancia/Pérdida Bruta (P&L)
    let pnlBruto = 0;
    if (trade.position === 'long') {
        pnlBruto = (trade.exit - trade.entry) * trade.amount;
    } else { // short
        pnlBruto = (trade.entry - trade.exit) * trade.amount;
    }

    // 5. Calcular los Costes Totales de la Operación
    const comisionTotal = (valorNocional * (comision / 100)) * 2;
    const costesTotales = comisionTotal + financiacion + spread;

    // 6. Calcular la Ganancia/Pérdida Neta
    const gananciaNeta = pnlBruto - costesTotales;

    // 7. Calcular el ROI Final
    let roi = 0;
    if (costoInicial > 0) { // Evitar división por cero
        roi = (gananciaNeta / costoInicial) * 100;
    }
    
    // --- FIN DEL CÁLCULO ---

    // 8. Actualizar el objeto trade y la interfaz
    trade.roi = roi;
    const roiInput = row.querySelector('td:nth-child(7) input');
    roiInput.value = roi.toFixed(2);
    
    // Actualizar clases de color
    roiInput.classList.remove('positive', 'negative');
    if (roi > 0) {
        roiInput.classList.add('positive');
    } else if (roi < 0) {
        roiInput.classList.add('negative');
    }

    // 9. Guardar todos los cambios en localStorage
    saveJournalData();
}

    /**
     * Renderiza la tabla completa de operaciones y la hace interactiva.
     */
    function renderJournal() {
        journalTbody.innerHTML = '';
        
        journalData.forEach((trade, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Fecha"><input type="date" value="${trade.date}" readonly></td>
                <td data-label="Activo"><input type="text" value="${trade.asset}" readonly></td>
                <td data-label="Posición">
                    <select readonly>
                        <option value="long" ${trade.position === 'long' ? 'selected' : ''}>Long</option>
                        <option value="short" ${trade.position === 'short' ? 'selected' : ''}>Short</option>
                    </select>
                </td>
                <td data-label="Monto"><input type="number" value="${trade.amount}" readonly></td>
                <td data-label="Entrada"><input type="number" value="${trade.entry}" readonly></td>
                <td data-label="Salida"><input type="number" value="${trade.exit}" readonly></td>
                <td data-label="ROI (%)"><input type="number" class="roi-input ${trade.roi >= 0 ? 'positive' : 'negative'}" value="${trade.roi.toFixed(2)}" readonly></td>
                <td data-label="Notas">
                    <button class="notes-btn" data-index="${index}">📝</button>
                </td>
                <td data-label="Borrar"><button class="delete-btn" data-index="${index}">Eliminar</button></td>
            `;
            journalTbody.appendChild(row);
        });
        
        // Hacer todas las filas existentes editables y añadir listeners
        const allRows = journalTbody.querySelectorAll('tr');
        allRows.forEach((row, index) => {
            makeRowEditable(row, index);
        });
        
        // Añadir event listeners para los botones de notas y eliminar
        document.querySelectorAll('.notes-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const index = parseInt(event.target.getAttribute('data-index'));
                openNotesModal(index);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const index = parseInt(event.target.getAttribute('data-index'));
                deleteTrade(index);
            });
        });
    }

    /**
     * Convierte una fila de la tabla en editable y añade los listeners necesarios.
     * @param {HTMLTableRowElement} row - La fila (<tr>) a hacer editable.
     * @param {number} index - El índice de la operación en el array journalData.
     */
    function makeRowEditable(row, index) {
    // Quitar readonly a todos los inputs/selects de la fila
    const inputs = row.querySelectorAll('input, select');
    inputs.forEach(input => input.removeAttribute('readonly'));

    // --- ELIMINADO: El botón de calcular ya no es necesario ---
    // El cálculo es automático al cambiar los datos.

    // --- NUEVO: Añadir listeners para recálculo automático ---
    // Estos campos, al cambiar, disparan el recálculo del ROI
    const fieldsToWatch = [
        row.querySelector('td:nth-child(3) select'), // Posición
        row.querySelector('td:nth-child(4) input'),  // Monto
        row.querySelector('td:nth-child(5) input'),  // Entrada
        row.querySelector('td:nth-child(6) input')   // Salida
    ];

    fieldsToWatch.forEach(field => {
        if (field) {
            field.addEventListener('input', () => recalculateAndUpdateRow(row));
        }
    });
    
    // Estos campos se guardan al cambiar (usamos 'change' para no guardar cada letra)
    const otherFields = [
        row.querySelector('td:nth-child(1) input'), // Fecha
        row.querySelector('td:nth-child(2) input')  // Activo
    ];
    
    otherFields.forEach(field => {
        if(field) {
            field.addEventListener('change', () => recalculateAndUpdateRow(row));
        }
    });
}

    // --- FUNCIONES DE ACCIÓN (AÑADIR, ELIMINAR, MODALES) ---

    /**
     * Añade una nueva operación en blanco a la tabla.
     */
    function addNewTrade() {
        const newTrade = {
            date: new Date().toISOString().split('T')[0],
            asset: '',
            position: 'long',
            amount: 0,
            entry: 0,
            exit: 0,
            roi: 0,
            notes: ''
        };
        journalData.push(newTrade);
        saveJournalData();
        renderJournal();
    }

    /**
     * Elimina una operación del registro.
     * @param {number} index - El índice de la operación a eliminar.
     */
    function deleteTrade(index) {
        if (confirm('¿Estás seguro de que quieres eliminar esta operación?')) {
            journalData.splice(index, 1);
            saveJournalData();
            renderJournal();
        }
    }

    /**
     * Abre la ventana modal para editar las notas de una operación.
     * @param {number} index - El índice de la operación a editar.
     */
    function openNotesModal(index) {
        currentEditingIndex = index;
        notesModalTextarea.value = journalData[index].notes || '';
        notesModal.classList.add('show');
    }

    /**
     * Cierra la ventana modal de notas.
     */
    function closeNotesModal() {
        notesModal.classList.remove('show');
        currentEditingIndex = null;
    }

    /**
     * Guarda las notas de la modal en los datos de la operación.
     */
    function saveNotes() {
        if (currentEditingIndex !== null) {
            journalData[currentEditingIndex].notes = notesModalTextarea.value;
            saveJournalData();
            closeNotesModal();
        }
    }

    /**
     * Genera y descarga los datos del registro en formato CSV.
     */
    function downloadCSV() {
        const headers = ['Fecha', 'Activo', 'Posición', 'Monto', 'Entrada', 'Salida', 'ROI (%)', 'Notas'];
        const rows = journalData.map(trade => [
            trade.date,
            trade.asset,
            trade.position,
            trade.amount,
            trade.entry,
            trade.exit,
            trade.roi.toFixed(2),
            `"${trade.notes.replace(/"/g, '""')}"` // Escapar comillas en notas
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `brujapp_journal_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- EVENT LISTENERS PRINCIPALES ---

    addTradeBtn.addEventListener('click', addNewTrade);
    downloadCsvBtn.addEventListener('click', downloadCSV);
    saveNotesBtn.addEventListener('click', saveNotes);
    closeModalBtn.addEventListener('click', closeNotesModal);

    // Cerrar modal si se hace clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === notesModal) {
            closeNotesModal();
        }
    });

    // Inicializar la aplicación cargando los datos
    loadJournalData();
});
