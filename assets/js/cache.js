/**
 * Sistema de Cache Profesional
 * Gestiona cache en memoria y localStorage con expiración automática y compresión
 */

class CacheSystem {
    constructor() {
        this.config = window.AppConfig || {};
        this.memoryCache = new Map();
        this.cacheConfig = this.getCacheConfig();
        this.initializeCache();
    }

    getCacheConfig() {
        const defaultConfig = {
            maxAge: 300000,         // 5 minutos por defecto
            maxSize: 100,           // máximo 100 entradas en memoria
            compression: false,     // compresión deshabilitada por defecto
            prefix: 'mike_trading_', // prefijo para localStorage
            enableMemory: true,     // cache en memoria habilitado
            enableStorage: false    // cache en localStorage DESHABILITADO (solo en sesión)
        };

        return this.config.getDataConfig ? 
            { ...defaultConfig, ...this.config.getDataConfig('cache') } : 
            defaultConfig;
    }

    initializeCache() {
        // Limpiar cache expirado al inicializar
        this.cleanExpiredCache();
        
        // Limpiar datos de cache almacenados en localStorage (ya no usamos enableStorage)
        this.cleanOldStorageData();
        
        // Configurar limpieza automática cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanExpiredCache();
        }, 300000);

        // Limpiar al cerrar la página
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Genera una clave única para el cache
     */
    generateKey(key, namespace = 'default') {
        return `${namespace}:${key}`;
    }

    /**
     * Obtiene el timestamp de expiración
     */
    getExpirationTimestamp(maxAge = null) {
        const age = maxAge || this.cacheConfig.maxAge;
        return Date.now() + age;
    }

    /**
     * Almacena datos en el cache
     */
    set(key, data, options = {}) {
        const {
            maxAge = this.cacheConfig.maxAge,
            namespace = 'default',
            forceStorage = false,
            tags = []
        } = options;

        const cacheKey = this.generateKey(key, namespace);
        const expiresAt = this.getExpirationTimestamp(maxAge);

        const cacheEntry = {
            data: data,
            expiresAt: expiresAt,
            createdAt: Date.now(),
            tags: tags,
            key: cacheKey
        };

        try {
            // Cache en memoria
            if (this.cacheConfig.enableMemory) {
                this.setMemoryCache(cacheKey, cacheEntry);
            }

            // Cache en localStorage
            if (this.cacheConfig.enableStorage || forceStorage) {
                this.setStorageCache(cacheKey, cacheEntry);
            }

            if (this.config.log) {
                this.config.log(`Cache set: ${cacheKey}`, 'debug');
            }

            return true;
        } catch (error) {
            console.error('Error setting cache:', error);
            return false;
        }
    }

    /**
     * Almacena en cache de memoria con límite de tamaño
     */
    setMemoryCache(key, entry) {
        // Si alcanzamos el límite, eliminar las entradas más antiguas
        if (this.memoryCache.size >= this.cacheConfig.maxSize) {
            const oldestKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(oldestKey);
        }

        this.memoryCache.set(key, entry);
    }

    /**
     * Almacena en localStorage
     */
    setStorageCache(key, entry) {
        try {
            const storageKey = this.cacheConfig.prefix + key;
            localStorage.setItem(storageKey, JSON.stringify(entry));
        } catch (error) {
            // Si localStorage está lleno, limpiar cache expirado e intentar de nuevo
            this.cleanExpiredStorageCache();
            try {
                const storageKey = this.cacheConfig.prefix + key;
                localStorage.setItem(storageKey, JSON.stringify(entry));
            } catch (retryError) {
                console.warn('No se pudo almacenar en localStorage:', retryError);
            }
        }
    }

    /**
     * Obtiene datos del cache
     */
    get(key, namespace = 'default') {
        const cacheKey = this.generateKey(key, namespace);

        try {
            // Intentar cache de memoria primero
            if (this.cacheConfig.enableMemory) {
                const memoryEntry = this.getMemoryCache(cacheKey);
                if (memoryEntry !== null) {
                    return memoryEntry;
                }
            }

            // Luego intentar localStorage
            if (this.cacheConfig.enableStorage) {
                const storageEntry = this.getStorageCache(cacheKey);
                if (storageEntry !== null) {
                    // Si encontramos en storage, también guardarlo en memoria para acceso rápido
                    if (this.cacheConfig.enableMemory) {
                        this.setMemoryCache(cacheKey, {
                            data: storageEntry,
                            expiresAt: Date.now() + this.cacheConfig.maxAge,
                            createdAt: Date.now()
                        });
                    }
                    return storageEntry;
                }
            }

            return null;
        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    }

    /**
     * Obtiene del cache de memoria
     */
    getMemoryCache(key) {
        const entry = this.memoryCache.get(key);
        
        if (!entry) {
            return null;
        }

        // Verificar expiración
        if (Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Obtiene del localStorage
     */
    getStorageCache(key) {
        try {
            const storageKey = this.cacheConfig.prefix + key;
            const stored = localStorage.getItem(storageKey);
            
            if (!stored) {
                return null;
            }

            const entry = JSON.parse(stored);

            // Verificar expiración
            if (Date.now() > entry.expiresAt) {
                localStorage.removeItem(storageKey);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    /**
     * Elimina una entrada específica del cache
     */
    delete(key, namespace = 'default') {
        const cacheKey = this.generateKey(key, namespace);

        // Eliminar de memoria
        this.memoryCache.delete(cacheKey);

        // Eliminar de localStorage
        const storageKey = this.cacheConfig.prefix + cacheKey;
        localStorage.removeItem(storageKey);

        if (this.config.log) {
            this.config.log(`Cache deleted: ${cacheKey}`, 'debug');
        }
    }

    /**
     * Elimina entradas por tags
     */
    deleteByTag(tag) {
        let deletedCount = 0;

        // Limpiar memoria
        for (const [key, entry] of this.memoryCache.entries()) {
            if (entry.tags && entry.tags.includes(tag)) {
                this.memoryCache.delete(key);
                deletedCount++;
            }
        }

        // Limpiar localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cacheConfig.prefix)) {
                try {
                    const entry = JSON.parse(localStorage.getItem(key));
                    if (entry.tags && entry.tags.includes(tag)) {
                        localStorage.removeItem(key);
                        deletedCount++;
                        i--; // Ajustar índice después de eliminación
                    }
                } catch (error) {
                    // Ignorar errores de parsing
                }
            }
        }

        if (this.config.log) {
            this.config.log(`Cache deleted by tag "${tag}": ${deletedCount} entries`, 'info');
        }

        return deletedCount;
    }

    /**
     * Limpia cache expirado
     */
    cleanExpiredCache() {
        this.cleanExpiredMemoryCache();
        this.cleanExpiredStorageCache();
    }

    /**
     * Limpia cache de memoria expirado
     */
    cleanExpiredMemoryCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            if (now > entry.expiresAt) {
                this.memoryCache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0 && this.config.log) {
            this.config.log(`Cleaned ${cleanedCount} expired memory cache entries`, 'debug');
        }
    }

    /**
     * Limpia cache de localStorage expirado
     */
    cleanExpiredStorageCache() {
        const now = Date.now();
        let cleanedCount = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cacheConfig.prefix)) {
                try {
                    const entry = JSON.parse(localStorage.getItem(key));
                    if (now > entry.expiresAt) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                        i--; // Ajustar índice después de eliminación
                    }
                } catch (error) {
                    // Eliminar entradas corruptas
                    localStorage.removeItem(key);
                    cleanedCount++;
                    i--;
                }
            }
        }

        if (cleanedCount > 0 && this.config.log) {
            this.config.log(`Cleaned ${cleanedCount} expired storage cache entries`, 'debug');
        }
    }

    /**
     * Limpia datos antiguos de cache almacenados en localStorage
     * Elimina todos los datos de cache EXCEPTO credenciales y configuración
     */
    cleanOldStorageData() {
        const keysToPreserve = [
            'bitget_credentials',     // Credenciales de Bitget
            'crysapp-theme',          // Tema del navegador
            'ENVIRONMENT_KEY',        // Clave de entorno
            'dominanceEnvironment'    // Entorno de dominance
        ];

        let cleanedCount = 0;

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith(this.cacheConfig.prefix)) {
                // Es una clave de cache del sistema, eliminarla
                localStorage.removeItem(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Limpiadas ${cleanedCount} entradas antiguas de localStorage cache`);
        }
    }

    /**
     * Wrapper para peticiones HTTP con cache automático
     */
    async fetchWithCache(url, options = {}) {
        const {
            cacheKey = url,
            maxAge = this.cacheConfig.maxAge,
            namespace = 'api',
            forceRefresh = false,
            tags = ['api']
        } = options;

        // Si no forzamos refresh, intentar obtener del cache
        if (!forceRefresh) {
            const cached = this.get(cacheKey, namespace);
            if (cached) {
                if (this.config.log) {
                    this.config.log(`Cache hit: ${cacheKey}`, 'debug');
                }
                return cached;
            }
        }

        try {
            // Realizar petición
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Almacenar en cache
            this.set(cacheKey, data, { maxAge, namespace, tags });

            if (this.config.log) {
                this.config.log(`Cache miss - fetched: ${cacheKey}`, 'debug');
            }

            return data;
        } catch (error) {
            console.error('Error in fetchWithCache:', error);
            throw error;
        }
    }

    /**
     * Invalida cache relacionado con APIs
     */
    invalidateApiCache() {
        return this.deleteByTag('api');
    }

    /**
     * Obtiene estadísticas del cache
     */
    getStats() {
        const memorySize = this.memoryCache.size;
        let storageSize = 0;
        let storageBytes = 0;

        // Contar entradas en localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cacheConfig.prefix)) {
                storageSize++;
                try {
                    storageBytes += localStorage.getItem(key).length;
                } catch (error) {
                    // Ignorar errores
                }
            }
        }

        return {
            memory: {
                entries: memorySize,
                maxSize: this.cacheConfig.maxSize,
                usage: Math.round((memorySize / this.cacheConfig.maxSize) * 100)
            },
            storage: {
                entries: storageSize,
                bytes: storageBytes,
                sizeFormatted: this.formatBytes(storageBytes)
            },
            config: this.cacheConfig
        };
    }

    /**
     * Formatea bytes para display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Limpia todo el cache
     */
    clear() {
        // Limpiar memoria
        this.memoryCache.clear();

        // Limpiar localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cacheConfig.prefix)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (this.config.log) {
            this.config.log(`Cache cleared: ${keysToRemove.length} storage entries`, 'info');
        }
    }

    /**
     * Cleanup al cerrar
     */
    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.cleanExpiredCache();
    }

    /**
     * Funciones específicas para trading
     */
    getTradingHelpers() {
        return {
            // Cache para datos de mercado
            setMarketData: (symbol, data, maxAge = 30000) => {
                return this.set(`market_${symbol}`, data, {
                    maxAge,
                    namespace: 'trading',
                    tags: ['market', 'trading']
                });
            },

            getMarketData: (symbol) => {
                return this.get(`market_${symbol}`, 'trading');
            },

            // Cache para configuración de paneles
            setPanelConfig: (panelId, config) => {
                return this.set(`panel_${panelId}`, config, {
                    maxAge: 86400000, // 24 horas
                    namespace: 'config',
                    tags: ['panel', 'config'],
                    forceStorage: true
                });
            },

            getPanelConfig: (panelId) => {
                return this.get(`panel_${panelId}`, 'config');
            },

            // Invalidar datos de trading
            invalidateTradingData: () => {
                return this.deleteByTag('trading');
            }
        };
    }
}

// Crear instancia global
window.CacheSystem = new CacheSystem();

// Atajos globales para facilidad de uso
window.cache = {
    set: (key, data, options) => window.CacheSystem.set(key, data, options),
    get: (key, namespace) => window.CacheSystem.get(key, namespace),
    delete: (key, namespace) => window.CacheSystem.delete(key, namespace),
    clear: () => window.CacheSystem.clear(),
    stats: () => window.CacheSystem.getStats(),
    fetchWithCache: (url, options) => window.CacheSystem.fetchWithCache(url, options)
};

// Helpers específicos para trading
window.tradingCache = window.CacheSystem.getTradingHelpers();

// Compatibilidad hacia atrás
window.CacheManager = {
    set: (key, value, ttl) => window.cache.set(key, value, { maxAge: ttl }),
    get: (key) => window.cache.get(key),
    delete: (key) => window.cache.delete(key),
    cleanup: () => window.CacheSystem.cleanExpiredCache(),
    clear: () => window.cache.clear(),
    getSize: () => window.cache.stats().memory.entries
};

// Log de inicialización
if (window.AppConfig && window.AppConfig.app.isDevelopment) {
    console.log('Cache System initialized:', window.CacheSystem.getStats());
}