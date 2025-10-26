// --- FUNCIONES GLOBALES DE AJUSTES ---

// Declaramos las variables en el ámbito global.
let saveSettingsBtn, settingsSuccess;


// --- INICIALIZACIÓN DEL MÓDULO DE AJUSTES ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Ahora que el DOM está listo, podemos obtener los elementos de forma segura.
    saveSettingsBtn = document.getElementById('save-settings-btn');
    settingsSuccess = document.getElementById('settings-success');
    
    // --- NUEVO: Cargar las claves guardadas al iniciar la página ---
    const savedNewsApiKey = localStorage.getItem('newsapi-key');
    if (savedNewsApiKey) {
        document.getElementById('newsapi-key').value = savedNewsApiKey;
    }

    const savedCmcApiKey = localStorage.getItem('cmc-api-key'); // Cargar clave de CMC
    if (savedCmcApiKey) {
        document.getElementById('cmc-api-key').value = savedCmcApiKey;
    }
    // --- FIN DE LO NUEVO ---

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            // Guardar la clave de NewsAPI
            const newsApiKeyInput = document.getElementById('newsapi-key');
            const newsApiKey = newsApiKeyInput.value.trim();
            
            // --- NUEVO: Guardar la clave de CoinMarketCap ---
            const cmcApiKeyInput = document.getElementById('cmc-api-key');
            const cmcApiKey = cmcApiKeyInput.value.trim();
            // --- FIN DE LO NUEVO ---

            if (newsApiKey || cmcApiKey) { // Permitir guardar si al menos una clave está presente
                if (newsApiKey) {
                    localStorage.setItem('newsapi-key', newsApiKey);
                }
                if (cmcApiKey) {
                    localStorage.setItem('cmc-api-key', cmcApiKey);
                }
                
                // Mostrar mensaje de éxito
                settingsSuccess.style.display = 'block';
                setTimeout(() => {
                    settingsSuccess.style.display = 'none';
                }, 3000);
                
                // Si estamos en la pestaña de noticias, recargarlas
                if (document.getElementById('noticias-tab').classList.contains('active')) {
                    if (typeof loadNews === 'function') {
                        loadNews();
                    }
                }

                // --- NUEVO: Si estamos en la pestaña de mercado, recargar la gráfica de dominancia ---
                if (document.getElementById('mercado-tab').classList.contains('active')) {
                    if (typeof fetchAndUpdateBtcDominanceChart === 'function') {
                        fetchAndUpdateBtcDominanceChart();
                    }
                }
                // --- FIN DE LO NUEVO ---

            } else {
                alert('Por favor, introduce al menos una clave de API válida.');
            }
        });
    }
});