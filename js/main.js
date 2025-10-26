// --- INICIALIZACIÓN PRINCIPAL DE LA APLICACIÓN ---
// Esperamos a que todo el contenido HTML de la página esté cargado.
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE LA VENTANA MODAL DE BIENVENIDA ---
    const welcomeModal = document.getElementById('welcome-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const hasVisitedKey = 'hasVisitedBefore';

    function showModal() {
        welcomeModal.classList.add('show');
    }

    function hideModal() {
        welcomeModal.classList.remove('show');
        localStorage.setItem(hasVisitedKey, 'true');
    }

    // Comprobar si es la primera visita para mostrar el modal
    if (!localStorage.getItem(hasVisitedKey)) {
        showModal();
    }

    // Asignar event listeners al modal
    closeModalBtn.addEventListener('click', hideModal);
    welcomeModal.addEventListener('click', (event) => {
        if (event.target === welcomeModal) {
            hideModal();
        }
    });

    // --- INICIALIZAR LOS MÓDULOS PRINCIPALES ---
    // Ahora que el DOM está listo, podemos inicializar las partes de la aplicación.
    // Estas funciones deben estar definidas como globales en sus respectivos archivos .js
    initializeProfiles();
    initializeJournal();
    calculateRisk();

});