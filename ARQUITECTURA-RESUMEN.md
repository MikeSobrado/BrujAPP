# 📊 Trading Dome - Arquitectura (Resumen Rápido)

Referencia visual rápida de cómo funciona la app.

---

## 🏗️ Arquitectura de 3 Capas

```
┌─────────────────────────────┐
│   USUARIO (Navegador)       │  
│  ✓ Ve la tabla de posiciones
│  ✓ Ingresa credenciales de Bitget
│  ✓ Exporta PDF
└──────────────┬──────────────┘
               │ HTTPS
               │
┌──────────────▼──────────────┐
│  FRONTEND (GitHub Pages)    │
│  https://mikesobrado.github │
│         .io/Trading-Dome/   │
├──────────────────────────────┤
│ bitget-api.js               │
│ → Guarda credenciales       │
│ → Envía POST al proxy       │
│                              │
│ dominance.js                │
│ → Carga datos de CMC        │
│                              │
│ button-handlers.js          │
│ → Maneja clics              │
│                              │
│ bitget-positions.js         │
│ → Renderiza tabla           │
└──────────────┬──────────────┘
               │ POST /api/bitget
               │ GET /api/global-metrics
               │
┌──────────────▼──────────────┐
│   BACKEND (Render)          │
│  trading-dome-dashboard     │
│      .onrender.com          │
├──────────────────────────────┤
│ server.js                   │
│ POST /api/bitget            │
│ ├─ Recibe: credenciales     │
│ ├─ Calcula: firma HMAC      │
│ ├─ Firma: timestamp + GET + │
│ │          path + params    │
│ └─ Envía: a Bitget API      │
│                              │
│ GET /api/global-metrics     │
│ ├─ Recibe: CMC API key      │
│ └─ Envía: a CoinMarketCap   │
│                              │
│ GET /health                 │
│ └─ Status del servidor      │
│                              │
│ CORS Middleware             │
│ └─ Permite: GitHub Pages    │
│    Bloquea: otros orígenes  │
└──────────────┬──────────────┘
               │ HTTPS
               │
         ┌─────┴─────┐
         │           │
┌────────▼─────┐ ┌──▼──────────┐
│  Bitget API  │ │CoinMarketCap│
│              │ │    API      │
│/api/v2/...   │ │/v1/...      │
└──────────────┘ └─────────────┘
```

---

## 🔐 Flujo de Credenciales

```
USUARIO            NAVEGADOR (Frontend)        SERVIDOR (Backend)      BITGET API
┌────┐                ┌─────┐                      ┌─────┐                ┌────┐
│    │                │     │                      │     │                │    │
│ 1. Ingresa          │     │                      │     │                │    │
│    credenciales ──▶ │     │                      │     │                │    │
│                     │ 2.  │ Encripta con         │     │                │    │
│                     │     │ CryptoJS             │     │                │    │
│                     │     │ Guarda en            │     │                │    │
│                     │     │ sessionStorage       │     │                │    │
│                     │     │                      │     │                │    │
│ 3. Click en         │ 4.  │ Lee credenciales     │     │                │    │
│    "Conectar"  ────▶│     │ del sessionStorage    │     │                │    │
│                     │     │                      │     │                │    │
│                     │ 5.  │ POST credenciales    │     │                │    │
│                     │     │ + método + path  ───▶│     │                │    │
│                     │     │                      │     │ 6. Calcula      │    │
│                     │     │                      │     │ firma HMAC      │    │
│                     │     │                      │     │ timestamp +     │    │
│                     │     │                      │     │ GET +           │    │
│                     │     │                      │     │ /path?params    │    │
│                     │     │                      │     │                │    │
│                     │     │                      │ 7.  │ Envía headers  │    │
│                     │     │                      │ ACCESS-KEY      ──▶│    │
│                     │     │                      │ ACCESS-SIGN         │ ✓ Verifica
│                     │     │                      │ (firma)             │   firma
│                     │     │                      │ ACCESS-TIMESTAMP    │   
│                     │     │                      │                │    │
│                     │ 8.  │ Devuelve respuesta◀──│ Bitget responde│    │
│                     │     │ { data: [...] }  │    │                │    │
│                     │     │                      │     │                │    │
│ 9. Ve tabla en      │ 10. │ Renderiza tabla      │     │                │    │
│    navegador    ◀───│     │ de posiciones        │     │                │    │
│                     │     │                      │     │                │    │
```

