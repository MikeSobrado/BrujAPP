# 📋 Guía de Deployment y Troubleshooting

Documento de referencia rápida para deployments futuros y resolución de problemas.

---

## 🚀 Deployment Checklist

### ✅ Antes de hacer push

- [ ] Pruebas locales completadas (si aplica)
- [ ] No hay console.error o warnings importantes
- [ ] Cambios están en `git status`
- [ ] Mensaje de commit es descriptivo

### ✅ Frontend (GitHub Pages)

```bash
# 1. Verificar cambios
git status

# 2. Stage todos los cambios
git add .

# 3. Crear commit descriptivo
git commit -m "feat: descripción clara del cambio"

# 4. Push a GitHub
git push origin main

# 5. ✅ GitHub Pages auto-actualiza en ~30 segundos
# Ver en: https://mikesobrado.github.io/Trading-Dome/

# 6. Hard refresh en navegador (Ctrl+Shift+R) para limpiar cache
```

**Troubleshooting Frontend**:
- Si no ve cambios: Hacer hard refresh (Ctrl+Shift+R)
- Si sigue sin funcionar: Limpiar cache del navegador (DevTools → Application → Clear)
- Ver errores: Abrir DevTools (F12) → Console

### ✅ Backend (Render)

```bash
# 1. Verificar cambios en server.js o .env
git status

# 2. Stage los cambios
git add server.js .env  # NO commitear .env con secrets reales

# 3. Crear commit
git commit -m "fix: descripción del cambio"

# 4. Push a GitHub
git push origin main

# 5. ⏳ Render auto-detecta cambios y redeploy inicia
# El redeploy toma 1-3 minutos

# 6. ✅ Verificar que funcionó
curl https://trading-dome-dashboard.onrender.com/health

# 7. Si falla, ver logs en Render dashboard
# https://dashboard.render.com/
```

**Logs de Render**:
- Ir a: https://dashboard.render.com/
- Seleccionar el servicio
- Tab "Logs"
- Ver output en tiempo real

---

## 🔧 Cambios Comunes

### 1️⃣ Agregar Nuevo Endpoint en Backend

```javascript
// server.js - Agregar después de los endpoints existentes

app.post('/api/mi-endpoint', async (req, res) => {
  try {
    const { parametro1, parametro2 } = req.body
    
    // Lógica aquí
    
    res.json({ 
      status: 'success', 
      data: { ... }
    })
  } catch (err) {
    console.error('Error en /api/mi-endpoint:', err)
    res.status(500).json({ error: err.message })
  }
})
```

**Steps**:
1. Editar `server.js`
2. `git add server.js`
3. `git commit -m "feat: add /api/mi-endpoint"`
4. `git push`
5. Esperar redeploy (1-3 min)
6. Testar: `curl https://trading-dome-dashboard.onrender.com/api/mi-endpoint`

---

### 2️⃣ Llamar Nuevo Endpoint desde Frontend

```javascript
// assets/js/mi-modulo.js

async function llamarMiEndpoint(parametro1) {
  try {
    const response = await fetch(
      'https://trading-dome-dashboard.onrender.com/api/mi-endpoint',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parametro1: parametro1,
          parametro2: 'valor'
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Respuesta:', data)
    return data
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}
```

**Steps**:
1. Crear o editar archivo en `assets/js/`
2. Incluir en `index.html`: `<script src="assets/js/mi-modulo.js"></script>`
3. `git add assets/js/mi-modulo.js index.html`
4. `git commit -m "feat: add mi-modulo.js with new API call"`
5. `git push`
6. Hard refresh en navegador (Ctrl+Shift+R)

---

### 3️⃣ Cambiar Variable de Entorno

Las variables de entorno se usan en `server.js` y se definen en `.env`:

```bash
# .env (NO COMMITEAR CON SECRETS REALES)
PORT=3000
CMC_API_KEY=abc123...  # Tu clave real aquí
```

**Steps**:
1. Editar `.env` localmente
2. `git add .env` (solo si cambios menores)
3. `git commit -m "config: update environment variables"`
4. `git push`
5. Render releerá `.env` automáticamente

**⚠️ IMPORTANTE**: `.env` debe estar en `.gitignore` para no commitear secrets.

---

## 🐛 Errores Comunes y Soluciones

### ❌ "CORS not allowed" en navegador

```
Error: Access to XMLHttpRequest at 'https://...' from origin 'https://...' 
has been blocked by CORS policy
```

