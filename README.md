# 📊 Trading Dome Dashboard - Platform de Trading Profesional

Una aplicación web moderna para análisis de mercados financieros con integración directa a Bitget, indicadores técnicos avanzados, gestión de riesgo profesional y herramientas de análisis completas.

## 🚀 Características Principales

### 📈 Análisis Técnico
- **📊 Gráfica Avanzada TradingView** - Análisis técnico profesional con soporte de tema dinámico
  - Recarga automática al cambiar de tema (light/dark)
  - Par predeterminado: BTCUSDT con timeframe diario
  - Cambio de símbolo, indicadores y estudios técnicos incluidos
- **🧠 Fear & Greed Index** - Índice de sentimiento del mercado crypto (Alternative.me)
- **⚡ Bitcoin Funding Rate** - Tasas de financiación en tiempo real (Binance)
- **🥇 Dominancia de Criptomonedas** - BTC/ETH/Otros (CoinMarketCap)
- **📅 Calendario Económico** - Eventos económicos mundiales con tema dinámico (TradingView)
  - Recarga automática al cambiar de tema (light/dark)

### 🎯 Gestión de Trading Profesional
- **📊 Dashboard de Posiciones** - Análisis integrado desde Bitget
  - Estadísticas en tiempo real: Total operaciones, Win Rate, P&L, Promedio
  - Tabla detallada de movimientos con filtros
  - Auto-carga al conectar credenciales de Bitget
  - Exportación a PDF profesional
- **⚖️ Calculadora de Riesgo Avanzada** - Gestión profesional de posiciones
  - Cálculo automático de tamaño de posición
  - Análisis de relación riesgo/recompensa con validación precisa
  - Consideración de comisiones, financiación y spread
  - Sistema inteligente de alertas de riesgo/beneficio
- **📊 Análisis de Gráficas** - Herramientas técnicas completas
  - Curva de Equidad (P&L acumulado)
  - Distribución de P&L
  - Drawdown Máximo
  - Comisiones Acumuladas
  - Ratio Long vs Short
  - Estadísticas detalladas

### 💾 Sistema de Perfiles
- **📁 Gestión de Perfiles** - Guarda múltiples configuraciones
  - Perfiles con dashboard, calculadora e indicadores
  - Importa/Exporta configuraciones en JSON
  - Auto-guardado cada 30 segundos
  - Cambio rápido entre perfiles

### 🎨 Interfaz Moderna
- **🌓 Modo Oscuro/Claro** - Tema adaptable
- **📱 Responsivo** - Optimizado para desktop y tablet
- **🎯 Navegación Intuitiva** - Múltiples pestañas especializadas
- **🔗 Enlace Rápido a Bitget** - Acceso directo en navegación

### 🔧 Funcionalidades Técnicas
- **🔐 Conexión Segura** - API keys protegidas en sessionStorage encriptado
- **🚀 Serverless con Netlify** - Proxy seguro para APIs
- **💾 SessionStorage Encriptado** - Datos guardados seguros durante la sesión
- **📡 APIs Públicas y Privadas** - CoinMarketCap, Binance, Alternative.me, TradingView

## 📲 Integración Bitget

### ✅ Funcionalidades
1. **Conectar Credenciales** - Ingresa API key, secret y passphrase de Bitget
2. **Cargar Posiciones** - Descarga automática de posiciones cerradas
3. **Análisis Instantáneo** - Estadísticas en tiempo real
4. **Exportar Reporte PDF** - Genera reportes profesionales

### 🔒 Seguridad
- ✅ Las credenciales se guardan **SOLO EN TU NAVEGADOR** (sessionStorage encriptado)
- ✅ Nunca se envían a servidores externos innecesarios
- ✅ Se eliminan automáticamente al cerrar la pestaña
- ✅ Encriptación con CryptoJS

## 📡 Integración CoinMarketCap