**🔒 Seguridad**: Credenciales NUNCA se guardan en servidor, solo se usan para firmar.

---

## 🔑 Firma HMAC-SHA256 (Bitget)

```
┌─────────────────────────────────────────────────┐
│ Bitget requiere que cada request esté firmado   │
└─────────────────────────────────────────────────┘

1️⃣  Crear stringToSign:
    ┌──────────────────────────────────────┐
    │ timestamp                             │
    │ + METHOD (GET/POST/etc)              │
    │ + REQUEST_PATH (con query string)    │
    │ + BODY (vacío para GET)              │
    └──────────────────────────────────────┘
    
    Ejemplo:
    "1700000000000" +
    "GET" +
    "/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500" +
    ""
    
    = "1700000000000GET/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500"

2️⃣  Calcular HMAC-SHA256:
    ┌──────────────────────────────────────┐
    │ signature = HMAC-SHA256(stringToSign, apiSecret)
    │ encoded as Base64
    │ = "G7x8K2mP9vL4wQr1nJ6tY8uH3fB5dC2eA9sX7zW4..."
    └──────────────────────────────────────┘

3️⃣  Enviar en headers:
    ┌──────────────────────────────────────┐
    │ ACCESS-KEY: abc123...               │
    │ ACCESS-SIGN: G7x8K2mP9vL4...        │
    │ ACCESS-TIMESTAMP: 1700000000000     │
    │ ACCESS-PASSPHRASE: mypass           │
    └──────────────────────────────────────┘

4️⃣  Bitget verifica:
    ✓ ¿El timestamp es reciente? (< 5 min)
    ✓ ¿La firma es válida? (calcula su propia y compara)
    ✓ ¿El API key existe?
    ✓ ¿La passphrase coincide?
```

**⚠️ IMPORTANTE**: Query string (ej: `?productType=...`) DEBE incluirse en la firma para GET.

---

## 📡 Endpoints Disponibles

### `GET /health`
**Propósito**: Verificar que el backend funciona
```bash
curl https://trading-dome-dashboard.onrender.com/health
# {"status":"OK","timestamp":"...","port":"10000","apiKeyConfigured":false}
```

### `POST /api/bitget`
**Propósito**: Proxy firmado para Bitget API
```bash
curl -X POST https://trading-dome-dashboard.onrender.com/api/bitget \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "...",
    "apiSecret": "...",
    "apiPassphrase": "...",
    "method": "GET",
    "path": "/api/v2/mix/position/history-position",
    "params": {"productType": "USDT-FUTURES", "limit": 50},
    "body": ""
  }'
# {"code":"00000","msg":"success","data":{...}}
```

### `GET /api/global-metrics`
**Propósito**: Proxy para CoinMarketCap Global Metrics
```bash
curl "https://trading-dome-dashboard.onrender.com/api/global-metrics?key=YOUR_CMC_KEY"
# {"status":{...},"data":{"btc_dominance":45.23,...}}
```

---

## 🎯 Flujo Típico del Usuario

```
1. Usuario abre https://mikesobrado.github.io/Trading-Dome/
   └─ GitHub Pages sirve index.html

2. Usuario hace clic en [APIs] tab
   └─ Aparece form de credenciales

3. Usuario pega:
   - API Key de Bitget
   - API Secret de Bitget
   - API Passphrase de Bitget

4. Usuario hace clic en [Conectar]
   └─ button-handlers.js::connectBitgetButton()
   └─ Credenciales se guardan encriptadas en sessionStorage

5. Sistema automáticamente carga posiciones
   └─ bitget-api.js::getAllOrders()
   └─ Envía POST a proxy con credenciales + método + path

6. Backend (Render):
   └─ server.js recibe POST
   └─ Calcula firma HMAC-SHA256
   └─ Envía a Bitget API con firma
   └─ Bitget verifica firma y responde
   └─ Backend devuelve respuesta al frontend

7. Frontend renderiza tabla
   └─ bitget-positions.js::renderPositionsTable()
   └─ Usuario ve sus posiciones

8. Usuario puede:
   - Ver estadísticas
   - Exportar PDF
   - Ver dominancia de CMC
   - Cambiar tema (light/dark)
   - Cerrar sesión (limpia credenciales)
```

