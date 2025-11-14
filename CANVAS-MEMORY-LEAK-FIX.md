# Fix: Canvas Memory Leak después de Auto-Logout

## Problema Identificado
Después del auto-logout tras 1 minuto de inactividad:
- Los datos desaparecían visualmente (contenedores se vaciaban)
- Al pasar el ratón por encima del área de Monitoreo, los gráficos reaparecían
- **Causa raíz**: Los datos de los gráficos estaban en memoria (instancias de Chart.js, variables globales) pero no se estaban destruyendo completamente

## Solución Implementada

### 1. **bitget-charts.js** - Agregar método `clearAll()` a BitgetChartsManager

Se agregó un nuevo método a la clase para destruir y limpiar completamente:

```javascript
clearAll() {
    // 1. Destruir todos los charts de Chart.js
    const chartKeys = Object.keys(this.charts);
    chartKeys.forEach(key => {
        if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
            this.charts[key].destroy();
            this.charts[key] = null;
        }
    });
    
    // 2. Limpiar referencias en memoria
    this.charts = {};
    this.positions = [];
    
    // 3. Limpiar canvas del DOM
    const canvases = document.querySelectorAll('#monitoreo canvas');
    canvases.forEach(canvas => {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    });
}
```

**Efecto**: 
- ✅ Destruye instancias de Chart.js (Equity Curve, P&L, etc.)
- ✅ Limpia datos en memoria (this.positions)
- ✅ Borra el contexto visual de los canvas

### 2. **dominance.js** - Agregar función `clearDominanceData()`

Se agregó una función global para limpiar el gráfico de dominancia:

```javascript
window.clearDominanceData = function() {
    // 1. Destruir Chart.js instance
    if (dominanceChart) {
        dominanceChart.destroy();
        dominanceChart = null;
    }
    
    // 2. Limpiar canvas
    const ctx = document.getElementById('dominanceChart').getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    // 3. Limpiar HTML del contenedor
    document.getElementById('dominance-container').innerHTML = '';
}
```

**Efecto**:
- ✅ Destruye instancia de Chart.js para dominancia BTC/ETH
- ✅ Limpia el canvas visualmente
- ✅ Limpia el contenedor HTML

### 3. **charts-market.js** - Agregar función `clearMarketCharts()`

Se agregó una función global para limpiar gráficos de mercado (Fear/Greed, Funding Rate):

```javascript
window.clearMarketCharts = function() {
    // 1. Destruir Fear/Greed Chart
    if (fearGreedChart) {
        fearGreedChart.destroy();
        fearGreedChart = null;
    }
    
    // 2. Destruir Funding Rate Chart
    if (fundingChart) {
        fundingChart.destroy();
        fundingChart = null;
    }
    
    // 3. Limpiar canvas
    // ... (clearRect para ambos canvas)
}
```

**Efecto**:
- ✅ Destruye Chart.js instances para Fear/Greed
- ✅ Destruye Chart.js instance para Funding Rate
- ✅ Limpia visualmente los canvas

### 4. **session-security.js** - Actualizar función de auto-logout

Se agregó llamadas a las tres funciones de limpieza cuando expira la sesión:

```javascript
function handleInactivityLogout() {
    // ... limpieza existente ...
    
    // NUEVO: Limpiar BitgetCharts (Monitoreo)
    if (typeof window.BitgetCharts !== 'undefined' && window.BitgetCharts.clearAll) {
        window.BitgetCharts.clearAll();
    }
    
    // NUEVO: Limpiar Dominancia
    if (typeof window.clearDominanceData === 'function') {
        window.clearDominanceData();
    }
    
    // NUEVO: Limpiar Market Charts
    if (typeof window.clearMarketCharts === 'function') {
        window.clearMarketCharts();
    }
}
```

**Flujo completo de limpieza:**
1. sessionStorage.clear() → elimina datos cifrados
2. window.cache.clear() → elimina caché en memoria
3. window.currentPositions = [] → limpia posiciones
4. window.BitgetCharts.clearAll() → destruye gráficos de monitoreo ✅ NUEVO
5. window.clearDominanceData() → destruye gráfico de dominancia ✅ NUEVO
6. window.clearMarketCharts() → destruye gráficos de mercado ✅ NUEVO
7. Limpiar canvas del DOM → clearRect()
8. Resetear flags de componentes

## Verificación

Para verificar que funciona correctamente:

1. Conecta a la API en la pestaña "APIs"
2. Ve a la pestaña "Monitoreo" y espera a que carguen los gráficos
3. Espera 1 minuto sin actividad
4. El auto-logout debe ocurrir → alert
5. Verifica que:
   - ✅ Los gráficos desaparecen visualmente
   - ✅ Al pasar el ratón, NO reaparecen (fueron destruidos)
   - ✅ En la consola, ves `[CHARTS-CLEAR] ✅ BitgetCharts limpiado completamente`
   - ✅ No hay advertencias de memoria leak

## Logs en Consola

Cuando ocurre auto-logout, deberías ver:

```
⏰ SESIÓN CERRADA: Inactividad por 1 minuto
🧹 Limpiando datos en BitgetCharts...
[CHARTS-CLEAR] 🧹 Limpiando BitgetCharts...
[CHARTS-CLEAR] 🔥 Destruyendo chart: equityCurve
[CHARTS-CLEAR] 🔥 Destruyendo chart: pnlBars
[CHARTS-CLEAR] 🔥 Destruyendo chart: longVsShort
[CHARTS-CLEAR] 🧹 Limpiando datos en Dominancia...
[DOMINANCE-CLEAR] 🧹 Limpiando datos de dominancia...
[DOMINANCE-CLEAR] 🔥 Gráfico de dominancia destruido
🧹 Limpiando gráficos de mercado...
[MARKET-CHARTS-CLEAR] 🧹 Limpiando datos de gráficos de mercado...
[MARKET-CHARTS-CLEAR] 🔥 Fear/Greed Chart destruido
[MARKET-CHARTS-CLEAR] 🔥 Funding Rate Chart destruido
✅ Sesión limpiada por seguridad
```

## Archivos Modificados

- ✅ `assets/js/bitget-charts.js` - Agregado método `clearAll()`
- ✅ `assets/js/dominance.js` - Agregada función `clearDominanceData()`
- ✅ `assets/js/charts-market.js` - Agregada función `clearMarketCharts()`
- ✅ `assets/js/session-security.js` - Llamadas a las 3 funciones de limpieza

## Notas Técnicas

### ¿Por qué pasaba esto?
- Chart.js crea instancias que persisten en memoria (`window.BitgetCharts`, `dominanceChart`, `fearGreedChart`)
- Si los canvas no se limpian completamente, el navegador puede "re-renderizar" basado en datos en caché
- El hover event podría estar disparando un re-render desde datos residuales

### ¿Por qué se soluciona así?
- `chart.destroy()` es el método oficial de Chart.js para liberar memoria
- `ctx.clearRect()` limpia visualmente el canvas
- Resetear variables globales asegura que no hay referencias residuales
- Llamar esto en auto-logout garantiza que se limpia todo

### Próximas mejoras (opcional)
- Crear un manager único para todos los charts (como se hizo con BitgetCharts)
- Usar WeakMap para referencias de gráficos para garbage collection automático
- Agregar validación en renderización para no renderizar si no hay datos
