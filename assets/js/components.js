// components.js - Sistema de carga de componentes

/**
 * Carga un componente HTML desde un archivo externo
 */
async function loadComponent(componentPath, targetElementId) {
    // Mostrar loading inline solo si la carga toma más de 200ms
    let showLoading = false;
    let loadingTimeout = null;
    
    if (window.LoadingSystem) {
        loadingTimeout = setTimeout(() => {
            showLoading = true;
            window.LoadingSystem.showInlineLoading(targetElementId, {
                text: 'Cargando...',
                type: 'spinner',
                size: 'small'
            });
        }, 200);
    }

    try {
        // Usar configuración para logging
        if (window.AppConfig) {
            window.AppConfig.log(`Cargando componente: ${componentPath}`, 'debug');
        }

        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const html = await response.text();
        const targetElement = document.getElementById(targetElementId);
        
        if (!targetElement) {
            throw new Error(`Elemento no encontrado: ${targetElementId}`);
        }

        // Cancelar loading si no se mostró aún
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
        }

        // Ocultar loading si se mostró
        if (showLoading && window.LoadingSystem) {
            window.LoadingSystem.hideInlineLoading(targetElementId);
        }
        
        targetElement.innerHTML = html;
        
        // Log de éxito usando el sistema de configuración
        if (window.AppConfig) {
            window.AppConfig.log(`Componente cargado: ${componentPath}`, 'success');
        } else {
            console.log(`✅ Componente cargado: ${componentPath}`);
        }
        
        // Ejecutar scripts inline del componente cargado y esperar a que terminen
        await executeInlineScripts(targetElement);
        
    } catch (error) {
        // Cancelar loading en caso de error
        if (loadingTimeout) {
            clearTimeout(loadingTimeout);
        }

        // Ocultar loading si se mostró
        if (showLoading && window.LoadingSystem) {
            window.LoadingSystem.hideInlineLoading(targetElementId);
        }

        // Usar ErrorHandler si está disponible, sino fallback a console.error
        if (window.ErrorHandler) {
            const errorContent = ErrorHandler.handleComponentError(error, componentPath);
            const targetElement = document.getElementById(targetElementId);
            if (targetElement) {
                targetElement.innerHTML = errorContent;
            }
        } else {
            console.error(`❌ Error cargando componente ${componentPath}:`, error);
        }
    }
}

/**
 * Ejecuta scripts inline dentro de un elemento DOM sin usar eval() (CSP compliant)
 */
async function executeInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    
    // Procesar scripts secuencialmente para mantener el orden
    for (const script of scripts) {
        if (script.src) {
            // Script externo
            console.log(`🔄 Cargando script externo: ${script.src}`);
            await new Promise((resolve, reject) => {
                const newScript = document.createElement('script');
                newScript.src = script.src;
                newScript.async = false; // Ejecutar secuencialmente
                
                newScript.onload = () => {
                    console.log(`✅ Script externo cargado: ${script.src}`);
                    resolve();
                };
                newScript.onerror = (error) => {
                    if (window.ErrorHandler) {
                        ErrorHandler.logError(error, `Script externo: ${script.src}`);
                    } else {
                        console.error(`❌ Error cargando script: ${script.src}`, error);
                    }
                    reject(error);
                };
                
                document.head.appendChild(newScript);
            });
        } else if (script.innerHTML.trim()) {
            // Script inline - ejecutar de forma nativa (sin eval, sin setTimeout)
            console.log(`[SCRIPT-INLINE] Ejecutando script inline directamente en document.body...`);
            
            // Crear un nuevo elemento script y ejecutarlo inmediatamente
            const newScript = document.createElement('script');
            newScript.textContent = script.innerHTML;
            newScript.type = 'text/javascript';
            
            // Insertar en body para que se ejecute
            document.body.appendChild(newScript);
            console.log('✅ Script inline ejecutado (native, insertado en body)');
        }
    }
    
    console.log('✅ Todos los scripts completados');
}

