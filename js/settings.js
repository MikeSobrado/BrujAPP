// --- FUNCIONES GLOBALES DE AJUSTES ---

// --- INICIALIZACIÓN DEL MÓDULO DE AJUSTES ---
document.addEventListener('DOMContentLoaded', () => {
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsSuccess = document.getElementById('settings-success');
    const exportAllBtn = document.getElementById('export-all-btn');
    const resetAppBtn = document.getElementById('reset-app-btn');
    const themeSelector = document.getElementById('theme-selector');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-value');

    // --- FUNCIONALIDAD 1: TEMA ---
    // Cargar el tema guardado al iniciar
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    themeSelector.value = savedTheme;

    // Cambiar el tema al seleccionar uno nuevo
    themeSelector.addEventListener('change', (event) => {
        const newTheme = event.target.value;
        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        localStorage.setItem('theme', newTheme);
    });

    // --- FUNCIONALIDAD 2: TAMAÑO DE FUENTE ---
    // Cargar el tamaño de fuente guardado al iniciar
    const savedFontSize = localStorage.getItem('fontSize') || '100';
    document.body.style.fontSize = `${(16 * savedFontSize) / 100}px`; // Aplicar al body
    fontSizeSlider.value = savedFontSize;
    fontSizeValue.textContent = `${savedFontSize}%`;

    // Cambiar el tamaño de la fuente al mover el deslizador
    fontSizeSlider.addEventListener('input', (event) => {
        const newSize = event.target.value;
        fontSizeValue.textContent = `${newSize}%`;
        document.body.style.fontSize = `${(16 * newSize) / 100}px`; // Aplicar al body
        localStorage.setItem('fontSize', newSize);
    });

    // --- FUNCIONALIDAD 3: GUARDAR CONFIGURACIÓN RSS ---
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const rssUrlInput = document.getElementById('rss-feed-url');
            const rssUrl = rssUrlInput.value.trim();
            
            if (rssUrl) {
                localStorage.setItem('rss-feed-url', rssUrl);
                
                settingsSuccess.style.display = 'block';
                setTimeout(() => {
                    settingsSuccess.style.display = 'none';
                }, 3000);
                
                // Lógica para cambiar a la pestaña noticias y activar "Personalizado"
                const noticiasTabButton = document.querySelector('[data-tab-target="noticias-tab"]');
                if (noticiasTabButton) {
                    noticiasTabButton.click();
                }
                setTimeout(() => {
                    const customFilterButton = document.querySelector('[data-category="custom"]');
                    if (customFilterButton) {
                        customFilterButton.click();
                    }
                }, 100);
            } else {
                alert('Por favor, introduce una URL de feed RSS válida.');
            }
        });
    }

    // --- FUNCIONALIDAD 4: EXPORTAR TODOS LOS DATOS ---
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', () => {
            const allData = {
                profiles: JSON.parse(localStorage.getItem('strategyProfiles') || '{}'),
                journalData: JSON.parse(localStorage.getItem('journalData') || '[]'),
                settings: {
                    rssFeedUrl: localStorage.getItem('rss-feed-url'),
                    theme: localStorage.getItem('theme'),
                    fontSize: localStorage.getItem('fontSize'),
                    hasVisitedBefore: localStorage.getItem('hasVisitedBefore')
                }
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `brujapp_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        });
    }

    // --- FUNCIONALIDAD 5: RESTABLECER CONFIGURACIÓN ---
    if (resetAppBtn) {
        resetAppBtn.addEventListener('click', () => {
            const isConfirmed = confirm('¿Estás absolutamente seguro? Esta acción borrará todos tus perfiles, registro de operaciones y ajustes de forma permanente.');
            
            if (isConfirmed) {
                localStorage.clear();
                alert('La aplicación ha sido restablecida. La página se recargará ahora.');
                location.reload();
            }
        });
    }

    // Cargar la URL del feed guardada al iniciar la página
    const rssUrlInput = document.getElementById('rss-feed-url');
    if (rssUrlInput) {
        const savedUrl = localStorage.getItem('rss-feed-url');
        if (savedUrl) {
            rssUrlInput.value = savedUrl;
        }
    }
});
