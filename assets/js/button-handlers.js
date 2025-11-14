/**
 * button-handlers.js
 * Manejador centralizado de eventos de botones usando event delegation
 * Se carga al final para capturar botones cargados dinámicamente
 */

console.log('🔘 button-handlers.js cargándose...');

// Event delegation en document para capturar clicks en botones sin importar cuándo se carguen
document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a[role="button"]');
    
    if (!target) return;
    
    const buttonId = target.id;
    const buttonText = target.textContent.toLowerCase();
    
    // Botón: Crear Llave
    if (buttonId === 'save-key-btn' || buttonText.includes('crear llave')) {
        console.log('🔘 Click en botón Crear Llave (delegación)');
        e.preventDefault();
        if (typeof window.handleSaveKey === 'function') {
            window.handleSaveKey();
        } else {
            console.error('❌ handleSaveKey no está disponible');
        }
    }
    
    // Botón: Cargar Llave
    if (buttonId === 'load-key-btn' || buttonText.includes('cargar llave')) {
        console.log('🔘 Click en botón Cargar Llave (delegación)');
        e.preventDefault();
        if (typeof window.handleLoadKey === 'function') {
            window.handleLoadKey();
        } else {
            console.error('❌ handleLoadKey no está disponible');
        }
    }
    
    // Botón: Conectar
    if (buttonId === 'connect-btn' || buttonText.includes('conectar')) {
        console.log('🔘 Click en botón Conectar (delegación)');
        e.preventDefault();
        // Este ya tiene su propio evento en bitget-api.js, pero por si acaso...
    }
});

// Monitorear cuando apicon.html se carga y verificar que los botones tengan eventos
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Si se agregó un botón de Crear o Cargar Llave
                    if (node.id === 'save-key-btn' || node.id === 'load-key-btn' || node.id === 'connect-btn') {
                        console.log('✅ Botón detectado en el DOM:', node.id);
                        
                        // Verificar que tenga el evento si viene de bitget-api.js
                        if (node.id === 'connect-btn') {
                            const hasClickListener = getEventListeners(node)?.click?.length > 0;
                            console.log('   - Connect btn tiene listener:', hasClickListener);
                        }
                    }
                }
            });
        }
    });
});

// Iniciar observador cuando el DOM esté listo
if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    });
}

console.log('✅ button-handlers.js cargado con event delegation');
