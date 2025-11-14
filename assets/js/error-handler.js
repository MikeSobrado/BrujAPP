// error-handler.js - Sistema centralizado de manejo de errores

class ErrorHandler {
    static logError(error, context = '') {
        const timestamp = new Date().toISOString();
        const errorInfo = {
            timestamp,
            context,
            message: error.message,
            stack: error.stack,
            type: error.constructor.name
        };
        
        console.error(`🚨 [${timestamp}] Error en ${context}:`, errorInfo);
        
        // En producción, aquí enviarías a un servicio de logging
        // this.sendToLoggingService(errorInfo);
    }

    static handleAPIError(error, endpoint) {
        this.logError(error, `API: ${endpoint}`);
        
        // Retornar respuesta amigable al usuario
        return {
            success: false,
            message: 'Error al conectar con el servicio. Inténtalo de nuevo.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        };
    }

    static handleComponentError(error, componentName) {
        this.logError(error, `Componente: ${componentName}`);
        
        return `<div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i>
            Error cargando ${componentName}. <button onclick="location.reload()" class="btn btn-sm btn-outline-warning">Recargar</button>
        </div>`;
    }
}

// Exportar para uso global
window.ErrorHandler = ErrorHandler;