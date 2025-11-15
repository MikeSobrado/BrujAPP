// Configurar validación del formulario demo
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('demo-validator-form');
    if (form && window.ValidatorSystem) {
        setupValidatorDemo();
    }
});

function setupValidatorDemo() {
    const schema = {
        email: {
            rules: ['required', 'email'],
            sanitize: { maxStringLength: 100 }
        },
        amount: {
            rules: ['required', 'numeric', 'positive', { name: 'max', params: [1000000] }],
            sanitize: { maxStringLength: 20 }
        },
        text: {
            rules: [{ name: 'maxLength', params: [500] }],
            sanitize: { 
                maxStringLength: 500,
                sanitizeHtml: true,
                allowedTags: ['b', 'i', 'em', 'strong']
            }
        }
    };

    const form = document.getElementById('demo-validator-form');
    
    // Validación en tiempo real
    ['email', 'amount', 'text'].forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldName, field, schema[fieldName]));
            field.addEventListener('input', debounce(() => validateField(fieldName, field, schema[fieldName]), 500));
        }
    });

    // Validación al enviar
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const validationResult = window.ValidatorSystem.validateApiInput(data, schema);
        
        displayValidationResults(validationResult);
        displaySanitizedData(validationResult.sanitizedData);
        
        // Mostrar errores en campos
        Object.entries(validationResult.data).forEach(([fieldName, result]) => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (result.isValid) {
                    field.classList.remove('is-invalid');
                    field.classList.add('is-valid');
                } else {
                    field.classList.remove('is-valid');
                    field.classList.add('is-invalid');
                    const feedback = field.parentNode.querySelector('.invalid-feedback');
                    if (feedback) {
                        feedback.textContent = result.errors.map(e => e.message).join(', ');
                    }
                }
            }
        });
    });
}

function validateField(fieldName, field, fieldSchema) {
    const result = window.ValidatorSystem.processInput(field.value, fieldSchema.rules, fieldSchema.sanitize);
    
    if (result.isValid) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = result.errors.map(e => e.message).join(', ');
        }
    }
}

function displayValidationResults(result) {
    const container = document.getElementById('validation-results');
    
    let html = `<div class="alert ${result.isValid ? 'alert-success' : 'alert-danger'}">
        <strong>${result.isValid ? 'Válido' : 'Errores encontrados'}:</strong>
    </div>`;
    
    if (!result.isValid) {
        html += '<ul class="list-group list-group-flush">';
        result.errors.forEach(error => {
            html += `<li class="list-group-item"><strong>${error.field}:</strong> ${error.message}</li>`;
        });
        html += '</ul>';
    }
    
    container.innerHTML = html;
}

function demoRiskValidation() {
    const validators = window.ValidatorSystem.validateTradingData();
    
    // Probar diferentes valores
    const testValues = [
        { value: "1000", label: "Valor válido" },
        { value: "-500", label: "Valor negativo" },
        { value: "abc", label: "No numérico" },
        { value: "", label: "Vacío" }
    ];
    
    let html = '<h6>Demo Risk Calculator Validation:</h6>';
    
    testValues.forEach(test => {
        const result = validators.validateRiskInput(test.value, 0, 100000);
        const statusMessage = result.isValid ? '✅ Válido' : '❌ ' + result.errors.map(e => e.message).join(', ');
        html += `<div class="alert ${result.isValid ? 'alert-success' : 'alert-danger'} py-2">
            <strong>${test.label} (${test.value}):</strong> 
            ${statusMessage}
        </div>`;
    });
    
    document.getElementById('validation-results').innerHTML = html;
}

function demoXSSPrevention() {
    const maliciousInputs = [
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
        '&lt;img src="x" onerror="alert(XSS)"&gt;',
        '&lt;b&gt;Texto seguro&lt;/b&gt;',
        'javascript:alert("XSS")'
    ];
    
    let html = '<h6>Demo XSS Prevention:</h6>';
    
    maliciousInputs.forEach(input => {
        const sanitized = window.preventXSS(input);
        const htmlSanitized = window.sanitize(input, { 
            allowedTags: ['b', 'i', 'em', 'strong'],
            sanitizeHtml: true 
        });
        
        html += '<div class="card mb-2"><div class="card-body p-2">';
        html += '<strong>Original:</strong> <code>' + input + '</code><br>';
        html += '<strong>XSS Escaped:</strong> <code>' + sanitized + '</code><br>';
        html += '<strong>HTML Sanitized:</strong> <code>' + htmlSanitized + '</code>';
        html += '</div></div>';
    });
    
    document.getElementById('validation-results').innerHTML = html;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
