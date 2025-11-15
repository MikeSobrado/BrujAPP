require('dotenv').config();
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const CMC_BASE = 'https://pro-api.coinmarketcap.com';
const API_KEY = process.env.CMC_API_KEY;

if (!API_KEY) {
  console.warn('Warning: CMC_API_KEY no está definido en .env. El proxy fallará sin la clave.');
}

app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// Ruta raíz: servir el dashboard de dominancia
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dominance-dashboard.html'));
});

// Ruta para reenviar la petición de 'global-metrics/quotes/latest'
app.get('/api/global-metrics', async (req, res) => {
  try {
    const url = `${CMC_BASE}/v1/global-metrics/quotes/latest`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY || '',
        'Accept': 'application/json'
      }
    });

    const body = await response.text();

    // Reenviamos exactamente el status y el cuerpo recibido por CoinMarketCap
    res.status(response.status).set({ 'Content-Type': 'application/json' }).send(body);
  } catch (err) {
    console.error('Error en proxy:', err);
    res.status(500).json({ error: 'Error interno en el proxy', detail: err.message });
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