**Causas**:
- Tu origin no está en `allowedOrigins` en `server.js`
- El header CORS no se envía correctamente

**Solución**:
1. Verificar que tu origin está en la lista de permitidos
2. Si necesitas agregar uno nuevo:
   ```javascript
   // server.js
   const allowedOrigins = [
     'http://localhost:3000',
     'https://mikesobrado.github.io',
     'https://tu-nuevo-origin.com'  // ← Agregar aquí
   ]
   ```
3. Commit y push
4. Esperar redeploy

---

### ❌ "Error 502 - Bad Gateway"

```
Error: Failed to fetch
502 Bad Gateway
```

**Causas**:
- Render backend no está respondiendo
- Typo en la URL
- El endpoint no existe

**Solución**:
1. Verificar URL exacta: `https://trading-dome-dashboard.onrender.com/api/...`
2. Testar `/health`: `curl https://trading-dome-dashboard.onrender.com/health`
3. Si `/health` no responde:
   - Ver logs de Render (dashboard.render.com)
   - Posible que el servicio no esté running
   - Click en "Restart Service" en Render dashboard

---

### ❌ "Error 500 - Internal Server Error"

```
Error: Internal Server Error
```

**Causas**:
- Error en la lógica de `server.js`
- Excepción no manejada
- Problema con credenciales/API keys

**Solución**:
1. Ver logs de Render (dashboard.render.com)
2. Buscar línea del error:
   ```
   🚨 Error en /api/...
   Error: [descripción del error]
   ```
3. Arreglar el error en `server.js`
4. Commit y push
5. Render redeploy automático

---

### ❌ "Formato de respuesta inesperado de Bitget"

```
Error: Formato de respuesta inesperado de Bitget
```

**Causas**:
- Endpoint de Bitget cambió estructura de respuesta
- Documentación de API desactualizada
- Parámetros incorrectos

**Solución**:
1. Ver respuesta exacta en logs del navegador (F12 → Network)
2. Ver qué estructura tiene `data`:
   ```javascript
   console.log('Estructura:', data)
   // Buscar dónde está el array de posiciones
   ```
3. Actualizar `bitget-api.js` para extraer del lugar correcto:
   ```javascript
   // Ejemplo: si el array está en data.result.positions
   if (Array.isArray(data?.result?.positions)) {
     return data.result.positions
   }
   ```
4. Commit y push

---

### ❌ "sign signature error" de Bitget

```
Error: 40009: sign signature error
```

**Causas** (más comunes):
1. Query string no incluido en firma HMAC
2. `apiSecret` incorrecto
3. Timestamp muy antiguo
4. Body no serializado correctamente

**Solución**:
1. Verificar que `apiSecret` es correcto en Bitget dashboard
2. Ver logs de Render para inspeccionar firma:
   ```
   🔐 FIRMA DEBUG:
   - Timestamp: 1700000000000
   - Method: GET
   - EndpointPath: /api/v2/mix/position/history-position
   - FullPath: /api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500
   - PathForSignature: /api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500
   - StringToSign: "1700000000000GET/api/v2/mix/position/history-position?productType=USDT-FUTURES&limit=500"
   - Signature: G7x8K2mP...
   ```
3. Verificar que `PathForSignature` incluye query string (para GET debe incluir `?...`)
4. Si es correcto y sigue fallando, copiar `StringToSign` y verificar en otro cliente

---

### ❌ "Error al cargar posiciones: TypeError"

```
Error: TypeError: positions.forEach is not a function
```

**Causa**: `positions` no es un array

**Solución**: Ver error "Formato de respuesta inesperado"

---

### ❌ "Las credenciales se limpiarán al cerrar la página"

Este es un **mensaje de información**, NO es un error. Es correcto que:
- Las credenciales se guarden en sessionStorage (temporal)
- Se limpien al cerrar pestaña (seguridad)
- NO se guarden en localStorage (que es persistente)

---

## ✅ Pruebas Manuales

### Test 1: Health Check

```bash
curl https://trading-dome-dashboard.onrender.com/health

# Esperado:
# {"status":"OK","timestamp":"2025-11-15T...","port":"10000","apiKeyConfigured":false}
```

### Test 2: CORS desde GitHub Pages

```bash
curl -H "Origin: https://mikesobrado.github.io" \
  https://trading-dome-dashboard.onrender.com/health

# Esperado: Header `Access-Control-Allow-Origin: https://mikesobrado.github.io`
```

### Test 3: CORS bloqueado

```bash
curl -H "Origin: https://evil.com" \
  https://trading-dome-dashboard.onrender.com/health

