/**
 * Sistema de Validación y Sanitización
 * Proporciona validación de datos, sanitización de HTML y prevención de XSS
 */

class ValidatorSystem {
    constructor() {
        this.config = window.AppConfig || {};
        this.initializeValidators();
    }

    initializeValidators() {
        // Reglas de validación predefinidas
        this.rules = {
            required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            numeric: (value) => !isNaN(value) && !isNaN(parseFloat(value)),
            integer: (value) => Number.isInteger(Number(value)),
            positive: (value) => Number(value) > 0,
            negative: (value) => Number(value) < 0,
            minLength: (value, min) => value.toString().length >= min,
            maxLength: (value, max) => value.toString().length <= max,
            min: (value, min) => Number(value) >= min,
            max: (value, max) => Number(value) <= max,
            regex: (value, pattern) => new RegExp(pattern).test(value),
            alphanumeric: (value) => /^[a-zA-Z0-9]+$/.test(value),
            alpha: (value) => /^[a-zA-Z]+$/.test(value),
            noSpecialChars: (value) => /^[a-zA-Z0-9\s]+$/.test(value)
        };

        // Configuración de sanitización
        this.sanitizeConfig = this.config.getSecurityConfig ? 
            this.config.getSecurityConfig('validation') : 
            {
                maxStringLength: 1000,
                allowedTags: ['b', 'i', 'em', 'strong'],
                sanitizeHtml: true
            };

        // Mensajes de error predefinidos
        this.errorMessages = {
            required: 'Este campo es obligatorio',
            email: 'Debe ser un email válido',
            url: 'Debe ser una URL válida',
            numeric: 'Debe ser un número válido',
            integer: 'Debe ser un número entero',
            positive: 'Debe ser un número positivo',
            negative: 'Debe ser un número negativo',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'Debe tener máximo {max} caracteres',
            min: 'Debe ser mayor o igual a {min}',
            max: 'Debe ser menor o igual a {max}',
            regex: 'No cumple con el formato requerido',
            alphanumeric: 'Solo se permiten letras y números',
            alpha: 'Solo se permiten letras',
            noSpecialChars: 'No se permiten caracteres especiales'
        };
    }