### ✅ Funcionalidades
1. **Ingresa tu API Key** - En la pestaña de APIs (obtén la tuya en [CoinMarketCap](https://coinmarketcap.com/api/))
2. **Datos de Dominancia** - Se cargan automáticamente en el dashboard
3. **Seguro y Privado** - Tu clave se guarda encriptada en sessionStorage

### 🔒 Seguridad
- ✅ La clave se guarda **SOLO EN TU NAVEGADOR** (sessionStorage encriptado)
- ✅ Se envía encriptada al servidor solo cuando es necesario
- ✅ Se elimina automáticamente al cerrar la sesión
- ✅ Nunca se almacena en localStorage persistente

## ⚡ Instalación y Uso

### 🏗️ **Arquitectura (Backend + Frontend Separados)**

La app está diseñada para:
- **Backend**: Proxy seguro en Render que maneja credenciales y firma HMAC para Bitget
- **Frontend**: Sitio estático en GitHub Pages
- **Flujo**: Usuario → GitHub Pages (ingresa claves) → Render Proxy → Bitget API

```
┌─────────────────────┐          ┌──────────────────────┐         ┌─────────────┐
│   GitHub Pages      │          │   Render Backend     │         │   Bitget    │
│   Frontend HTML/CSS │ ─POST──> │   Proxy (Node.js)    │ ──────> │   API       │
│   (Usuario ingresa  │  datos   │   - Firma HMAC       │         │             │
│    claves en modal) │          │   - Rate limiting    │         └─────────────┘
└─────────────────────┘          │   - Seguridad        │
                                 └──────────────────────┘
```

### ☁️ **Opción 1: Producción (Render + GitHub Pages) ⭐ RECOMENDADA**

#### **Paso 1: Desplegar Backend en Render**

1. Abre [Render.com](https://render.com) e inicia sesión
2. **Crea nuevo Web Service**:
   - Repository: `https://github.com/tu-usuario/Trading-Dome`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: **Free** (suficiente)

3. **Configura Variables de Entorno** (en Render dashboard):
   ```
   CMC_API_KEY=tu_api_key_coinmarketcap
   NODE_ENV=production
   ```
   - Nota: **NO necesitas** BITGET_API_KEY, BITGET_API_SECRET, BITGET_PASSPHRASE
   - Los usuarios proporcionarán sus claves desde la UI

4. **Copia tu URL de Render** (ej: `https://trading-dome-api.onrender.com`)
   - Anotala para el Paso 3

#### **Paso 2: Desplegar Frontend en GitHub Pages**

1. En tu repositorio, ve a **Settings → Pages**
2. **Source**: Deploy from branch
3. **Branch**: `main` / folder: `/ (root)`
4. Tu sitio estará en: `https://tu-usuario.github.io/Trading-Dome/`

#### **Paso 3: Actualizar URL del Proxy en Frontend**

El archivo `assets/js/bitget-api.js` ya tiene lógica para detectar:
- **Desarrollo local**: `http://localhost:3000/api/bitget`
- **Producción**: `https://trading-dome-api.onrender.com/api/bitget`

Si tu URL de Render es diferente, edita línea ~52:

```javascript
getProxyEndpoint() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3000/api/bitget';
    }
    return 'https://tu-url-render.onrender.com/api/bitget'; // ← REEMPLAZA
}
```

Luego commit y push:
```bash
git add assets/js/bitget-api.js
git commit -m "chore: update Render proxy URL"
git push
```

#### **Paso 4: Usuario Accede a la App**

1. Abre `https://tu-usuario.github.io/Trading-Dome/`
2. Ve a **APIs** → Ingresa tus credenciales de Bitget:
   - API Key
   - API Secret
   - Passphrase
3. ¡Botón **Conectar** y listo!

### 💻 **Opción 2: Desarrollo Local**

```bash
# Clonar
git clone https://github.com/tu-usuario/Trading-Dome.git
cd Trading-Dome

# Instalar dependencias
npm install

# Crear archivo .env (opcional)
cp .env.example .env
# Nota: .env es OPCIONAL. Recomendamos que usuarios ingresen claves desde la app

# Servir en http://localhost:3000
npm start
```

Visita `http://localhost:3000` y sigue los pasos del Paso 4 anterior.

### 🔒 **Seguridad - Cómo Funciona el Proxy**

1. **Usuario ingresa credenciales** en el formulario (modal en UI)
2. **Frontend encripta** datos antes de enviar (opcional con CryptoJS)
3. **Frontend → Render Proxy** (HTTPS POST):
   ```json
   {
     "apiKey": "tu_key",
     "apiSecret": "tu_secret",
     "apiPassphrase": "tu_passphrase",
     "method": "GET",
     "path": "/api/v2/account/info",
     "params": {}
   }
   ```
4. **Render genera firma HMAC-SHA256** (credenciales seguras en servidor, no en cliente)
5. **Render → Bitget API** (con firma correcta)
6. **Respuesta regresa al cliente** (encriptada si es necesario)
7. **Cliente guarda en sessionStorage** (se borra al cerrar tab)

**Ventajas**:
- ✅ Credenciales NUNCA se envían directamente a Bitget desde el cliente
- ✅ Firma HMAC se genera en servidor (más seguro)
- ✅ Frontend no expone secretos
- ✅ No hay problemas CORS (proxy maneja)

## ✅ Checklist de Despliegue

### **Para Producción (Render + GitHub Pages)**

- [ ] **Backend (Render)**
  - [ ] Repository conectado en Render
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] CMC_API_KEY configurado (variable de entorno)
  - [ ] Servidor corriendo en `https://trading-dome-api.onrender.com` (o tu URL)
  - [ ] Health check funciona: `curl <TU_URL>/health`

- [ ] **Frontend (GitHub Pages)**
  - [ ] Settings → Pages → Deploy from branch (main)
  - [ ] Sitio publicado en `https://tu-usuario.github.io/Trading-Dome/`
  - [ ] Archivos estáticos accesibles (assets/css, assets/js, components/)

- [ ] **Conectar Frontend con Backend**
  - [ ] URL de Render actualizada en `bitget-api.js` (línea ~52)
  - [ ] `getProxyEndpoint()` retorna correcta URL de Render en producción
  - [ ] Cambios pusheados a GitHub

- [ ] **Testing Final**
  - [ ] Abre la app en GitHub Pages
  - [ ] Ingresa credenciales de Bitget en UI
  - [ ] Verifica en DevTools (F12) que las peticiones van a `/api/bitget`
  - [ ] Comprueba que Bitget retorna datos correctamente
  - [ ] Cierra la pestaña y abre de nuevo - claves fueron borradas ✅

## 🛠️ Estructura del Proyecto

```
trading-dome-dashboard/
├── index.html                    # Página principal
├── components/
│   ├── navigation.html          # Barra de navegación
│   └── sections/
│       ├── inicio.html          # Pestaña Inicio (gráficas)
│       ├── gestion-riesgo.html  # Calculadora de riesgo
│       ├── graficas.html        # Análisis de posiciones
│       ├── registro.html        # Datos de posiciones
│       ├── contacto.html        # Contacto
│       └── apicon.html          # Configuración de APIs
├── assets/
│   ├── css/
│   │   ├── main.css             # Estilos principales
│   │   ├── dark-mode.css        # Tema oscuro
│   │   ├── header.css           # Navegación
│   │   ├── panels.css           # Paneles
│   │   ├── charts.css           # Gráficas
│   │   └── responsive.css       # Responsive
│   ├── js/
│   │   ├── main.js              # Inicialización
│   │   ├── config.js            # Configuración
│   │   ├── components.js        # Carga de componentes
│   │   ├── bitget-api.js        # API Bitget y almacenamiento de credenciales
│   │   ├── bitget-positions.js  # Carga de posiciones
│   │   ├── bitget-charts.js     # Gráficas y estadísticas
│   │   ├── risk-calculator.js   # Calculadora de riesgo
│   │   ├── profiles.js          # Sistema de perfiles
│   │   ├── theme-manager.js     # Tema oscuro/claro
│   │   ├── cache.js             # Sistema de caché
│   │   ├── validators.js        # Validaciones
│   │   ├── error-handler.js     # Manejo de errores
│   │   ├── loading.js           # Indicadores de carga
│   │   ├── dominance.js         # Gráfica de dominancia (con soporte para CMC custom)
│   │   ├── tradingview-widget.js # Widget calendario económico (tema dinámico)
│   │   ├── components/
│   │   │   └── inicio-tv.js      # Widget gráfica avanzada TradingView (tema dinámico)
│   │   ├── sessionStorage-manager.js # Gestión encriptada de sesión
│   │   └── session-security.js  # Seguridad de sesión
│   └── images/                   # Imágenes y logos
├── favicon/                      # Iconos y manifests
├── netlify/
│   └── functions/
│       └── dominance.js         # Función serverless para CoinMarketCap
├── netlify.toml                 # Configuración Netlify
├── server.js                    # Servidor Express local
├── package.json                 # Dependencias
├── .env.example                 # Ejemplo de configuración
└── README.md                    # Este archivo
```

## 🔄 Versión Actual

## 🚀 **v2.7.0 - Widgets TradingView con Tema Dinámico**
**Fecha:** Noviembre 2025

### ✨ **Nuevas Características:**
- ✅ **Gráfica Avanzada TradingView**: Análisis técnico profesional en pestaña Inicio
  - Timeframe diario para BTCUSDT (Binance)
  - Indicadores y estudios técnicos incluidos
  - Cambio dinámico de símbolo disponible
- ✅ **Calendario Económico Dinámico**: Eventos económicos mundiales en pestaña Gráficas
  - Datos de mercados de 24 países
  - Filtros de importancia configurables
- ✅ **Tema Dinámico en Widgets TradingView**: Ambos widgets se actualizan sin recargar página
  - Gráfica: Recarga automática al cambiar a tema oscuro/claro
  - Calendario: Recarga automática al cambiar a tema oscuro/claro
  - Soporte para 3 mecanismos de detección: localStorage, data-bs-theme, polling

### 🔧 **Cambios Técnicos:**
- ✅ `assets/js/components/inicio-tv.js`: Widget de gráfica avanzada con detección de tema
- ✅ `assets/js/tradingview-widget.js`: Actualizado con soporte para tema dinámico
- ✅ `components/sections/inicio.html`: Nuevo contenedor para gráfica avanzada
- ✅ Soporte para tema oscuro/claro en ambos widgets sin recargar página

### 📋 **Mejoras:**
- ✅ Herramienta de trading de primer nivel con análisis profesional
- ✅ Experiencia de usuario mejorada con widgets responsivos
- ✅ Performance optimizado con recarga solo de widgets (no de página)

## 🚀 **v2.6.0 - Seguridad de API Keys y Correcciones Críticas**
**Fecha:** Noviembre 2024

### ✨ **Nuevas Características:**
- ✅ **CoinMarketCap Dinámico**: Los usuarios ingresan su propia API key en la UI
- ✅ **SessionStorage Encriptado**: Todas las credenciales se guardan solo en la sesión
- ✅ **Soporte para .env Opcional**: Mantiene backwards compatibility con configuración en servidor
- ✅ **Sistema de Alertas Mejorado**: Calculadora de riesgo con validación precisa

### 🔧 **Cambios Técnicos:**
- ✅ `server.js`: Ahora acepta CMC API key como parámetro de query
- ✅ `netlify/functions/dominance.js`: Soporte para query parameters
- ✅ `assets/js/dominance.js`: Obtiene clave de CMC desde sessionStorage encriptado
- ✅ `assets/js/risk-calculator.js`: Corrección de precisión flotante en comparaciones
- ✅ `assets/js/bitget-api.js`: Validación mejorada de formularios de API

### 🐛 **Bugs Corregidos:**
- ✅ Alarma de Riesgo/Beneficio con lógica incorrecta (ahora usa < en lugar de <=)
- ✅ Pérdida mostrando valor constante en lugar de recalcular
- ✅ Problema de precisión flotante con comparaciones de números decimales
- ✅ Campo de estado de conexión API faltante en HTML
- ✅ Botón Conectar sin manejador de eventos

### 📋 **Migraciones:**
- ✅ Cambio de nombre: Crystal Sphere → Trading Dome Dashboard
- ✅ API keys ya no se guardan en localStorage persistente
- ✅ API keys se guardan en sessionStorage encriptado (solo durante la sesión)
- ✅ Compatibilidad hacia atrás con archivos `.env` existentes

## 🔌 Endpoints y APIs

### 🌐 **Arquitectura de Endpoints**

#### **Backend - Proxy en Render** (`/api/bitget`)
- **Método**: POST
- **URL**: `https://trading-dome-api.onrender.com/api/bitget` (reemplaza con tu URL)
- **Propósito**: Reenvía peticiones a Bitget con firma HMAC

**Request**:
```json
{
  "apiKey": "string",
  "apiSecret": "string",
  "apiPassphrase": "string",
  "method": "GET|POST|DELETE",
  "path": "/api/v2/...",
  "params": {},
  "body": ""
}
```

**Response**: Respuesta exacta de Bitget API

#### **Health Check**
- **GET** `/health` - Verifica que el servidor está funcionando
- **Response**: `{ "status": "OK", "timestamp": "...", "port": 3000 }`

### 🔓 **APIs Públicas Usadas (Sin autenticación)**
- **Alternative.me** - Fear & Greed Index
  - Endpoint: `https://api.alternative.me/fng/`
  
- **Binance** - Funding Rate
  - Endpoint: `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT`

### 🔑 **API Dinámica (Usuario configurable)**
- **CoinMarketCap** - Dominance Data
  - Proxy: `/api/global-metrics?key=YOUR_CMC_API_KEY`
  - Requiere: CMC_API_KEY del usuario (ingresado en UI)

### 🎯 **Bitget API (Reenvía mediante Proxy)**
- Base Remota: `https://api.bitget.com`
- Ejemplos de endpoints:
  - `GET /api/v2/mix/position/history-position` - Historial de posiciones
  - `GET /api/v2/account/info` - Información de cuenta
- Autenticación: HMAC-SHA256 (generada en servidor)

## 📚 Troubleshooting

### **Error: CORS en Console**
- **Causa**: El proxy de Render no está respondiendo
- **Solución**: Verifica que Render está corriendo y la URL es correcta

### **Error: 401 Unauthorized**
- **Causa**: Credenciales de Bitget inválidas
- **Solución**: Revisa que API Key, Secret y Passphrase sean correctos en Bitget

### **Error: Cannot GET /health**
- **Causa**: El servidor backend no está ejecutándose
- **Solución**: En desarrollo local, ejecuta `npm start`

### **Las posiciones no cargan**
- **Causa**: Credenciales no ingresadas o conexión fallida
- **Solución**:
  1. Ve a **APIs** y revisa el estado de conexión
  2. Prueba de nuevo en **Posiciones**
  3. Revisa console (F12) para más detalles

## 🔄 Historial de Versiones

### 🚀 **v2.5.0 - Integración Bitget Professional**
- ✅ Dashboard de movimientos con estadísticas
- ✅ Análisis profesional con 7 gráficas
- ✅ Calculadora de riesgo mejorada
- ✅ Exportación a PDF

### 🚀 **v2.0.0 - Transición a Arquitectura de Tiempo Real**
- ✅ Eliminación del VIX
- ✅ Simplificación de datos
- ✅ Timestamps en tiempo real

## 🎯 Guía del Usuario - Paso a Paso

### **Para Usar la App en Producción**

#### **Paso 1: Obtén tus credenciales de Bitget** 🔑
1. Ve a [Bitget.com/es](https://www.bitget.com/es) → Inicia sesión
2. Menú de usuario → **Configuración** → **API**
3. Haz clic en **Crear API**
4. Copia y guarda en un lugar seguro:
   - **API Key**
   - **API Secret**
   - **Passphrase**
5. ⚠️ **IMPORTANTE**: NO compartas estas claves con nadie

#### **Paso 2: Abre la App** 🚀
1. Ve a `https://tu-usuario.github.io/Trading-Dome/` (tu URL de GitHub Pages)
2. ¡La app se abre en tu navegador!

#### **Paso 3: Configura Bitget** ⚙️
1. Ve a la pestaña **APIs** (ícono de enchufe 🔌)
2. Rellena los campos:
   - **API Key**: Pega tu API Key de Bitget
   - **API Secret**: Pega tu API Secret
   - **Passphrase**: Pega tu Passphrase
3. Haz clic en **Conectar** ✅

#### **Paso 4: ¡Listo para usar!** 🎉
1. Ve a **Posiciones** para ver tu historial de trades
2. Ve a **Gráficas** para análisis de P&L
3. Usa **Calculadora de Riesgo** para nuevas operaciones

### **Seguridad**
- ✅ Tus claves **NUNCA** se guardan en el navegador después de cerrar la pestaña
- ✅ Se usan **SOLO durante tu sesión actual**
- ✅ Se envían de forma segura al servidor con firma HMAC
- ✅ El servidor NO almacena tus claves

### **¿Qué pasa si cierro la pestaña o actualizo?**
- Deberás ingresar tus claves nuevamente (por seguridad)
- Es normal y esperado
- Tus claves NUNCA se almacenan

---

## 🔧 Guía de Uso Técnica (Para Desarrolladores)

### 1️⃣ **Desarrollo Local**
```bash
npm start
# Visita http://localhost:3000
# El proxy local (server.js) está en el puerto 3000
```

### 2️⃣ **Testing - Comprobar Conexión Proxy**
```bash
# Verificar que el proxy está activo
curl http://localhost:3000/health
# Respuesta esperada: { "status": "OK", ... }
```

### 3️⃣ **Observar Logs**
- Abre DevTools (F12) en el navegador
- Pestaña **Console** para logs de frontend
- Terminal donde ejecutas `npm start` para logs de backend

## 🤝 Contribuir

### 💡 Proceso
1. Fork del repositorio
2. Crear branch: `git checkout -b feature/mi-feature`
3. Commits descriptivos
4. Push y Pull Request

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles

## 👨‍💻 Desarrollador

**Mike Sobrado** - Full Stack Developer

## 🙏 Agradecimientos

- **Bitget** - Exchange y API
- **CoinMarketCap** - Datos de dominancia
- **Binance** - Funding rates
- **Alternative.me** - Fear & Greed Index
- **TradingView** - Economic Calendar
- **Chart.js** - Gráficas
- **Bootstrap** - Framework CSS
- **html2pdf.js** - Exportación PDF
- **CryptoJS** - Encriptación de credenciales

---

⭐ **¡Dale una estrella si te gusta!** ⭐