---

## 🔒 Seguridad

| Aspecto | Cómo funciona |
|---------|---------------|
| **Almacenamiento** | sessionStorage (se limpia al cerrar pestaña) |
| **Encriptación** | CryptoJS AES-256 en el navegador |
| **Servidor** | NO almacena credenciales, las usa solo para firmar |
| **Firma** | HMAC-SHA256 (estándar de Bitget) |
| **CORS** | Whitelist de orígenes permitidos |
| **HTTPS** | Todas las conexiones encriptadas |
| **Headers** | CSP (Content Security Policy) configurado |

---

## 📁 Estructura de Archivos (Clave)

```
Trading-Dome/
├── index.html                      (Página principal)
├── server.js                       (Backend - Express)
├── .env                            (Configuración - NO commitear)
├── assets/
│   ├── js/
│   │   ├── bitget-api.js          (Gestión de API Bitget)
│   │   ├── bitget-positions.js    (Renderizado de tabla)
│   │   ├── button-handlers.js     (Eventos de botones)
│   │   ├── dominance.js           (Datos de CoinMarketCap)
│   │   ├── main.js                (Lógica principal)
│   │   └── ... (otros módulos)
│   ├── css/
│   │   ├── main.css               (Estilos principales)
│   │   ├── dark-mode.css          (Tema oscuro)
│   │   └── ... (otros estilos)
│   └── images/
├── components/                      (HTML de componentes)
│   ├── header.html
│   ├── navigation.html
│   └── sections/
├── netlify/
│   └── functions/                  (Funciones serverless - deprecated)
├── ARQUITECTURA-FLUJO-COMPLETO.md  (Esta documentación)
└── DEPLOYMENT-TROUBLESHOOTING.md   (Deployment y troubleshooting)
```

---

## 🚀 Deployment Rápido

### Frontend (GitHub Pages)
```bash
git add .
git commit -m "feat: descripción"
git push
# ✅ Auto-actualiza en ~30 segundos
```

### Backend (Render)
```bash
git add server.js
git commit -m "fix: descripción"
git push
# ⏳ Auto-redeploy en 1-3 minutos
# Verificar: curl https://trading-dome-dashboard.onrender.com/health
```

---

## ✅ Checklist de Producción

- [ ] CORS configurado para GitHub Pages
- [ ] CMC_API_KEY en .env de Render
- [ ] Health check devuelve 200 OK
- [ ] Prueba de firmar petición a Bitget
- [ ] Posiciones se cargan correctamente
- [ ] Tabla renderiza sin errores
- [ ] Credenciales se limpian al cerrar pestaña
- [ ] No hay secrets en commits
- [ ] HTTPS en todas las URLs
- [ ] CSP headers configurados

---

## 🔗 URLs Importantes

| Servicio | URL |
|----------|-----|
| Frontend | https://mikesobrado.github.io/Trading-Dome/ |
| Backend | https://trading-dome-dashboard.onrender.com/ |
| Health | https://trading-dome-dashboard.onrender.com/health |
| API Bitget | https://trading-dome-dashboard.onrender.com/api/bitget |
| API CMC | https://trading-dome-dashboard.onrender.com/api/global-metrics |
| GitHub Repo | https://github.com/MikeSobrado/Trading-Dome |
| Render Logs | https://dashboard.render.com/ |

---

**Última actualización**: 15 de Noviembre, 2025  
**Status**: ✅ Producción - Funcionando
