/**
 * Sistema de Configuración Centralizada
 * Gestiona todas las configuraciones de la aplicación desde un solo lugar
 */

class Config {
    constructor() {
        this.initializeConfig();
    }

    initializeConfig() {
        // Configuración de la aplicación
        this.app = {
            name: 'Mike Trading Dashboard',
            version: '2.0.0',
            buildDate: new Date().toISOString(),
            isDevelopment: window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1'
        };

        // Configuración de API
        this.api = {
            coinMarketCap: {
                baseUrl: '/api/global-metrics',
                timeout: 10000,
                retryAttempts: 3,
                retryDelay: 1000
            },
            tradingView: {
                baseUrl: 'https://s3.tradingview.com/external-embedding/',
                timeout: 15000
            }
        };

        // Configuración de componentes
        this.components = {
            paths: {
                header: 'components/header.html',
                navigation: 'components/navigation.html',
                sections: {
                    inicio: 'components/sections/inicio.html',
                    gestionRiesgo: 'components/sections/gestion-riesgo.html',
                    graficas: 'components/sections/graficas.html',
                    contacto: 'components/sections/contacto.html'
                }
            },
            containers: {
                header: 'header-container',
                navigation: 'navigation-container',
                inicio: 'inicio-content',
                gestionRiesgo: 'g-riesgo-content',
                graficas: 'graficas-content',
                contacto: 'contacto-content'
            }
        };

        // Configuración de widgets
        this.widgets = {
            tradingView: {
                calendar: {
                    scriptUrl: 'https://s3.tradingview.com/external-embedding/embed-widget-events.js',
                    colorTheme: 'light',
                    locale: 'es',
                    height: 400,
                    width: '100%',
                    importanceFilter: '-1,0,1'
                },
                symbolOverview: {
                    symbols: [
                        ['COINBASE:BTCUSD|1D'],
                        ['COINBASE:ETHUSD|1D'],
                        ['BINANCE:ADAUSDT|1D']
                    ],
                    chartOnly: false,
                    width: '100%',
                    height: 300,
                    locale: 'es',
                    colorTheme: 'light'
                }
            }
        };

        // Configuración de UI
        this.ui = {
            animations: {
                fadeInDuration: 300,
                slideInDuration: 400,
                pulseInterval: 2000
            },
            breakpoints: {
                mobile: 768,
                tablet: 992,
                desktop: 1200
            },
            colors: {
                primary: '#4361ee',
                success: '#2e7d32',
                danger: '#c62828',
                warning: '#f57c00',
                info: '#17a2b8'
            }
        };

        // Configuración de datos
        this.data = {
            updateIntervals: {
                marketData: 30000,      // 30 segundos
                priceData: 10000,       // 10 segundos
                newsData: 300000        // 5 minutos
            },
            cache: {
                maxAge: 300000,         // 5 minutos
                maxSize: 100,           // máximo 100 entradas
                compression: true
            }
        };

        // Configuración de logging
        this.logging = {
            level: 'info',
            maxLogSize: 1000,
            enableConsole: true,
            enableStorage: false
        };

        // Configuración de demos y desarrollo
        this.demos = {
            enabled: this.app.isDevelopment,
            autoInit: false,
            showLoadingDemo: false,
            showValidatorDemo: false,
            showCacheDemo: false,
            collapsedByDefault: true
        };

        // Mensajes del sistema
        this.messages = {
            loading: '⏳ Cargando...',
            error: '❌ Error al cargar el contenido',
            success: '✅ Cargado correctamente',
            noData: '📊 Sin datos disponibles'
        };
    }

    // Métodos para obtener configuraciones específicas
    getApiConfig(service) {
        return this.api[service] || null;
    }

    getWidgetConfig(widget, type = null) {
        const widgetConfig = this.widgets[widget];
        return type ? widgetConfig?.[type] : widgetConfig;
    }

    getComponentPath(component, section = null) {
        if (section) {
            return this.components.paths.sections[section] || null;
        }
        return this.components.paths[component] || null;
    }

    getContainer(component) {
        return this.components.containers[component] || null;
    }

    getUIConfig(section = null) {
        return section ? this.ui[section] : this.ui;
    }

    getDataConfig(section = null) {
        return section ? this.data[section] : this.data;
    }

    getDemoConfig(section = null) {
        return section ? this.demos[section] : this.demos;
    }

    // Método para obtener configuración por ruta de puntos
    getConfigByPath(path) {
        try {
            const keys = path.split('.');
            let current = this;
            
            for (const key of keys) {
                current = current[key];
                if (current === undefined) {
                    return null;
                }
            }
            
            return current;
        } catch (error) {
            console.error('Error getting config by path:', error);
            return null;
        }
    }

    // Métodos de utilidad
    getApiUrl(endpoint) {
        return this.api.coinMarketCap.baseUrl;
    }

    // Sistema de logging mejorado
    log(message, level = 'info') {
        if (!this.app.isDevelopment && level === 'debug') return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] ${this.app.name}:`;
        
        switch(level) {
            case 'error':
                console.error(prefix, message);
                break;
            case 'warn':
                console.warn(prefix, message);
                break;
            case 'success':
                console.log(`%c${prefix} ${message}`, 'color: green; font-weight: bold');
                break;
            case 'debug':
                console.log(`%c${prefix} ${message}`, 'color: gray; font-style: italic');
                break;
            default:
                console.log(prefix, message);
        }
    }

    // Validar configuración
    validateConfig() {
        const errors = [];

        if (!this.api.coinMarketCap.baseUrl) {
            errors.push('API CoinMarketCap baseUrl is required');
        }

        if (this.data.updateIntervals.marketData < 5000) {
            errors.push('Market data update interval too low (minimum 5 seconds)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Información del sistema
    getSystemInfo() {
        return {
            version: this.app.version,
            buildDate: this.app.buildDate,
            isDevelopment: this.app.isDevelopment,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
}

// Crear instancia global de configuración
window.AppConfig = new Config();

// Validar configuración al inicializar
const validation = window.AppConfig.validateConfig();
if (!validation.isValid) {
    console.error('Config validation errors:', validation.errors);
}

// Log de inicialización
if (window.AppConfig.app.isDevelopment) {
    console.log('Config System initialized:', window.AppConfig.getSystemInfo());
}