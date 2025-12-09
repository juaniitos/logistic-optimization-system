# Configuración de Google Maps API

## ⚠️ IMPORTANTE: API Key Inválida

La API key que estaba en el código **NO FUNCIONA** porque:
- Es una key de ejemplo/demo que está restringida
- Google requiere que cada usuario tenga su propia key
- Es GRATIS para desarrollo (incluye $200 USD de crédito mensual)

## 🚀 SOLUCIÓN RÁPIDA: Obtén tu API Key en 5 minutos

### Paso 1: Crear Cuenta en Google Cloud
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Acepta los términos de servicio

### Paso 2: Crear Proyecto
1. Haz clic en el menú desplegable de proyectos (arriba a la izquierda)
2. Click en "NEW PROJECT"
3. Nombre del proyecto: `Logistic-Solution`
4. Click en "CREATE"
5. Espera unos segundos a que se cree

### Paso 3: Habilitar Maps JavaScript API
1. En el menú lateral, ve a: **APIs & Services** → **Library**
2. Busca: `Maps JavaScript API`
3. Click en el resultado
4. Click en botón azul **ENABLE**
5. Espera a que se active (10-20 segundos)

### Paso 4: Crear API Key
1. Ve a: **APIs & Services** → **Credentials**
2. Click en **+ CREATE CREDENTIALS** (arriba)
3. Selecciona **API Key**
4. Se generará tu key - **¡CÓPIALA!**
5. Click en "RESTRICT KEY" (recomendado)

### Paso 5: Configurar Restricciones (Recomendado)
1. En "API restrictions":
   - Selecciona "Restrict key"
   - Marca solo: **Maps JavaScript API**
2. En "Application restrictions":
   - Selecciona "HTTP referrers (web sites)"
   - Click "ADD AN ITEM"
   - Agrega: `http://localhost:5173/*`
   - Click "DONE"
3. Click **SAVE**

### Paso 6: Configurar Facturación (Requerido pero GRATIS)
1. Ve al menú → **Billing**
2. Click en "LINK A BILLING ACCOUNT"
3. Ingresa datos de tarjeta (NO se cobrará automáticamente)
4. Google da $200 USD gratis cada mes
5. ~28,000 cargas de mapa gratis/mes

### Paso 7: Reemplazar la Key en el Código

**Opción A: Usar Google Maps (Recomendado)**

Abre: `frontend/src/components/GoogleMapFullscreen.jsx`

Busca la línea 67 aproximadamente:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dN41XN0hWD0e8Q&loading=async`
```

Reemplaza con tu key:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=TU_API_KEY_AQUI&loading=async`
```

Luego en `frontend/src/pages/RoutesOptimization.jsx`, cambia el import del Modal para usar GoogleMapFullscreen de nuevo.

**Opción B: Seguir usando OpenStreetMap (Actual)**

Ya está configurado y funcionando. No necesitas hacer nada.

## 📊 Comparación

| Característica | Google Maps | OpenStreetMap (Leaflet) |
|----------------|-------------|-------------------------|
| **Costo** | $200 gratis/mes | Totalmente gratis |
| **Velocidad** | Muy rápido | Rápido |
| **Calidad** | Excelente | Muy buena |
| **Rutas reales** | ✅ Con Directions API | ✅ Con OSRM |
| **Setup** | Requiere API Key | Sin configuración |
| **Límites** | 28,000 cargas/mes | Ilimitado |

## 🎯 Recomendación

**Para DEMO/DESARROLLO**: Usa OpenStreetMap (ya está funcionando)

**Para PRODUCCIÓN**: Usa Google Maps con tu propia API Key

## ❓ Problemas Comunes

**"InvalidKeyMapError"**
- Tu API key no es válida
- Verifica que Maps JavaScript API esté habilitada
- Revisa las restricciones de la key

**"This page can't load Google Maps correctly"**
- Falta configurar facturación
- API Key mal copiada (espacios extra)
- Restricciones muy estrictas

**"RefererNotAllowedMapError"**
- Agrega tu dominio en las restricciones
- Para desarrollo local: `http://localhost:5173/*`

## 📞 Soporte

- Documentación oficial: https://developers.google.com/maps/documentation/javascript/get-api-key
- Errores comunes: https://developers.google.com/maps/documentation/javascript/error-messages
- Facturación: https://cloud.google.com/maps-platform/pricing

## 🔐 Seguridad

⚠️ **NUNCA** compartas tu API Key en:
- Repositorios públicos de GitHub
- Capturas de pantalla
- Mensajes públicos

✅ Usa variables de entorno para producción:
```javascript
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
```