    /**
     * Valida un valor según las reglas especificadas
     */
    validate(value, rules, customMessages = {}) {
        const errors = [];

        if (!Array.isArray(rules)) {
            rules = [rules];
        }

        for (const rule of rules) {
            let ruleName, ruleParams = [];

            if (typeof rule === 'string') {
                ruleName = rule;
            } else if (typeof rule === 'object' && rule.name) {
                ruleName = rule.name;
                ruleParams = rule.params || [];
            } else {
                continue;
            }

            const validator = this.rules[ruleName];
            if (!validator) {
                console.warn(`Regla de validación desconocida: ${ruleName}`);
                continue;
            }

            let isValid;
            try {
                isValid = validator(value, ...ruleParams);
            } catch (error) {
                console.error(`Error en validación ${ruleName}:`, error);
                isValid = false;
            }

            if (!isValid) {
                let message = customMessages[ruleName] || this.errorMessages[ruleName] || `Validación ${ruleName} falló`;
                
                // Reemplazar parámetros en el mensaje
                ruleParams.forEach((param, index) => {
                    const placeholder = index === 0 ? '{min}' : index === 1 ? '{max}' : `{param${index}}`;
                    message = message.replace(placeholder, param);
                });

                errors.push({
                    rule: ruleName,
                    message: message,
                    params: ruleParams
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            value: value
        };
    }

    /**
     * Sanitiza una cadena de texto
     */
    sanitizeString(input, options = {}) {
        if (typeof input !== 'string') {
            input = String(input);
        }

        const config = { ...this.sanitizeConfig, ...options };

        // Limitar longitud
        if (config.maxStringLength && input.length > config.maxStringLength) {
            input = input.substring(0, config.maxStringLength);
        }

        // Trim espacios
        input = input.trim();

        // Sanitización básica de HTML si está habilitada
        if (config.sanitizeHtml) {
            input = this.sanitizeHtml(input, config.allowedTags);
        }

        return input;
    }

    /**
     * Sanitiza HTML básico
     */
    sanitizeHtml(html, allowedTags = []) {
        // Crear un elemento temporal
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Función recursiva para limpiar nodos
        const cleanNode = (node) => {
            // Si es un nodo de texto, mantenerlo
            if (node.nodeType === Node.TEXT_NODE) {
                return node;
            }

            // Si es un elemento
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Si el tag está permitido
                if (allowedTags.includes(tagName)) {
                    // Limpiar atributos peligrosos
                    const cleanElement = document.createElement(tagName);
                    
                    // Solo permitir atributos seguros
                    const safeAttributes = ['class', 'id'];
                    for (const attr of safeAttributes) {
                        if (node.hasAttribute(attr)) {
                            cleanElement.setAttribute(attr, node.getAttribute(attr));
                        }
                    }

                    // Procesar hijos recursivamente
                    for (const child of Array.from(node.childNodes)) {
                        const cleanChild = cleanNode(child);
                        if (cleanChild) {
                            cleanElement.appendChild(cleanChild);
                        }
                    }

                    return cleanElement;
                } else {
                    // Tag no permitido, pero mantener el contenido
                    const fragment = document.createDocumentFragment();
                    for (const child of Array.from(node.childNodes)) {
                        const cleanChild = cleanNode(child);
                        if (cleanChild) {
                            fragment.appendChild(cleanChild);
                        }
                    }
                    return fragment;
                }
            }

            return null;
        };

        // Limpiar todos los nodos hijos
        const cleanTemp = document.createElement('div');
        for (const child of Array.from(temp.childNodes)) {
            const cleanChild = cleanNode(child);
            if (cleanChild) {
                cleanTemp.appendChild(cleanChild);
            }
        }

        return cleanTemp.innerHTML;
    }

    /**
     * Previene ataques XSS en strings
     */
    preventXSS(input) {
        if (typeof input !== 'string') {
            input = String(input);
        }

        // Escapar caracteres HTML peligrosos
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return input.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
    }

    /**
     * Valida y sanitiza un campo de entrada
     */
    processInput(value, rules, sanitizeOptions = {}) {
        // Primero sanitizar
        const sanitizedValue = this.sanitizeString(value, sanitizeOptions);
        
        // Luego validar
        const validation = this.validate(sanitizedValue, rules);
        
        return {
            originalValue: value,
            sanitizedValue: sanitizedValue,
            validation: validation,
            isValid: validation.isValid,
            errors: validation.errors
        };
    }

    /**
     * Valida datos específicos para la aplicación de trading
     */
    validateTradingData() {
        return {
            // Validar entrada numérica para calculadora de riesgo
            validateRiskInput: (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
                const result = this.validate(value, [
                    'required',
                    'numeric',
                    { name: 'min', params: [min] },
                    { name: 'max', params: [max] }
                ]);

                if (result.isValid) {
                    result.numericValue = parseFloat(value);
                }

                return result;
            },

            // Validar respuesta de API
            validateApiResponse: (data, requiredFields = []) => {
                if (!data || typeof data !== 'object') {
                    return {
                        isValid: false,
                        errors: [{ message: 'Respuesta de API inválida' }]
                    };
                }

                const errors = [];
                for (const field of requiredFields) {
                    if (!(field in data)) {
                        errors.push({ message: `Campo requerido faltante: ${field}` });
                    }
                }

                return {
                    isValid: errors.length === 0,
                    errors: errors,
                    data: data
                };
            },

            // Validar configuración de paneles
            validatePanelConfig: (config) => {
                const schema = {
                    id: ['required', 'alphanumeric'],
                    name: ['required', { name: 'maxLength', params: [50] }]
                };

                const results = {};
                let isValid = true;

                for (const [field, rules] of Object.entries(schema)) {
                    const result = this.validate(config[field], rules);
                    results[field] = result;
                    if (!result.isValid) {
                        isValid = false;
                    }
                }

                return {
                    isValid: isValid,
                    fields: results,
                    errors: Object.entries(results)
                        .filter(([field, result]) => !result.isValid)
                        .flatMap(([field, result]) => 
                            result.errors.map(error => ({ field, ...error }))
                        )
                };
            },

            // Formatear números para display
            formatNumber: (value, decimals = 2, suffix = '') => {
                if (value === null || value === undefined || isNaN(value)) {
                    return 'N/A';
                }

                let num = parseFloat(value);
                
                // Formatear números grandes
                if (Math.abs(num) >= 1e9) {
                    num = (num / 1e9).toFixed(decimals) + 'B';
                } else if (Math.abs(num) >= 1e6) {
                    num = (num / 1e6).toFixed(decimals) + 'M';
                } else if (Math.abs(num) >= 1e3) {
                    num = (num / 1e3).toFixed(decimals) + 'K';
                } else {
                    num = num.toFixed(decimals);
                }

                return num + suffix;
            },

            // Validar datos de gráficas
            validateChartData: (data) => {
                if (!Array.isArray(data)) {
                    return {
                        isValid: false,
                        errors: [{ message: 'Los datos del gráfico deben ser un array' }]
                    };
                }

                if (data.length === 0) {
                    return {
                        isValid: false,
                        errors: [{ message: 'No hay datos para mostrar en el gráfico' }]
                    };
                }

                return {
                    isValid: true,
                    errors: [],
                    data: data
                };
            }
        };
    }

    /**
     * Crea un validador personalizado
     */
    addRule(name, validator, errorMessage) {
        this.rules[name] = validator;
        this.errorMessages[name] = errorMessage;
    }

    /**
     * Obtiene información del sistema
     */
    getSystemInfo() {
        return {
            rulesCount: Object.keys(this.rules).length,
            availableRules: Object.keys(this.rules),
            config: this.sanitizeConfig
        };
    }
}

// Crear instancia global
window.ValidatorSystem = new ValidatorSystem();

// Atajos globales para facilidad de uso
window.validate = (value, rules, messages) => window.ValidatorSystem.validate(value, rules, messages);
window.sanitize = (input, options) => window.ValidatorSystem.sanitizeString(input, options);
window.preventXSS = (input) => window.ValidatorSystem.preventXSS(input);

// Funciones de validación específicas para trading (compatibilidad hacia atrás)
const tradingValidators = window.ValidatorSystem.validateTradingData();

window.DataValidator = {
    validateApiResponse: tradingValidators.validateApiResponse,
    validateRiskInput: tradingValidators.validateRiskInput,
    sanitizeHTML: window.preventXSS,
    validatePanelConfig: tradingValidators.validatePanelConfig,
    formatNumber: tradingValidators.formatNumber,
    validateChartData: tradingValidators.validateChartData,
    validateEmail: (email) => window.validate(email, ['required', 'email']),
    cleanInput: (input) => window.sanitize(input)
};

// Clase DataSanitizer para compatibilidad
window.DataSanitizer = {
    cleanInput: (input) => window.sanitize(input),
    sanitizeTradingViewConfig: (config) => {
        const allowedProps = [
            'colorTheme', 'isTransparent', 'locale', 
            'countryFilter', 'importanceFilter', 'width', 'height'
        ];

        const sanitized = {};
        
        for (const prop of allowedProps) {
            if (config[prop] !== undefined) {
                sanitized[prop] = config[prop];
            }
        }

        return sanitized;
    }
};

// Log de inicialización
if (window.AppConfig && window.AppConfig.app.isDevelopment) {
    console.log('Validator System initialized:', window.ValidatorSystem.getSystemInfo());
}