/**
 * Carga una sección en un tab-pane específico usando configuración
 */
async function loadSection(sectionName, targetTabId) {
    let componentPath;
    
    if (window.AppConfig) {
        // Usar el sistema de configuración
        componentPath = window.AppConfig.getComponentPath(null, sectionName);
        if (!componentPath) {
            throw new Error(`Ruta no encontrada para la sección: ${sectionName}`);
        }
    } else {
        // Fallback al método anterior
        componentPath = `components/sections/${sectionName}.html`;
    }
    
    await loadComponent(componentPath, targetTabId);
}

/**
 * Inicializa todos los componentes de la aplicación
 */
async function initializeComponents() {
    // Log de inicio usando el sistema de configuración
    if (window.AppConfig) {
        window.AppConfig.log('Inicializando componentes...', 'info');
    } else {
        console.log('🔄 Inicializando componentes...');
    }
    
    try {
        // Cargar header y navegación usando configuración
        if (window.AppConfig) {
            const headerPath = window.AppConfig.getComponentPath('header');
            const navPath = window.AppConfig.getComponentPath('navigation');
            const headerContainer = window.AppConfig.getContainer('header');
            const navContainer = window.AppConfig.getContainer('navigation');
            
            // await loadComponent(headerPath, headerContainer); // Comentado: no cargar header
            await loadComponent(navPath, navContainer);
        } else {
            // Fallback al método anterior
            // await loadComponent('components/header.html', 'header-container'); // Comentado: no cargar header
            await loadComponent('components/navigation.html', 'navigation-container');
        }
        
        // NOTA: No cargar secciones dinámicamente - todas están ya en index.html:
        // - inicio: Incluido en index.html con pestañas internas
        // - gestion-riesgo: Incluido en pestaña de inicio (gestion-riesgo)
        // - graficas: Incluido en pestaña de inicio (graficas)
    // - posiciones: Incluido en pestaña del navegador principal
    // - monitoreo: Incluido en pestaña del navegador principal

        // Log de éxito
        if (window.AppConfig) {
            window.AppConfig.log('Todos los componentes cargados', 'success');
        } else {
            console.log('✅ Todos los componentes cargados');
        }
        
        // Inicializar funcionalidades después de cargar componentes
        initializeAfterComponents();
        
    } catch (error) {
        if (window.ErrorHandler) {
            ErrorHandler.logError(error, 'Inicialización de componentes');
        } else {
            console.error('❌ Error inicializando componentes:', error);
        }
    }
}

/**
 * Inicializa funcionalidades que dependen de los componentes cargados
 */
function initializeAfterComponents() {
    // Log usando el sistema de configuración
    if (window.AppConfig) {
        window.AppConfig.log('Inicializando funcionalidades...', 'info');
    } else {
        console.log('🔄 Inicializando funcionalidades...');
    }
    
    // Los widgets ahora usan iframe y se cargan automáticamente
    if (window.AppConfig) {
        window.AppConfig.log('Widgets se cargan automáticamente vía iframe', 'info');
    } else {
        console.log('ℹ️ Widgets se cargan automáticamente vía iframe');
    }
    
    // Inicializar el sistema de paneles
    if (typeof window.initializePanels === 'function') {
        window.initializePanels();
        if (window.AppConfig) {
            window.AppConfig.log('Sistema de paneles inicializado', 'success');
        } else {
            console.log('✅ Sistema de paneles inicializado');
        }
    } else {
        if (window.AppConfig) {
            window.AppConfig.log('initializePanels no disponible', 'warn');
        } else {
            console.warn('⚠️ initializePanels no disponible');
        }
    }
    
    // Disparar evento personalizado para que otros scripts sepan que pueden inicializarse
    document.dispatchEvent(new CustomEvent('componentsLoaded'));
    
    // Log final
    if (window.AppConfig) {
        window.AppConfig.log('Funcionalidades inicializadas', 'success');
    } else {
        console.log('✅ Funcionalidades inicializadas');
    }
}

// Cargar componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeComponents);