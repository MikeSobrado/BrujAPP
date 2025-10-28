// --- FUNCIONES GLOBALES DEL SISTEMA DE PESTAÑAS ---

// Declaramos las variables en el ámbito global.
let tabButtons, tabContents;


// --- INICIALIZACIÓN DEL MÓDULO DE PESTAÑAS ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Ahora que el DOM está listo, podemos obtener los elementos de forma segura.
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Quitar la clase 'active' de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Añadir la clase 'active' al botón que se ha clicado
            button.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const targetId = button.getAttribute('data-tab-target');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // Cargar contenido específico de la pestaña si es necesario
                // NOTA: La función loadNews debe estar definida como global en news.js
                if (targetId === 'noticias-tab') {
                    loadNews();
                } else if (targetId === 'mercado-tab') {
                    loadTradingViewWidgets();
                }
            }
        });
    });
});
