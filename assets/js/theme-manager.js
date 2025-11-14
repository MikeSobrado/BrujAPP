/* =================================================
   THEME MANAGER - Crystal Sphere Trading Dashboard
   ================================================= */

class ThemeManager {
    constructor() {
        this.storageKey = 'crysapp-theme';
        this.darkModeClass = 'dark-mode';
        this.toggleIds = ['themeToggleMenu']; // Solo el toggle del menú ahora
        
        this.init();
    }

    init() {
        // Cargar tema guardado al iniciar
        this.loadSavedTheme();
        
        // Configurar el event listener para el toggle
        this.setupToggleListener();
        
        // Observar cambios en el DOM para manejar navegación SPA
        this.setupDOMObserver();
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Aplicar tema guardado o preferencia del sistema
        const shouldUseDarkMode = savedTheme === 'dark' || (savedTheme === null && prefersDark);
        
        if (shouldUseDarkMode) {
            this.enableDarkMode();
        } else {
            this.enableLightMode();
        }
        
        // Actualizar el estado del toggle si existe
        this.updateToggleState(shouldUseDarkMode);
    }

    enableDarkMode() {
        document.body.classList.add(this.darkModeClass);
        localStorage.setItem(this.storageKey, 'dark');
        this.dispatchThemeChangeEvent('dark');
    }

    enableLightMode() {
        document.body.classList.remove(this.darkModeClass);
        localStorage.setItem(this.storageKey, 'light');
        this.dispatchThemeChangeEvent('light');
    }

    toggleTheme() {
        const isDarkMode = document.body.classList.contains(this.darkModeClass);
        
        if (isDarkMode) {
            this.enableLightMode();
        } else {
            this.enableDarkMode();
        }
        
        return !isDarkMode;
    }

    getCurrentTheme() {
        return document.body.classList.contains(this.darkModeClass) ? 'dark' : 'light';
    }

    updateToggleState(isDarkMode) {
        // Actualizar todos los toggles de tema
        this.toggleIds.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                if (toggle.type === 'checkbox') {
                    // Para checkboxes (como el de contacto)
                    toggle.checked = isDarkMode;
                } else {
                    // Para botones (como el del menú)
                    this.updateThemeButton(toggle, isDarkMode);
                }
            }
        });
    }
    
    updateThemeButton(button, isDarkMode) {
        // Actualizar el texto del estado
        const statusElement = button.querySelector('.theme-status');
        if (statusElement) {
            statusElement.textContent = isDarkMode ? 'Modo nocturno' : 'Modo diurno';
        }
        
        // Actualizar el indicador toggle
        const indicator = button.querySelector('.theme-indicator i');
        if (indicator) {
            indicator.className = isDarkMode ? 'bi bi-toggle-on' : 'bi bi-toggle-off';
        }
        
        // Actualizar el icono principal
        const icon = button.querySelector('.theme-icon');
        if (icon) {
            icon.className = isDarkMode ? 'bi bi-moon-fill theme-icon' : 'bi bi-sun theme-icon';
        }
    }

    setupToggleListener() {
        // Usar delegación de eventos para manejar toggles dinámicos
        document.addEventListener('change', (event) => {
            if (this.toggleIds.includes(event.target.id)) {
                const newState = this.toggleTheme();
                console.log(`Tema cambiado a: ${newState ? 'dark' : 'light'}`);
            }
        });
        
        // Agregar listener para botones de tema
        document.addEventListener('click', (event) => {
            if (this.toggleIds.includes(event.target.id) || 
                (event.target.closest && event.target.closest('.theme-toggle-button'))) {
                event.preventDefault();
                const newState = this.toggleTheme();
                console.log(`Tema cambiado a: ${newState ? 'dark' : 'light'}`);
            }
        });
    }

    setupDOMObserver() {
        // Observar cambios en el DOM para nuevos toggles
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Buscar cualquiera de los toggles de tema
                        const hasThemeToggle = this.toggleIds.some(toggleId => {
                            const toggle = node.querySelector ? node.querySelector(`#${toggleId}`) : null;
                            return toggle || node.id === toggleId;
                        });
                        
                        if (hasThemeToggle) {
                            const currentTheme = this.getCurrentTheme();
                            this.updateToggleState(currentTheme === 'dark');
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(event);
    }

    // Método para detectar preferencia del sistema
    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        mediaQuery.addEventListener('change', (e) => {
            // Solo cambiar si no hay preferencia guardada
            const savedTheme = localStorage.getItem(this.storageKey);
            if (!savedTheme) {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.enableLightMode();
                }
                this.updateToggleState(e.matches);
            }
        });
    }

    // Método para resetear a preferencias del sistema
    resetToSystemTheme() {
        localStorage.removeItem(this.storageKey);
        this.loadSavedTheme();
    }

    // Método para aplicar tema específico
    setTheme(theme) {
        if (theme === 'dark') {
            this.enableDarkMode();
        } else if (theme === 'light') {
            this.enableLightMode();
        }
        this.updateToggleState(theme === 'dark');
    }
}

// ============================================
// INICIALIZACIÓN Y CONFIGURACIÓN GLOBAL
// ============================================

// Crear instancia global del manager de temas
let themeManager;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    
    // Habilitar seguimiento de preferencias del sistema
    themeManager.watchSystemTheme();
    
    console.log('Theme Manager inicializado');
});

// Exponer funciones globales para compatibilidad
window.BrujApp = window.BrujApp || {};
window.BrujApp.ThemeManager = {
    toggle: () => themeManager?.toggleTheme(),
    setTheme: (theme) => themeManager?.setTheme(theme),
    getCurrentTheme: () => themeManager?.getCurrentTheme(),
    resetToSystem: () => themeManager?.resetToSystemTheme()
};

// ============================================
// EVENT LISTENERS PARA COMPATIBILIDAD LEGACY
// ============================================

// Mantener compatibilidad con código existente
document.addEventListener('change', function(event) {
    if (event.target.id === 'themeToggle' && !themeManager) {
        // Fallback si el theme manager no está inicializado
        if (event.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('crysapp-theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('crysapp-theme', 'light');
        }
    }
});

// ============================================
// UTILIDADES ADICIONALES
// ============================================

// Función para aplicar tema a elementos específicos
function applyThemeToElement(element, theme) {
    if (theme === 'dark') {
        element.classList.add('dark-mode');
    } else {
        element.classList.remove('dark-mode');
    }
}

// Función para obtener configuración de tema
function getThemeConfig() {
    return {
        current: themeManager?.getCurrentTheme() || 'light',
        saved: localStorage.getItem('crysapp-theme'),
        system: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThemeManager, applyThemeToElement, getThemeConfig };
}