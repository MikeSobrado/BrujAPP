// --- FUNCIONES GLOBALES DE NOTICIAS ---

// Declaramos las variables en el ámbito global.
let currentNewsCategory = 'general'; // La usaremos para cambiar de feed
let currentRssUrl = 'https://news.bitcoin.com/feed/'; // URL por defecto (probada y funcional)

// Función para cargar noticias (debe ser global para que tabs.js pueda llamarla)
async function loadNews() {
    const newsContent = document.getElementById('news-content');
    
    // Mostrar indicador de carga
    newsContent.innerHTML = `
        <div class="news-loading">
            <div class="news-loading-spinner"></div>
        </div>
    `;
    
    // Usamos un proxy CORS para evitar problemas de seguridad del navegador
    const CORS_PROXY = "https://api.codetabs.com/v1/proxy?quest=";
    const parser = new RSSParser();
    
    try {
        const feed = await parser.parseURL(CORS_PROXY + currentRssUrl);
        renderNews(feed.items);
        
    } catch (error) {
        console.error('Error al cargar el feed RSS:', error);
        newsContent.innerHTML = `
            <div class="news-error">
                <p>Error al cargar las noticias desde el feed RSS.</p>
                <p>Verifica que la URL en Ajustes es correcta.</p>
                <p>Detalles del error: ${error.message}</p>
            </div>
        `;
    }
}

// Función para renderizar las noticias (debe ser global)
function renderNews(items) {
    const newsContent = document.getElementById('news-content');
    
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
        
        // Formatear la fecha
        const publishedDate = new Date(item.pubDate).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Limpiar el contenido HTML para evitar problemas
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.content || item.contentSnippet || 'Sin descripción disponible.';
        const cleanDescription = tempDiv.textContent || tempDiv.innerText || 'Sin descripción disponible.';
        
        newsItem.innerHTML = `
            <div class="news-header">
                <div>
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-source">Fuente: ${item.creator || 'RSS Feed'}</p>
                </div>
                <p class="news-date">${publishedDate}</p>
            </div>
            <p class="news-description">${cleanDescription}</p>
            <a href="${item.link}" target="_blank" class="news-link">Leer más</a>
        `;
        
        newsList.appendChild(newsItem);
    });
    
    newsContent.innerHTML = '';
    newsContent.appendChild(newsList);
}


// --- INICIALIZACIÓN DEL MÓDULO DE NOTICIAS ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Cargar la URL del feed desde localStorage al iniciar la página
    const rssUrlInput = document.getElementById('rss-feed-url');
    if (rssUrlInput) {
        const savedUrl = localStorage.getItem('rss-feed-url');
        if (savedUrl) {
            currentRssUrl = savedUrl;
            rssUrlInput.value = savedUrl;
        }
    }
    
    // Event listeners para los filtros de noticias (ahora cambian el feed)
    const newsFilters = document.querySelectorAll('.news-filter');
    newsFilters.forEach(filter => {
        filter.addEventListener('click', (event) => {
            // Quitar la clase 'active' de todos los botones
            newsFilters.forEach(f => f.classList.remove('active'));
            // Añadir la clase 'active' al botón que se ha clicado
            event.target.classList.add('active');

            // Lógica para cambiar el feed RSS según el filtro
            const category = event.target.getAttribute('data-category');
            let newUrl = '';

            switch(category) {
                case 'cryptocurrency':
                    newUrl = 'https://coinjournal.net/news/category/business/feed';
                    break;
                case 'forex':
                    newUrl = 'https://www.forexlive.com/feed';
                    break;
                case 'stocks':
                    newUrl = 'https://es.investing.com/rss/news.rss';
                    break;
                case 'custom': // Caso para feed personalizado
                    newUrl = localStorage.getItem('rss-feed-url');
                    // Si no hay una URL personalizada guardada, no hacemos nada
                    if (!newUrl) {
                        alert('No hay ninguna fuente personalizada configurada. Ve a Ajustes para añadir una.');
                        return;
                    }
                    break;
                default: // general
                    newUrl = 'https://news.bitcoin.com/feed/';
            }

            currentRssUrl = newUrl;
            localStorage.setItem('rss-feed-url', newUrl);
            loadNews(); // Recargar noticias con el nuevo feed
        });
    });
});
