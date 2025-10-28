// --- FUNCIONES GLOBALES DE NOTICIAS ---

// Declaramos las variables en el ámbito global.
let currentNewsCategory = 'general';

// Mapeo de categorías a URLs de feeds RSS.
// Puedes cambiar estas URLs por otras que prefieras.
const RSS_FEEDS = {
    'general': 'https://decrypt.co/feed', // <-- Nuevo: Noticias financieras en español
    'cryptocurrency': 'https://www.coindesk.com/arc/outboundfeeds/rss/', // <-- Mantenemos este, que funciona
    'forex': 'https://www.investing.com/rss/news.rss', // <-- Nuevo: Noticias Forex
    'stocks': 'https://www.ft.com/markets?format=rss' // <-- Nuevo: Noticias de Acciones
};

/**
 * Función principal para cargar noticias.
 * Llama a nuestro proxy de Netlify, que obtiene el feed RSS y lo devuelve sin problemas de CORS.
 */
async function loadNews() {
    const newsContent = document.getElementById('news-content');
    
    // Mostrar indicador de carga
    newsContent.innerHTML = `
        <div class="news-loading">
            <div class="news-loading-spinner"></div>
        </div>
    `;
    
    try {
        // Obtenemos la URL del feed RSS según la categoría seleccionada
        const rssUrl = RSS_FEEDS[currentNewsCategory];
        if (!rssUrl) {
            throw new Error('No hay un feed RSS configurado para esta categoría.');
        }
        
        // Llamamos a nuestra función de Netlify, pasando la URL del feed como parámetro
        const response = await fetch(`/.netlify/functions/proxy?url=${encodeURIComponent(rssUrl)}`);
        
        if (!response.ok) {
            throw new Error(`El servidor respondió con un error: ${response.status}`);
        }
        
        // La respuesta del proxy es texto plano (XML)
        const rssText = await response.text();
        
        // Usamos DOMParser para convertir el texto XML en un documento que podamos navegar
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, "application/xml");
        
        // Comprobamos si hubo un error al parsear el XML
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Error al procesar el feed RSS. El formato no es válido.');
        }
        
        // Renderizamos las noticias en la página a partir del XML
        renderNewsFromXML(xmlDoc);
        
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        newsContent.innerHTML = `
            <div class="news-error">
                <p>Error al cargar las noticias: ${error.message}</p>
                <p>Verifica la consola para más detalles.</p>
            </div>
        `;
    }
}

/**
 * Renderiza las noticias en la página a partir de un documento XML.
 * @param {Document} xmlDoc - El documento XML parseado del feed RSS.
 */
function renderNewsFromXML(xmlDoc) {
    const newsContent = document.getElementById('news-content');
    const items = xmlDoc.querySelectorAll('item'); // Los feeds RSS usan la etiqueta <item>
    
    if (!items || items.length === 0) {
        newsContent.innerHTML = `
            <div class="news-error">
                <p>No se encontraron noticias en el feed.</p>
            </div>
        `;
        return;
    }
    
    const newsList = document.createElement('div');
    newsList.className = 'news-list';
    
    items.forEach(item => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        // Extraemos los datos del XML. Usamos el operador ?. por si algún campo no existe.
        const title = item.querySelector('title')?.textContent || 'Sin título';
        const description = item.querySelector('description')?.textContent || 'Sin descripción.';
        const link = item.querySelector('link')?.textContent || '#';
        const pubDate = item.querySelector('pubDate')?.textContent;
        
        // Formateamos la fecha para que sea más legible
        let formattedDate = 'Fecha desconocida';
        if (pubDate) {
            try {
                formattedDate = new Date(pubDate).toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            } catch (e) {
                console.warn('No se pudo formatear la fecha:', pubDate);
            }
        }
        
        // Limpiamos la descripción de posibles etiquetas HTML que pueda contener
        const cleanDescription = description.replace(/<[^>]*>/g, '');
        
        newsItem.innerHTML = `
            <div class="news-header">
                <div>
                    <h4 class="news-title">${title}</h4>
                </div>
                <p class="news-date">${formattedDate}</p>
            </div>
            <p class="news-description">${cleanDescription}</p>
            <a href="${link}" target="_blank" class="news-link">Leer más</a>
        `;
        
        newsList.appendChild(newsItem);
    });
    
    newsContent.innerHTML = '';
    newsContent.appendChild(newsList);
}

// --- INICIALIZACIÓN DEL MÓDULO DE NOTICIAS ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners para los botones de filtro de noticias
    const newsFilters = document.querySelectorAll('.news-filter');
    newsFilters.forEach(filter => {
        filter.addEventListener('click', (event) => {
            // Quitamos la clase 'active' de todos los filtros
            newsFilters.forEach(f => f.classList.remove('active'));
            // Añadimos la clase 'active' al filtro que se ha pulsado
            event.target.classList.add('active');
            // Actualizamos la categoría y cargamos las noticias
            currentNewsCategory = event.target.getAttribute('data-category');
            loadNews();
        });
    });
});
