/**
 * Sistema de Loading Profesional
 * Gestiona spinners, indicadores de progreso y estados de carga
 */

class LoadingSystem {
    constructor() {
        this.activeLoaders = new Map();
        this.globalLoadingCount = 0;
        this.initializeStyles();
        this.config = window.AppConfig || {};
    }

    /**
     * Inicializa los estilos CSS para los componentes de loading
     */
    initializeStyles() {
        const styleId = 'loading-system-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .loading-overlay.show {
                opacity: 1;
            }

            .loading-spinner {
                display: inline-block;
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: #007bff;
                animation: spin 1s ease-in-out infinite;
            }

            .loading-spinner.large {
                width: 60px;
                height: 60px;
                border-width: 6px;
            }

            .loading-spinner.small {
                width: 20px;
                height: 20px;
                border-width: 2px;
            }

            .loading-content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 300px;
            }

            .loading-text {
                margin-top: 15px;
                color: #333;
                font-size: 16px;
                font-weight: 500;
            }

            .loading-progress {
                width: 100%;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
                margin-top: 15px;
            }

            .loading-progress-bar {
                height: 100%;
                background: linear-gradient(45deg, #007bff, #0056b3);
                border-radius: 4px;
                transition: width 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .loading-progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                background-image: linear-gradient(
                    -45deg,
                    rgba(255, 255, 255, 0.2) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.2) 75%,
                    transparent 75%,
                    transparent
                );
                background-size: 30px 30px;
                animation: move 2s linear infinite;
            }

            .btn-loading {
                position: relative;
                pointer-events: none;
                opacity: 0.7;
            }

            .btn-loading .btn-text {
                opacity: 0;
            }

            .btn-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @keyframes move {
                0% { background-position: 0 0; }
                100% { background-position: 30px 30px; }
            }

            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            .skeleton-text {
                height: 1em;
                border-radius: 4px;
                margin-bottom: 8px;
            }

            .skeleton-title {
                height: 1.5em;
                border-radius: 4px;
                margin-bottom: 12px;
                width: 70%;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Muestra un overlay de loading global
     */
    showGlobalLoading(options = {}) {
        const {
            text = this.config.messages?.loading || '⏳ Cargando...',
            showProgress = false,
            progress = 0,
            id = 'global-loading'
        } = options;

        this.hideGlobalLoading(id);

        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = id;

        const content = document.createElement('div');
        content.className = 'loading-content';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner large';

        const textElement = document.createElement('div');
        textElement.className = 'loading-text';
        textElement.textContent = text;

        content.appendChild(spinner);
        content.appendChild(textElement);

        if (showProgress) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'loading-progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'loading-progress-bar';
            progressBar.style.width = `${progress}%`;
            progressBar.id = `${id}-progress`;
            
            progressContainer.appendChild(progressBar);
            content.appendChild(progressContainer);
        }

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        this.activeLoaders.set(id, overlay);
        this.globalLoadingCount++;

        if (this.config.log) {
            this.config.log(`Loading mostrado: ${id}`, 'debug');
        }

        return id;
    }

    /**
     * Oculta el overlay de loading global
     */
    hideGlobalLoading(id = 'global-loading') {
        const overlay = this.activeLoaders.get(id);
        if (!overlay) return;

        overlay.classList.remove('show');
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            this.activeLoaders.delete(id);
            this.globalLoadingCount = Math.max(0, this.globalLoadingCount - 1);
        }, 300);

        if (this.config.log) {
            this.config.log(`Loading ocultado: ${id}`, 'debug');
        }
    }

    /**
     * Actualiza el progreso de un loading
     */
    updateProgress(id, progress, text = null) {
        const progressBar = document.getElementById(`${id}-progress`);
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        if (text) {
            const overlay = this.activeLoaders.get(id);
            if (overlay) {
                const textElement = overlay.querySelector('.loading-text');
                if (textElement) {
                    textElement.textContent = text;
                }
            }
        }
    }

    /**
     * Muestra un spinner inline en un elemento específico
     */
    showInlineLoading(elementId, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const {
            size = 'medium',
            text = 'Cargando...',
            type = 'spinner'
        } = options;

        element.dataset.originalContent = element.innerHTML;
        element.dataset.isLoading = 'true';

        let loadingHTML = '';

        if (type === 'spinner') {
            loadingHTML = `
                <div class="d-flex align-items-center justify-content-center p-3">
                    <div class="loading-spinner ${size}"></div>
                    <span class="ms-2">${text}</span>
                </div>
            `;
        } else if (type === 'skeleton') {
            loadingHTML = `
                <div class="p-3">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                </div>
            `;
        }

        element.innerHTML = loadingHTML;
    }

    /**
     * Oculta el loading inline y restaura el contenido
     */
    hideInlineLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element || element.dataset.isLoading !== 'true') return;

        const originalContent = element.dataset.originalContent;
        if (originalContent) {
            element.innerHTML = originalContent;
        }

        delete element.dataset.originalContent;
        delete element.dataset.isLoading;
    }

    /**
     * Convierte un botón en estado de loading
     */
    showButtonLoading(buttonId, loadingText = 'Cargando...') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;

        button.classList.add('btn-loading');
        button.disabled = true;
        button.innerHTML = `<span class="btn-text">${loadingText}</span>`;
    }

    /**
     * Restaura el botón del estado de loading
     */
    hideButtonLoading(buttonId) {
        const button = document.getElementById(buttonId);
        if (!button || !button.classList.contains('btn-loading')) return;

        button.classList.remove('btn-loading');
        button.innerHTML = button.dataset.originalText || button.innerHTML;
        button.disabled = button.dataset.originalDisabled === 'true';

        delete button.dataset.originalText;
        delete button.dataset.originalDisabled;
    }

    /**
     * Obtiene el estado actual de loading
     */
    getLoadingState() {
        return {
            globalCount: this.globalLoadingCount,
            activeLoaders: Array.from(this.activeLoaders.keys()),
            hasActiveLoading: this.globalLoadingCount > 0
        };
    }

    /**
     * Limpia todos los loadings activos
     */
    clearAllLoading() {
        const loaderIds = Array.from(this.activeLoaders.keys());
        loaderIds.forEach(id => this.hideGlobalLoading(id));

        document.querySelectorAll('.btn-loading').forEach(btn => {
            btn.classList.remove('btn-loading');
            if (btn.dataset.originalText) {
                btn.innerHTML = btn.dataset.originalText;
                delete btn.dataset.originalText;
            }
            if (btn.dataset.originalDisabled) {
                btn.disabled = btn.dataset.originalDisabled === 'true';
                delete btn.dataset.originalDisabled;
            }
        });

        document.querySelectorAll('[data-is-loading="true"]').forEach(el => {
            if (el.dataset.originalContent) {
                el.innerHTML = el.dataset.originalContent;
                delete el.dataset.originalContent;
            }
            delete el.dataset.isLoading;
        });

        if (this.config.log) {
            this.config.log('Todos los loadings limpiados', 'info');
        }
    }

    /**
     * Simulador de carga con progreso automático
     */
    async simulateLoading(id, duration = 3000, steps = 20) {
        this.showGlobalLoading({
            id: id,
            showProgress: true,
            progress: 0,
            text: 'Iniciando...'
        });

        const stepDuration = duration / steps;
        const stepProgress = 100 / steps;

        for (let i = 0; i <= steps; i++) {
            const progress = i * stepProgress;
            let text = 'Cargando...';

            if (progress < 30) text = 'Iniciando...';
            else if (progress < 60) text = 'Procesando...';
            else if (progress < 90) text = 'Finalizando...';
            else text = 'Completado';

            this.updateProgress(id, progress, text);

            if (i < steps) {
                await new Promise(resolve => setTimeout(resolve, stepDuration));
            }
        }

        setTimeout(() => {
            this.hideGlobalLoading(id);
        }, 500);
    }
}

// Crear instancia global
window.LoadingSystem = new LoadingSystem();

// Atajos globales para facilidad de uso
window.showLoading = (options) => window.LoadingSystem.showGlobalLoading(options);
window.hideLoading = (id) => window.LoadingSystem.hideGlobalLoading(id);
window.showProgress = (id, progress, text) => window.LoadingSystem.updateProgress(id, progress, text);

// Log de inicialización
if (window.AppConfig && window.AppConfig.app.isDevelopment) {
    console.log('Loading System initialized');
}