# Esperado: Error 500 (CORS blocked)
```

### Test 4: Global Metrics (CoinMarketCap)

```bash
curl "https://trading-dome-dashboard.onrender.com/api/global-metrics?key=YOUR_CMC_API_KEY"

# Esperado: JSON con datos de dominancia
```

### Test 5: Bitget Proxy (con credenciales válidas)

```bash
curl -X POST "https://trading-dome-dashboard.onrender.com/api/bitget" \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "tu_clave_real",
    "apiSecret": "tu_secreto_real",
    "apiPassphrase": "tu_passphrase_real",
    "method": "GET",
    "path": "/api/v2/mix/position/history-position",
    "params": { "productType": "USDT-FUTURES", "limit": 50 },
    "body": ""
  }'

# Esperado: 
# {"code":"00000","msg":"success","data":{...}}
```

---

## 📊 Monitoreo en Producción

### Logs de Render

```bash
# 1. Ir a https://dashboard.render.com/
# 2. Seleccionar el servicio
# 3. Click en "Logs"
# 4. Ver logs en tiempo real

# Buscar estos logs para confirmar que funciona:
# ✅ "🚀 Proxy server running on port 10000"
# ✅ "✅ [ISO timestamp] Bitget GET /api/v2/... - 200"
# ✅ "✅ [ISO timestamp] API Global Metrics - 200"

# Buscar estos para detectar problemas:
# ❌ "🚨 Error en proxy Bitget:"
# ❌ "Error: "
# ❌ "⚠️ CORS blocked request from origin"
```

### Console del Navegador (F12)

```javascript
// Ver logs del frontend:
// ✅ "🔗 Conectando al proxy: ..."
// ✅ "📝 Enviando datos: ..."
// ✅ "✅ Credenciales guardadas"

// ❌ "❌ Error HTTP 400:"
// ❌ "❌ Error en getAllOrders:"
```

---

## 🔄 Rollback (volver a versión anterior)

Si algo sale mal después de un deploy:

```bash
# 1. Ver historial de commits
git log --oneline -10

# 2. Identificar commit anterior funcional
# Ej: "95ab9d7 fix: firma correcta"

# 3. Revertir cambios
git revert 95ab9d7  # No borra historial, solo revierte cambios
# O
git reset --hard 95ab9d7  # Borra todo hasta ese punto

# 4. Push
git push origin main

# 5. Render redeploy automático
```

---

## 📈 Escalabilidad Futura

### Agregar Más Endpoints de Bitget

```javascript
// Patrón general en server.js:
app.post('/api/bitget', async (req, res) => {
  const { path, params, body, ... } = req.body
  
  // El mismo endpoint maneja todos:
  // - POST /api/v2/mix/position/history-position
  // - POST /api/v2/account/balance
  // - POST /api/v2/mix/orders/pending
  // etc.
})
```

Para agregar más endpoints de Bitget:
1. Cliente envía diferente `path` y `params`
2. Backend firma y reenvía automáticamente
3. No necesita cambios en `server.js`

### Agregar Más Exchanges

```javascript
// Patrón: agregar endpoint específico para cada exchange
app.post('/api/binance', async (req, res) => {
  // Firma diferente, params diferentes, etc.
})

app.post('/api/kucoin', async (req, res) => {
  // Firma diferente, params diferentes, etc.
})
```

### Rate Limiting

Para producción, agregar rate limiting:

```bash
npm install express-rate-limit

// En server.js:
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100  // máximo 100 requests por IP
})

app.use('/api/', limiter)
```

---

## 📞 Support Rápido

### Si algo no funciona:

1. **Verificar logs**:
   - Frontend: F12 → Console
   - Backend: https://dashboard.render.com/ → Logs

2. **Hard refresh frontend**:
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

3. **Verificar health check**:
   - `curl https://trading-dome-dashboard.onrender.com/health`

4. **Ver cambios**:
   - `git log --oneline -5`

5. **Últimas opciones**:
   - Rollback a versión anterior
   - Revisar documentación: `ARQUITECTURA-FLUJO-COMPLETO.md`

---

**Última actualización**: 15 de Noviembre, 2025  
**Versión**: 1.0 - Deployment y Troubleshooting  
**Status**: ✅ Producción - Ready
