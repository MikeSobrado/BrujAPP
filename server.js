require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.CMC_API_KEY;

if (!API_KEY) {
  console.warn('Warning: CMC_API_KEY no está definido en .env. El proxy fallará sin la clave.');
}

app.use(cors());
app.use(express.json());

// Headers de seguridad
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP - Previene inyección de scripts maliciosos
  // Permite: scripts de 'self', Bootstrap CDN, CryptoJS, Chart.js
  // NO permite: eval(), inline scripts inline scriptsó sin nonce, scripts de dominios desconocidos
  res.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.plot.ly https://s3.tradingview.com; " +
    "style-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' https://cdn.jsdelivr.net data:; " +
    "connect-src 'self' https: http://localhost:8000 https://pro-api.coinmarketcap.com https://api.bitget.com https://www.tradingview.com; " +
    "frame-src 'self' https://*.tradingview.com https://*.tradingview-widget.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  next();
});

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// Ruta raíz: servir el dashboard principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para reenviar la petición de 'global-metrics/quotes/latest'
app.get('/api/global-metrics', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Obtener la clave desde query parameter o desde .env (backwards compatibility)
    const apiKey = req.query.key || process.env.CMC_API_KEY;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required', 
        message: 'Proporciona la clave CMC como parámetro query o configúrala en .env'
      });
    }

    const url = `${CMC_BASE}/v1/global-metrics/quotes/latest`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    const body = await response.text();
    const duration = Date.now() - startTime;

    // Log exitoso
    console.log(`✅ [${new Date().toISOString()}] API Global Metrics - ${response.status} (${duration}ms)`);

    // Reenviamos exactamente el status y el cuerpo recibido por CoinMarketCap
    res.status(response.status).set({ 'Content-Type': 'application/json' }).send(body);
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      timestamp: new Date().toISOString(),
      endpoint: '/api/global-metrics',
      duration: `${duration}ms`,
      error: err.message
    };

    console.error('🚨 Error en proxy:', errorInfo);
    
    res.status(500).json({ 
      error: 'Error interno en el proxy', 
      timestamp: errorInfo.timestamp,
      detail: process.env.NODE_ENV === 'production' ? undefined : err.message 
    });
  }
});

// Endpoint de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    apiKeyConfigured: !!API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/global-metrics`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🔑 API Key configured: ${!!API_KEY}`);
});