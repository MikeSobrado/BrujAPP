# 📊 Mike Trading Dashboard - Platform de Trading Profesional

Una aplicación web moderna para análisis de mercados financieros con integración directa a Bitget, indicadores técnicos avanzados, gestión de riesgo profesional y herramientas de análisis completas.

## 🚀 Características Principales

### 📈 Análisis Técnico
- **🧠 Fear & Greed Index** - Índice de sentimiento del mercado crypto (Alternative.me)
- **⚡ Bitcoin Funding Rate** - Tasas de financiación en tiempo real (Binance)
- **🥇 Dominancia de Criptomonedas** - BTC/ETH/Otros (CoinMarketCap)
- **📅 Calendario Económico** - Eventos económicos mundiales (TradingView)

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

### ☁️ **Opción 1: Netlify (Recomendada para Producción)**

1. Push a tu repositorio GitHub
2. Conecta en [Netlify](https://netlify.com)
3. ¡Listo! Deploy automático desde GitHub
4. Usuarios pueden ingresar sus propias claves de API en la app

### 💻 **Opción 2: Desarrollo Local**
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/mike-trading-dashboard.git
cd mike-trading-dashboard

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
# Nota: El .env es OPCIONAL. Si no lo configuras, 
# los usuarios pueden ingresar claves desde la app

# Servir localmente (http://localhost:3000)
npm start
```

Visita `http://localhost:3000` en tu navegador.

## 🛠️ Estructura del Proyecto

```
mike-trading-dashboard/
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
│   │   ├── tradingview-widget.js # Widget económico
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
- ✅ Cambio de nombre: Crystal Sphere → Mike Trading Dashboard
- ✅ API keys ya no se guardan en localStorage persistente
- ✅ API keys se guardan en sessionStorage encriptado (solo durante la sesión)
- ✅ Compatibilidad hacia atrás con archivos `.env` existentes

## 🔌 Endpoints y APIs

### 🔓 **APIs Públicas (Sin autenticación)**
- **Alternative.me** - Fear & Greed Index
  - Endpoint: `https://api.alternative.me/fng/`
  
- **Binance** - Funding Rate
  - Endpoint: `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT`

### 🔑 **API Dinámica (Usuario configurable)**
- **CoinMarketCap** - Dominance Data
  - Endpoint: `/api/global-metrics?key=YOUR_CMC_API_KEY`
  - Requiere: CMC_API_KEY del usuario (ingresado en la UI o en .env)
  - Proxy: Servidor local o Netlify Functions

### 🎯 **Bitget API (Local - Usuario)**
- Base: `https://api.bitget.com`
- Endpoints: `/mix/v1/order/orders` (Movimientos cerrados)
- Autenticación: Local (almacenada encriptada en sessionStorage)

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

## 🔧 Guía de Uso Rápida

### 1️⃣ **Primera Vez**
- Abre la app en `http://localhost:3000`
- Ve a **APIs** (pestaña)
- Ingresa tus credenciales de Bitget y CoinMarketCap

### 2️⃣ **Cargar Movimientos**
- Botón **Conectar** en APIs guardará tus credenciales
- Ve a **Posiciones**
- Se descarga el historial de Bitget automáticamente

### 3️⃣ **Analizar**
- **Posiciones**: Tabla y estadísticas de tus trades
- **Gráficas**: Pestaña análisis con 7 gráficas
- **Calculadora**: En Gestión de Riesgo, usa tus parámetros

### 4️⃣ **Guardar Configuración**
- Crea perfiles: Menú de Configuración
- Cada perfil guarda: dashboard + calculadora + indicadores
- Los perfiles se sincronizan automáticamente

### 5️⃣ **Exportar Reporte**
- Botón **Exportar PDF** en Posiciones
- Incluye estadísticas y tabla de movimientos
- Listo para presentar o archivar

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
