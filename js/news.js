// --- FUNCIONES GLOBALES DE NOTICIAS ---

// Declaramos las variables en el ámbito global.
let currentNewsCategory = 'general';
let newsApiKey = '';

// Función para cargar noticias (debe ser global para que tabs.js pueda llamarla)
async function loadNews() {
    const newsContent = document.getElementById('news-content');
    
    // Mostrar indicador de carga
    newsContent.innerHTML = `
        <div class="news-loading">
            <div class="news-loading-spinner"></div>
        </div>
    `;
    
    // Obtener la clave de API desde localStorage
    newsApiKey = localStorage.getItem('newsapi-key') || '';
    
    if (!newsApiKey) {
        newsContent.innerHTML = `
            <div class="news-error">
                <p>No se ha configurado una clave de NewsAPI.</p>
                <p>Ve a la pestaña de Ajustes para configurar tu clave de API.</p>
            </div>
        `;
        return;
    }
    
    try {
        // Determinar la consulta de búsqueda según la categoría
        let query = '';
        switch (currentNewsCategory) {
            case 'cryptocurrency':
                query = 'cryptocurrency OR bitcoin OR ethereum OR crypto';
                break;
            case 'forex':
                query = 'forex OR currency OR foreign exchange';
                break;
            case 'stocks':
                query = 'stocks OR market OR trading OR shares';
                break;
            default:
                query = 'finance OR economy OR market';
        }
        
        // Realizar la solicitud a la API de NewsAPI
        const response = await fetch(`https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=20&language=es&apiKey=${newsApiKey}`);
        
        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
            throw new Error(data.message || 'Error al obtener noticias');
        }
        
        // Renderizar las noticias
        renderNews(data.articles);
        
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        newsContent.innerHTML = `
            <div class="news-error">
                <p>Error al cargar las noticias: ${error.message}</p>
                <p>Verifica tu clave de API en la pestaña de Ajustes.</p>
            </div>
        `;
    }
}

// Función para renderizar las noticias (debe ser global)
function renderNews(articles) {
    const newsContent = document.getElementById('news-content');
    
    if (!articles || articles.length === 0) {
        newsContent.innerHTML = `
            <div class="news-error">
                <p>No se encontraron noticias para esta categoría.</p>
            </div>
        `;
        return;
    }
    
    const newsList = document.createElement('div');
    newsList.className = 'news-list';
    
    articles.forEach(article => {
        const newsItem = document.createElement('div');
        newsItem.className = 'news-item';
        
        // Formatear la fecha
        const publishedDate = new Date(article.publishedAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        newsItem.innerHTML = `
            <div class="news-header">
                <div>
                    <h4 class="news-title">${article.title}</h4>
                    <p class="news-source">Fuente: ${article.source.name}</p>
                </div>
                <p class="news-date">${publishedDate}</p>
            </div>
            <p class="news-description">${article.description || article.content || 'Sin descripción disponible.'}</p>
            <a href="${article.url}" target="_blank" class="news-link">Leer más</a>
        `;
        
        newsList.appendChild(newsItem);
    });
    
    newsContent.innerHTML = '';
    newsContent.appendChild(newsList);
}


// --- INICIALIZACIÓN DEL MÓDULO DE NOTICIAS ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Cargar la clave de NewsAPI desde localStorage al cargar la página
    newsApiKey = localStorage.getItem('newsapi-key') || '';
    const newsApiKeyInput = document.getElementById('newsapi-key');
    if (newsApiKeyInput) {
        newsApiKeyInput.value = newsApiKey;
    }
    
    // Event listeners para los filtros de noticias
    const newsFilters = document.querySelectorAll('.news-filter');
    newsFilters.forEach(filter => {
        filter.addEventListener('click', (event) => {
            newsFilters.forEach(f => f.classList.remove('active'));
            event.target.classList.add('active');
            currentNewsCategory = event.target.getAttribute('data-category');
            loadNews();
        });
    });
});