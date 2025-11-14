const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Middleware para servir archivos estáticos
app.use(express.static('.', {
    // Configuración para permitir archivos .html sin extensión
    extensions: ['html', 'htm'],
    fallthrough: true
}));

// Middleware especial para manejar componentes sin extensión .html
app.use('/components', (req, res, next) => {
    const originalUrl = req.url;
    
    // Si la URL no termina en .html, agregar la extensión
    if (!originalUrl.endsWith('.html') && !originalUrl.includes('.')) {
        const htmlPath = path.join(__dirname, 'components', originalUrl + '.html');
        
        // Verificar si el archivo .html existe
        if (fs.existsSync(htmlPath)) {
            console.log(`🔧 DuckDuckGo Fix: ${originalUrl} -> ${originalUrl}.html`);
            return res.sendFile(htmlPath);
        }
    }
    
    next();
});

// Manejo de errores 404 personalizado
app.use((req, res, next) => {
    console.log(`❌ 404: ${req.url}`);
    res.status(404).send(`File not found: ${req.url}`);
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor DuckDuckGo-compatible ejecutándose en http://localhost:${PORT}`);
    console.log(`📁 Directorio: ${__dirname}`);
    console.log(`🔧 Funcionalidad especial: Auto-agregar extensiones .html para DuckDuckGo`);
});