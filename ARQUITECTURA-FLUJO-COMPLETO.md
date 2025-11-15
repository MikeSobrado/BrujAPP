# 🏗️ Trading Dome - Arquitectura y Flujo Completo

Documentación técnica completa de la arquitectura de Trading Dome después del rediseño de seguridad y proxy.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Datos](#flujo-de-datos)
3. [Componentes](#componentes)
4. [Autenticación y Seguridad](#autenticación-y-seguridad)
5. [CORS y Política de Origen](#cors-y-política-de-origen)
6. [Endpoints del Proxy](#endpoints-del-proxy)
7. [Flujo Completo: Usuario Conectándose](#flujo-completo-usuario-conectándose)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## Arquitectura General

### Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                             │
│                     (Navegador Web)                              │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ HTTPS
                          │
        ┌─────────────────▼──────────────────┐
        │   FRONTEND (GitHub Pages)          │
        │  https://mikesobrado.github.io/... │
        │                                     │
        │ ├─ HTML5 + Bootstrap 5             │
        │ ├─ JavaScript (ES6+)               │
        │ ├─ CryptoJS (encryption)           │
        │ ├─ Chart.js (gráficas)             │
        │ └─ TradingView Embeds              │
        │                                     │
        │ 📁 Archivos:                        │
        │ ├─ index.html                      │
        │ ├─ assets/js/bitget-api.js         │
        │ ├─ assets/js/button-handlers.js    │
        │ ├─ assets/js/dominance.js          │
        │ └─ assets/css/*.css                │
        └─────────────────┬──────────────────┘
                          │
                          │ POST /api/bitget
                          │ POST /api/global-metrics
                          │ GET  /health
                          │
        ┌─────────────────▼──────────────────┐
        │   BACKEND (Render)                 │
        │  https://trading-dome-dashboard... │
        │          .onrender.com             │
        │                                     │
        │ ├─ Node.js + Express.js            │
        │ ├─ HMAC-SHA256 Signing             │
        │ ├─ CORS Middleware                 │
        │ ├─ Rate Limiting                   │
        │ └─ Proxy Security                  │
        │                                     │
        │ 📁 Archivos:                        │
        │ ├─ server.js (endpoints)           │
        │ └─ .env (API keys)                 │
        └─────────────────┬──────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                │ HTTPS             │ HTTPS
                │                   │
        ┌───────▼────────┐  ┌──────▼──────────┐
        │   Bitget API   │  │  CoinMarketCap  │
        │   API v2       │  │   API v1        │
        │                │  │                 │
        │ /api/v2/mix/   │  │ /v1/global-     │
        │ position/...   │  │ metrics/...     │
        └────────────────┘  └─────────────────┘
```

---

## Flujo de Datos

### 1️⃣ Usuario Ingresa Credenciales

```
Usuario en GitHub Pages
        │
        ▼
[APIs] Tab
        │
        ▼
Form: API Key, Secret, Passphrase
        │
        ▼
Click: "Conectar"
        │
        ▼
button-handlers.js::connectBitgetButton()
        │
        ▼
BitgetAPIManager.saveCredentials(key, secret, passphrase)
        │
        ▼
SessionStorage (encriptado con CryptoJS)
        │
        ▼
✅ "Credenciales guardadas"
```

### 2️⃣ Cargar Posiciones

```
Click: "Cargar Posiciones"
        │
        ▼
BitgetAPIManager.getAllOrders(500)
        │
        ▼
Construir solicitud POST:
{
  apiKey: "tu_clave",
  apiSecret: "tu_secreto",
  apiPassphrase: "tu_passphrase",
  method: "GET",
  path: "/api/v2/mix/position/history-position",
  params: { productType: "USDT-FUTURES", limit: 500 }
}
        │
        ▼
fetch(proxy_url, { method: POST, body: JSON.stringify(solicitud) })
        │
        ▼
Render Backend: server.js::POST /api/bitget
        │
        ▼
Generar firma HMAC-SHA256:
  timestamp = Date.now()
  stringToSign = timestamp + "GET" + "/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500" + ""
  signature = Base64(HMAC-SHA256(stringToSign, apiSecret))
        │
        ▼
Construir headers de Bitget:
{
  "ACCESS-KEY": apiKey,
  "ACCESS-SIGN": signature,
  "ACCESS-TIMESTAMP": timestamp,
  "ACCESS-PASSPHRASE": apiPassphrase
}
        │
        ▼
fetch("https://api.bitget.com/api/v2/mix/position/history-position?...", { headers })
        │
        ▼
Bitget API responde:
{
  "code": "00000",
  "msg": "success",
  "data": { "positions": [...] }
}
        │
        ▼
Backend extrae array de posiciones
        │
        ▼
Devuelve a frontend
        │
        ▼
Frontend renderiza tabla en bitget-positions.js
        │
        ▼
✅ Posiciones mostradas
```

---

## Componentes

### Frontend (GitHub Pages)

#### `index.html`
- Estructura HTML principal
- Incluye Bootstrap 5, Chart.js, TradingView widget
- Define estructura de pestañas y modales

#### `assets/js/bitget-api.js` 
**Responsabilidad**: Gestión de credenciales y comunicación con el proxy

```javascript
class BitgetAPIManager {
  // Guardar credenciales encriptadas en sessionStorage
  saveCredentials(key, secret, passphrase)
  
  // Cargar credenciales del sessionStorage
  loadCredentials()
  
  // Llamar al proxy para obtener posiciones
  async getAllOrders(limit = 50)
  
  // Detectar entorno (localhost vs producción)
  getProxyEndpoint()
}
```

#### `assets/js/button-handlers.js`
**Responsabilidad**: Manejar eventos de botones en el UI

```javascript
// Conectar botón - guarda credenciales y carga posiciones
connectBitgetButton.addEventListener('click', async (e) => {
  e.preventDefault()
  const apiKey = document.getElementById('apiKey').value
  const apiSecret = document.getElementById('apiSecret').value
  const passphrase = document.getElementById('passphrase').value
  
  window.BitgetAPI.saveCredentials(apiKey, apiSecret, passphrase)
  const positions = await window.BitgetAPI.getAllOrders(500)
  window.displayPositions(positions)
})
```

#### `assets/js/dominance.js`
**Responsabilidad**: Cargar datos de dominancia desde CoinMarketCap

```javascript
async function loadDominanceData(cmcApiKey) {
  const response = await fetch(proxy_url + '?key=' + cmcApiKey)
  const data = await response.json()
  // Renderizar datos de dominancia
}
```

#### `assets/js/bitget-positions.js`
**Responsabilidad**: Renderizar tabla y estadísticas de posiciones

```javascript
window.renderPositionsTable(positions, container)
window.renderPositionsStats(positions)
window.displayPositions(positions)
```

### Backend (Render)

#### `server.js`
**Responsabilidad**: Proxy seguro que firma peticiones a Bitget

```javascript
// Middleware CORS
app.use(cors(corsOptions))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp, port, apiKeyConfigured })
})

// Proxy para CoinMarketCap
app.get('/api/global-metrics', async (req, res) => {
  const apiKey = req.query.key
  const response = await fetch('https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest', {
    headers: { 'X-CMC_PRO_API_KEY': apiKey }
  })
  res.send(await response.text())
})

// Proxy para Bitget (FIRMA HMAC)
app.post('/api/bitget', async (req, res) => {
  const { apiKey, apiSecret, apiPassphrase, method, path, params, body } = req.body
  
  // Generar firma HMAC-SHA256
  const timestamp = Date.now().toString()
  const stringToSign = timestamp + method + pathConQueryString + bodyOrEmpty
  const signature = crypto.createHmac('sha256', apiSecret)
    .update(stringToSign)
    .digest('base64')
  
  // Llamar a Bitget con firma
  const response = await fetch('https://api.bitget.com' + path, {
    method,
    headers: {
      'ACCESS-KEY': apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': apiPassphrase
    }
  })
  
  res.send(await response.text())
})
```

#### `.env`
Archivo de configuración (NO commiteado):

```bash
# Puerto del servidor
PORT=3000

# API Key de CoinMarketCap (usada en /api/global-metrics)
CMC_API_KEY=tu_clave_aqui
```

---

## Autenticación y Seguridad

### 🔐 Credenciales de Bitget

#### En Frontend:
- Se guardan en `sessionStorage` (se limpian al cerrar la pestaña)
- Se encriptan con CryptoJS (algoritmo: AES-256)
- **NUNCA** se guardan en localStorage persistente

```javascript
// Guardando
sessionStorage.setItem(
  'bitget_credentials',
  CryptoJS.AES.encrypt(
    JSON.stringify({ apiKey, apiSecret, apiPassphrase }),
    encryptionKey
  )
)

// Cargando
const encrypted = sessionStorage.getItem('bitget_credentials')
const decrypted = CryptoJS.AES.decrypt(encrypted, encryptionKey)
const credentials = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
```

#### En Backend:
- Se reciben en POST `/api/bitget`
- Se usan SOLO para generar la firma HMAC
- **NUNCA** se guardan en el servidor
- **NUNCA** se logean en plain text

```javascript
app.post('/api/bitget', async (req, res) => {
  const { apiKey, apiSecret, apiPassphrase, ... } = req.body
  
  // Usar solo para generar firma
  const signature = crypto.createHmac('sha256', apiSecret)
    .update(stringToSign)
    .digest('base64')
  
  // Después de generar firma, no se guarda nada
})
```

### 🔑 Autenticación Bitget (HMAC-SHA256)

Bitget requiere que todas las peticiones estén firmadas con HMAC-SHA256:

```
1. Construir stringToSign:
   timestamp + HTTP_METHOD + REQUEST_PATH + BODY
   
   Ejemplo:
   "1700000000000" + "GET" + "/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=50" + ""

2. Generar firma:
   signature = Base64(HMAC-SHA256(stringToSign, apiSecret))

3. Enviar en headers:
   - ACCESS-KEY: apiKey
   - ACCESS-SIGN: signature (firma en base64)
   - ACCESS-TIMESTAMP: timestamp (en milisegundos)
   - ACCESS-PASSPHRASE: apiPassphrase
```

**⚠️ IMPORTANTE**: El query string DEBE incluirse en la firma para peticiones GET

---

## CORS y Política de Origen

### Orígenes Permitidos

```javascript
const allowedOrigins = [
  'http://localhost:3000',          // Desarrollo local
  'http://localhost:8080',          // Desarrollo local alternativo
  'https://mikesobrado.github.io',  // Frontend en producción
  'https://trading-dome-dashboard.onrender.com', // Backend mismo
  'https://github.com'              // Para preflight de GitHub
]
```

### Flujo CORS

1. **Browser**: Envía OPTIONS preflight
   ```
   OPTIONS /api/bitget HTTP/1.1
   Origin: https://mikesobrado.github.io
   ```

2. **Servidor**: Responde con headers CORS
   ```
   HTTP/1.1 204 No Content
   Access-Control-Allow-Origin: https://mikesobrado.github.io
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

3. **Browser**: Si OK, envía solicitud real
   ```
   POST /api/bitget HTTP/1.1
   [datos...]
   ```

### Bloqueo de Orígenes No Autorizados

Si alguien intenta acceder desde `evil.com`:

```
OPTIONS /api/bitget HTTP/1.1
Origin: https://evil.com
   ▼
Servidor: ❌ No permitido
   ▼
HTTP/1.1 500 Internal Server Error
(CORS not allowed)
```

---

## Endpoints del Proxy

### `GET /health`

Verificar que el backend está funcionando.

**Request**:
```bash
curl https://trading-dome-dashboard.onrender.com/health
```

**Response** (200 OK):
```json
{
  "status": "OK",
  "timestamp": "2025-11-15T13:45:08.122Z",
  "port": "10000",
  "apiKeyConfigured": false
}
```

---

### `GET /api/global-metrics`

Proxy para CoinMarketCap Global Metrics.

**Request**:
```bash
curl "https://trading-dome-dashboard.onrender.com/api/global-metrics?key=YOUR_CMC_API_KEY"
```

**Response** (200 OK):
```json
{
  "status": {
    "timestamp": "2025-11-15T13:45:08.122Z",
    "error_code": 0,
    "error_message": null
  },
  "data": {
    "btc_dominance": 45.23,
    "eth_dominance": 18.92,
    "...": "..."
  }
}
```

---

### `POST /api/bitget`

Proxy para peticiones firmadas a Bitget API.

**Request**:
```bash
curl -X POST "https://trading-dome-dashboard.onrender.com/api/bitget" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "tu_clave",
    "apiSecret": "tu_secreto",
    "apiPassphrase": "tu_passphrase",
    "method": "GET",
    "path": "/api/v2/mix/position/history-position",
    "params": {
      "productType": "USDT-FUTURES",
      "limit": 50
    },
    "body": ""
  }'
```

**Response** (200 OK):
```json
{
  "code": "00000",
  "msg": "success",
  "data": {
    "positions": [
      {
        "symbol": "BTCUSDT",
        "side": "long",
        "openAvgPrice": "45000.50",
        "closeAvgPrice": "46000.00",
        "openTotalPos": "0.1",
        "netProfit": "150.00",
        "...": "..."
      }
    ]
  }
}
```

---

## Flujo Completo: Usuario Conectándose

### Paso 1: Usuario abre GitHub Pages

```
1. Usuario ingresa a: https://mikesobrado.github.io/Trading-Dome/
2. GitHub Pages sirve: index.html
3. Se cargan archivos estáticos:
   - assets/js/bitget-api.js
   - assets/js/button-handlers.js
   - assets/css/main.css
   - etc.
4. JavaScript se ejecuta en el navegador del usuario
```

### Paso 2: Usuario va a pestaña "APIs"

```
1. Click en [APIs] tab
2. Se muestra form con 3 inputs:
   - API Key
   - API Secret
   - API Passphrase
3. Usuario copia sus credenciales de Bitget y las pega
```

### Paso 3: Usuario hace click en "Conectar"

```javascript
// button-handlers.js - conectBitgetButton event listener
connectBitgetButton.addEventListener('click', async (e) => {
  e.preventDefault()
  
  // 1. Leer valores del form
  const apiKey = document.getElementById('apiKey').value      // "abc123..."
  const apiSecret = document.getElementById('apiSecret').value // "xyz789..."
  const passphrase = document.getElementById('passphrase').value // "mypass"
  
  // 2. Validar que no estén vacías
  if (!apiKey || !apiSecret || !passphrase) {
    console.error('Campos vacíos')
    return
  }
  
  // 3. Guardar en sessionStorage (encriptadas)
  window.BitgetAPI.saveCredentials(apiKey, apiSecret, passphrase)
  // En sessionStorage ahora hay:
  // {
  //   bitget_credentials: "U2FsdGVkX1vy9P7...encriptado..."
  // }
  
  // 4. Cargar posiciones
  try {
    const positions = await window.BitgetAPI.getAllOrders(500)
    console.log('Posiciones cargadas:', positions.length)
    
    // 5. Mostrar en UI
    window.displayPositions(positions)
    
    // 6. Mostrar mensaje de éxito
    const statusDiv = document.getElementById('key-status')
    statusDiv.innerHTML = '<div class="alert alert-success">✅ Conectado: ' + positions.length + ' posiciones</div>'
    
  } catch (error) {
    console.error('Error:', error)
    const statusDiv = document.getElementById('key-status')
    statusDiv.innerHTML = '<div class="alert alert-danger">❌ Error: ' + error.message + '</div>'
  }
})
```

### Paso 4: getAllOrders() envía solicitud al proxy

```javascript
// bitget-api.js - getAllOrders method
async getAllOrders(limit = 50) {
  if (!this.credentials) throw new Error('Sin credenciales')
  
  try {
    // 1. Preparar datos de la petición
    const path = '/api/v2/mix/position/history-position'
    const params = { productType: 'USDT-FUTURES', limit }
    
    // 2. Construir body para enviar al proxy
    const requestBody = {
      apiKey: this.credentials.apiKey,            // "abc123..."
      apiSecret: this.credentials.apiSecret,      // "xyz789..."
      apiPassphrase: this.credentials.passphrase, // "mypass"
      method: 'GET',
      path: path,
      params: params,
      body: ''
    }
    
    // 3. Enviar POST al proxy en Render
    const res = await fetch(
      'https://trading-dome-dashboard.onrender.com/api/bitget',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    )
    
    // 4. Procesar respuesta
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    
    const data = await res.json()
    
    // 5. Extraer array de posiciones (Bitget devuelve { data: { positions: [...] } })
    if (Array.isArray(data?.data?.positions)) {
      return data.data.positions
    } else {
      throw new Error('Formato inesperado')
    }
    
  } catch (e) {
    console.error('Error en getAllOrders:', e)
    throw e
  }
}
```

### Paso 5: Render Backend firma y reenvía a Bitget

```javascript
// server.js - POST /api/bitget endpoint
app.post('/api/bitget', async (req, res) => {
  try {
    const {
      apiKey,          // "abc123..."
      apiSecret,       // "xyz789..."
      apiPassphrase,   // "mypass"
      method = 'GET',
      path,            // "/api/v2/mix/position/history-position"
      params = {},
      body = ''
    } = req.body
    
    // 1. Validar credenciales presentes
    if (!apiKey || !apiSecret || !apiPassphrase) {
      return res.status(400).json({ error: 'Missing credentials' })
    }
    
    // 2. Construir full path con query string (IMPORTANTE para firma)
    let fullPath = path
    if (method === 'GET' && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString()
      // fullPath = "/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500"
      fullPath = path + '?' + qs
    }
    
    // 3. Generar firma HMAC-SHA256
    const timestamp = Date.now().toString() // "1700000000000"
    const bodyForSig = method === 'GET' ? '' : JSON.stringify(body)
    
    // Para GET, pathForSignature incluye query string
    const pathForSignature = method === 'GET' ? fullPath : path
    
    // stringToSign = "1700000000000GET/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500"
    const stringToSign = timestamp + method + pathForSignature + bodyForSig
    
    const signature = crypto
      .createHmac('sha256', apiSecret) // apiSecret es la clave privada
      .update(stringToSign)
      .digest('base64')
    // signature = "G7x8K2mP9vL4wQr1nJ6tY8uH3fB5dC2eA9sX7zW4..."
    
    // 4. Construir headers para Bitget
    const bitgetHeaders = {
      'ACCESS-KEY': apiKey,              // "abc123..."
      'ACCESS-SIGN': signature,          // Firma calculada
      'ACCESS-TIMESTAMP': timestamp,     // "1700000000000"
      'ACCESS-PASSPHRASE': apiPassphrase, // "mypass"
      'Content-Type': 'application/json'
    }
    
    // 5. Llamar a Bitget API con headers autenticados
    const bitgetResponse = await fetch(
      'https://api.bitget.com' + fullPath,
      {
        method: method,
        headers: bitgetHeaders,
        body: bodyForSig || undefined,
        timeout: 30000
      }
    )
    
    // 6. Devolver respuesta de Bitget al frontend
    const responseBody = await bitgetResponse.text()
    res
      .status(bitgetResponse.status)
      .set({ 'Content-Type': 'application/json' })
      .send(responseBody)
      
  } catch (err) {
    console.error('Error en proxy Bitget:', err.message)
    res.status(502).json({
      error: 'Proxy error',
      message: err.message
    })
  }
})
```

### Paso 6: Bitget API responde

```
Bitget verifica:
1. ¿ACCESS-KEY válida? ✅
2. ¿ACCESS-TIMESTAMP es reciente? ✅
3. ¿ACCESS-PASSPHRASE coincide? ✅
4. ¿ACCESS-SIGN (firma) es válida? ✅
   (Bitget calcula su propia firma con la misma fórmula y compara)

Si todo OK:
HTTP 200 OK
{
  "code": "00000",
  "msg": "success",
  "data": {
    "positions": [
      { "symbol": "BTCUSDT", "side": "long", ... },
      { "symbol": "ETHUSDT", "side": "short", ... },
      ...
    ]
  }
}
```

### Paso 7: Backend devuelve al Frontend

```
Response 200 OK
{
  "code": "00000",
  "msg": "success",
  "data": {
    "positions": [...]
  }
}
```

### Paso 8: Frontend renderiza posiciones

```javascript
// bitget-api.js - displayPositions function
window.displayPositions = function(positions) {
  console.log('Renderizando', positions.length, 'posiciones')
  
  const container = document.getElementById('positions-container')
  
  if (typeof window.renderPositionsTable === 'function') {
    // bitget-positions.js renderiza la tabla HTML
    window.renderPositionsTable(positions, container)
  }
  
  if (typeof window.renderPositionsStats === 'function') {
    // bitget-positions.js renderiza estadísticas
    window.renderPositionsStats(positions)
  }
}
```

```javascript
// bitget-positions.js - renderPositionsTable function
window.renderPositionsTable = function(positions, container) {
  if (!positions || positions.length === 0) {
    container.innerHTML = '<div class="alert">Sin historial</div>'
    return
  }
  
  let html = '<table class="table">'
  
  positions.forEach((pos) => {
    const date = new Date(parseInt(pos.ctime)).toLocaleString('es-ES')
    const symbol = pos.symbol
    const side = pos.holdSide === 'long' ? '🟢 LONG' : '🔴 SHORT'
    const pnl = parseFloat(pos.netProfit).toFixed(2)
    
    html += `
      <tr>
        <td>${date}</td>
        <td>${symbol}</td>
        <td>${side}</td>
        <td>${pnl}</td>
      </tr>
    `
  })
  
  html += '</table>'
  container.innerHTML = html
}
```

### Resultado Final

✅ Tabla con posiciones mostrada en el navegador del usuario
✅ Credenciales guardadas encriptadas en sessionStorage (se limpian al cerrar)
✅ Datos listos para análisis, PDF, etc.

---

## Troubleshooting

### ❌ Error: "CORS not allowed"

**Causa**: Origen no autorizado intenta acceder al backend

**Solución**:
1. Verificar que estás accediendo desde:
   - `https://mikesobrado.github.io` (producción)
   - `http://localhost:3000` (desarrollo)
2. Si necesitas agregar otro origen:
   - Editar `server.js` → `allowedOrigins` array
   - Agregar nuevo origen
   - Hacer commit y push a GitHub
   - Render redeployará automáticamente

---

### ❌ Error: "sign signature error" de Bitget

**Causa**: La firma HMAC no coincide con lo que Bitget espera

**Posibles razones**:
1. Query string no incluido en la firma para GET (RESUELTO: ahora incluimos)
2. `apiSecret` incorrecto o corrupto
3. Timestamp muy antiguo (Bitget rechaza > 5 minutos)
4. Body no serializado correctamente para POST

**Solución**:
1. Verificar que `apiSecret` es correcto en Bitget dashboard
2. Ver logs de Render:
   ```
   FIRMA DEBUG:
   - Timestamp: 1700000000000
   - Method: GET
   - EndpointPath: /api/v2/mix/position/history-position
   - FullPath: /api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500
   - PathForSignature: /api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500
   - StringToSign: "1700000000000GET/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500"
   - Signature: G7x8K2mP9vL4wQr1nJ6tY8uH3fB5dC2eA9sX7zW4...
   ```
3. Probar en otro cliente (ej: Postman) con las mismas credenciales

---

### ❌ Error: "Formato de respuesta inesperado de Bitget"

**Causa**: La estructura de respuesta de Bitget no es lo que esperábamos

**Solución**:
1. Ver logs del navegador (F12 → Console):
   ```
   📊 Respuesta de posiciones (bruto):
   Object { code: "00000", msg: "success", data: {...} }
   ```
2. Si `data` es un objeto (no array):
   - Verificar si tiene `data.data.positions` o similar
   - Código ya intenta múltiples ubicaciones automáticamente
3. Si aún no funciona:
   - Editar `bitget-api.js` → `getAllOrders` 
   - Agregar más búsquedas en la estructura de `data`

---

### ❌ Error: "TypeError: positions.forEach is not a function"

**Causa**: `positions` no es un array

**Solución**: Ver error anterior (Formato de respuesta inesperado)

---

### ❌ Error: "Las credenciales se limpiarán al cerrar la página"

**Esto NO es un error**, es una advertencia de seguridad. Es correcto que:
- Las credenciales se guarden SOLO en sessionStorage
- Se limpien al cerrar la pestaña
- NO se guarden en localStorage persistente

---

### ✅ Verificar que todo funciona

Ejecutar estos tests:

```bash
# 1. Health check
curl https://trading-dome-dashboard.onrender.com/health

# 2. CORS desde GitHub Pages origin
curl -H "Origin: https://mikesobrado.github.io" \
  https://trading-dome-dashboard.onrender.com/health

# 3. CORS desde origen bloqueado
curl -H "Origin: https://evil.com" \
  https://trading-dome-dashboard.onrender.com/health
# Debería dar error 500
```

---

## Deployment

### Cambios en Frontend (GitHub Pages)

```bash
# 1. Editar archivos en Trading-Dome/
# 2. Commit y push
git add .
git commit -m "feat: descripción del cambio"
git push origin main

# 3. GitHub Pages auto-actualiza en unos segundos
# Acceder a: https://mikesobrado.github.io/Trading-Dome/
```

### Cambios en Backend (Render)

```bash
# 1. Editar server.js o .env
# 2. Commit y push
git add server.js .env
git commit -m "fix: descripción del cambio"
git push origin main

# 3. Render detecta el cambio automáticamente
# El servicio se redeploy en 1-2 minutos
# Ver logs en: https://dashboard.render.com/

# 4. Verificar que funcionó
curl https://trading-dome-dashboard.onrender.com/health
```

### Agregar Nuevo Endpoint en Backend

```javascript
// 1. En server.js, agregar:
app.post('/api/nuevo-endpoint', async (req, res) => {
  // Lógica aquí
  res.json({ status: 'OK' })
})

// 2. Commit y push
// 3. Render redeploy automático
// 4. Frontend puede llamar:
fetch('https://trading-dome-dashboard.onrender.com/api/nuevo-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... })
})
```

### Agregar Nuevo Endpoint en Frontend

```javascript
// 1. En assets/js/nuevo-modulo.js, crear función:
async function miNuevaFuncion() {
  // Lógica aquí
}

// 2. En index.html, incluir script:
<script src="assets/js/nuevo-modulo.js"></script>

// 3. Commit y push
// 4. GitHub Pages auto-actualiza
```

---

## Referencias Rápidas

### URLs de Producción
- Frontend: https://mikesobrado.github.io/Trading-Dome/
- Backend: https://trading-dome-dashboard.onrender.com/
- Health: https://trading-dome-dashboard.onrender.com/health

### Archivos Clave
- **Backend**: `server.js` (endpoints del proxy)
- **Frontend - API**: `assets/js/bitget-api.js` (comunicación con proxy)
- **Frontend - UI**: `assets/js/button-handlers.js` (eventos)
- **Frontend - Tabla**: `assets/js/bitget-positions.js` (renderizado)
- **Frontend - Dominancia**: `assets/js/dominance.js` (CoinMarketCap)

### Documentación Externa
- [Bitget API v2 Docs](https://bitget-doc.readme.io/)
- [CoinMarketCap API](https://coinmarketcap.com/api/documentation/v1/)
- [Express.js Docs](https://expressjs.com/)
- [HMAC-SHA256 en Node.js](https://nodejs.org/api/crypto.html)

---

**Última actualización**: 15 de Noviembre, 2025  
**Versión**: 1.0 - Arquitectura de Proxy Seguro  
**Estado**: ✅ Producción - Funcionando correctamente
