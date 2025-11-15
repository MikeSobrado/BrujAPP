require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const BITGET_BASE = 'https://api.bitget.com';
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

// ========================
// BITGET PROXY ENDPOINT
// ========================
// Recibe credenciales del cliente y firma las peticiones a Bitget
app.post('/api/bitget', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      apiKey,
      apiSecret,
      apiPassphrase,
      method = 'GET',
      path: endpointPath,
      params = {},
      body: bodyData = ''
    } = req.body;

    // Validar credenciales
    if (!apiKey || !apiSecret || !apiPassphrase) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'apiKey, apiSecret, y apiPassphrase son requeridos'
      });
    }

    // Validar endpoint
    if (!endpointPath || typeof endpointPath !== 'string') {
      return res.status(400).json({
        error: 'Invalid path',
        message: 'path debe ser una ruta válida de Bitget API'
      });
    }

    // Construir query string si params existe
    let fullPath = endpointPath;
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      fullPath = endpointPath + (queryString ? '?' + queryString : '');
    }

    // Generar firma (HMAC-SHA256)
    const timestamp = Date.now().toString();
    const bodyForSignature = method === 'GET' ? '' : (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    const stringToSign = timestamp + method + endpointPath + bodyForSignature;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(stringToSign)
      .digest('base64');

    // Headers para Bitget
    const bitgetHeaders = {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': apiPassphrase,
      'Content-Type': 'application/json'
    };

    // Realizar petición a Bitget
    const url = BITGET_BASE + fullPath;
    console.log(`🔗 [${new Date().toISOString()}] ${method} ${url}`);

    const bitgetResponse = await fetch(url, {
      method: method,
      headers: bitgetHeaders,
      body: bodyForSignature ? bodyForSignature : undefined,
      timeout: 30000
    });

    const responseBody = await bitgetResponse.text();
    const duration = Date.now() - startTime;

    // Log del resultado
    console.log(`✅ [${new Date().toISOString()}] Bitget ${method} ${endpointPath} - ${bitgetResponse.status} (${duration}ms)`);

    // Reenviamos la respuesta exacta de Bitget
    res.status(bitgetResponse.status)
      .set({ 'Content-Type': 'application/json' })
      .send(responseBody);

  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`🚨 Error en proxy Bitget (${duration}ms):`, err.message);

    res.status(502).json({
      error: 'Proxy error',
      message: process.env.NODE_ENV === 'production' ? 'Error al conectar con Bitget' : err.message,
      timestamp: new Date().toISOString()
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