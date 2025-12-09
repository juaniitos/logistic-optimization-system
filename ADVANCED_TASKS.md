# Guía de Tareas Avanzadas - Sistema de Optimización Logística UPSE

## 📋 Índice

1. [Tarea 3: Entrenar Modelos de ML](#tarea-3-entrenar-modelos-de-ml)
2. [Tarea 4: Algoritmos de Optimización Avanzados](#tarea-4-algoritmos-de-optimización-avanzados)
3. [Tarea 5: Configurar PostgreSQL con Docker](#tarea-5-configurar-postgresql-con-docker)

---

## Tarea 3: Entrenar Modelos de ML

### 📓 Notebook de Entrenamiento

Se ha creado un notebook completo en `notebooks/demand_forecasting.ipynb` que implementa:

#### 🤖 Modelos Implementados:

1. **Prophet** (Facebook)
   - Modelo de series temporales
   - Detecta estacionalidades automáticamente
   - Robusto a datos faltantes

2. **ARIMA**
   - Modelo estadístico clásico
   - Análisis de autocorrelación
   - Predicciones a corto plazo

3. **Random Forest**
   - Machine Learning con features temporales
   - Características: día semana, mes, lags, medias móviles
   - Importancia de características

### 🚀 Cómo Ejecutar

#### Opción 1: Jupyter Notebook

```powershell
# Activar entorno virtual
cd backend
.\venv\Scripts\Activate.ps1

# Instalar Jupyter (si no está instalado)
pip install jupyter notebook ipykernel

# Registrar kernel
python -m ipykernel install --user --name=logistic_env

# Abrir Jupyter
jupyter notebook ../notebooks/demand_forecasting.ipynb
```

#### Opción 2: VS Code

1. Abre `notebooks/demand_forecasting.ipynb` en VS Code
2. Selecciona el kernel de Python (venv)
3. Ejecuta todas las celdas: `Ctrl+Shift+P` → "Run All"

### 📊 Resultados del Entrenamiento

El notebook genera:

- ✅ **Modelos entrenados** guardados en `data/models/`
  - `prophet_model.pkl`
  - `arima_model.pkl`
  - `random_forest_model.pkl`
  - `models_metadata.json` (métricas y configuración)

- 📈 **Visualizaciones**:
  - Demanda histórica por producto y bodega
  - Predicciones vs valores reales
  - Componentes de estacionalidad
  - Importancia de características
  - Gráficos de convergencia

- 📝 **Métricas de evaluación**:
  - MAE (Mean Absolute Error)
  - RMSE (Root Mean Squared Error)
  - R² Score

- 🔮 **Predicciones futuras**:
  - 30 días de predicción
  - Intervalos de confianza
  - Guardadas en la base de datos

### 🔗 Integración con la API

Los modelos pueden cargarse y usarse en el endpoint existente:

```python
GET /api/analytics/demand-forecast
Parameters:
  - product_id: int
  - warehouse_id: int
  - forecast_days: int (default: 30)
```

---

## Tarea 4: Algoritmos de Optimización Avanzados

### 🧬 Algoritmos Implementados

#### 1. Algoritmo Genético (Genetic Algorithm)

**Archivo**: `backend/app/services/genetic_algorithm.py`

**Características**:
- Resuelve el Vehicle Routing Problem (VRP)
- Población de soluciones que evoluciona
- Operadores: Selección por torneo, Cruce (OX), Mutación
- Elitismo para preservar mejores soluciones

**Parámetros configurables**:
```python
- population_size: 100  # Tamaño de la población
- generations: 200      # Número de generaciones
- mutation_rate: 0.1    # Tasa de mutación
- crossover_rate: 0.8   # Tasa de cruce
- elite_size: 10        # Mejores a preservar
```

#### 2. Simulated Annealing (Recocido Simulado)

**Archivo**: `backend/app/services/simulated_annealing.py`

**Características**:
- Optimización de ruta TSP (Traveling Salesman Problem)
- Acepta soluciones peores con probabilidad decreciente
- Usa 2-opt para generar vecinos

**Parámetros configurables**:
```python
- initial_temperature: 1000.0   # Temperatura inicial
- cooling_rate: 0.95            # Tasa de enfriamiento
- min_temperature: 1.0          # Temperatura mínima
- max_iterations: 100           # Iteraciones por temp
```

#### 3. 2-opt Optimizer

**Archivo**: `backend/app/services/simulated_annealing.py`

**Características**:
- Mejora local de rutas TSP
- Invierte segmentos de la ruta sistemáticamente
- Rápido y efectivo para refinar soluciones

**Parámetros configurables**:
```python
- max_iterations: 1000  # Iteraciones sin mejora
```

### 🌐 Endpoints de la API

Los algoritmos están disponibles en `/api/analytics`:

#### 1. Algoritmo Genético

```http
POST /api/analytics/optimize/genetic-algorithm
Content-Type: application/json

{
  "num_vehicles": 3,
  "population_size": 100,
  "generations": 200
}
```

**Respuesta**:
```json
{
  "success": true,
  "algorithm": "Genetic Algorithm",
  "result": {
    "total_distance": 245.67,
    "num_vehicles": 3,
    "routes": [
      {
        "vehicle_id": 1,
        "warehouses": [0, 2, 4],
        "warehouse_names": ["Bodega Central", "..."],
        "distance": 85.23
      }
    ],
    "convergence_history": [...]
  }
}
```

#### 2. Simulated Annealing

```http
POST /api/analytics/optimize/simulated-annealing
Content-Type: application/json

{
  "start_warehouse_id": 1,
  "initial_temperature": 1000.0,
  "cooling_rate": 0.95
}
```

#### 3. 2-opt

```http
POST /api/analytics/optimize/two-opt
Content-Type: application/json

{
  "initial_route": [1, 2, 3, 4, 5],
  "max_iterations": 1000
}
```

#### 4. Comparar Algoritmos

```http
GET /api/analytics/optimize/compare?num_vehicles=3
```

**Respuesta**:
```json
{
  "algorithms": {
    "genetic_algorithm": {...},
    "simulated_annealing": {...},
    "two_opt": {...}
  },
  "summary": {
    "best_algorithm": "simulated_annealing",
    "best_distance": 234.56
  }
}
```

### 🧪 Probar Algoritmos

#### Desde la Documentación Interactiva

1. Abre http://localhost:8000/api/docs
2. Navega a **Analytics** → **optimize**
3. Prueba cada endpoint

#### Desde cURL (PowerShell)

```powershell
# Algoritmo Genético
curl -X POST "http://localhost:8000/api/analytics/optimize/genetic-algorithm" `
  -H "Content-Type: application/json" `
  -d '{\"num_vehicles\": 3, \"population_size\": 100, \"generations\": 200}'

# Simulated Annealing
curl -X POST "http://localhost:8000/api/analytics/optimize/simulated-annealing" `
  -H "Content-Type: application/json" `
  -d '{\"initial_temperature\": 1000.0, \"cooling_rate\": 0.95}'

# 2-opt
curl -X POST "http://localhost:8000/api/analytics/optimize/two-opt" `
  -H "Content-Type: application/json" `
  -d '{\"max_iterations\": 1000}'

# Comparar todos
curl "http://localhost:8000/api/analytics/optimize/compare?num_vehicles=3"
```

### 📊 Comparación de Algoritmos

| Algoritmo | Tipo | Ventajas | Desventajas | Mejor Para |
|-----------|------|----------|-------------|------------|
| **Genetic Algorithm** | Metaheurística | Multi-vehículo, explora ampliamente | Lento, muchos parámetros | VRP complejo |
| **Simulated Annealing** | Metaheurística | Balance exploración/explotación | Sensible a temperatura | TSP mediano |
| **2-opt** | Heurística local | Rápido, simple | Solo mejora local | Refinar rutas |

---

## Tarea 5: Configurar PostgreSQL con Docker

### 🐳 Levantar Servicios con Docker

El archivo `docker-compose.yml` ya está configurado con:
- **PostgreSQL 15** (puerto 5432)
- **Redis 7** (puerto 6379)
- **Backend API** (puerto 8000)

#### 1. Iniciar PostgreSQL y Redis

```powershell
# Desde la raíz del proyecto
docker-compose up -d postgres redis
```

**Verificar que están corriendo**:

```powershell
docker-compose ps
```

Deberías ver:
```
NAME                 STATUS    PORTS
logistic_db          Up        0.0.0.0:5432->5432/tcp
logistic_redis       Up        0.0.0.0:6379->6379/tcp
```

#### 2. Verificar Salud de PostgreSQL

```powershell
# Ver logs
docker-compose logs postgres

# Conectar a PostgreSQL
docker exec -it logistic_db psql -U logistic_user -d logistic_db
```

Dentro de psql:
```sql
-- Listar bases de datos
\l

-- Ver tablas (después de la migración)
\dt

-- Salir
\q
```

### 🔄 Migrar Datos de SQLite a PostgreSQL

Se ha creado un script automatizado: `backend/migrate_to_postgres.py`

#### Ejecutar Migración

```powershell
# Desde backend/
cd backend
.\venv\Scripts\Activate.ps1

# Ejecutar script de migración
python migrate_to_postgres.py
```

El script:
1. ✅ Conecta a SQLite y PostgreSQL
2. ✅ Crea todas las tablas en PostgreSQL
3. ✅ Migra datos respetando relaciones (foreign keys)
4. ✅ Verifica la migración
5. ✅ Muestra resumen de registros migrados

**Ejemplo de salida**:

```
╔══════════════════════════════════════════════════════════════╗
║     MIGRACIÓN SQLite → PostgreSQL                            ║
║     Sistema de Optimización Logística - UPSE                 ║
╚══════════════════════════════════════════════════════════════╝

📂 Conectando a SQLite...
🐘 Conectando a PostgreSQL...
🏗️  Creando tablas en PostgreSQL...

📦 Migrando Users...
   ✅ 1 registros migrados

📦 Migrando Warehouses...
   ✅ 5 registros migrados

📦 Migrando Products...
   ✅ 8 registros migrados

[...]

============================================================
📊 RESUMEN DE MIGRACIÓN
============================================================
   Users: 1 registros
   Warehouses: 5 registros
   Products: 8 registros
   Inventory Items: 40 registros
   Vehicles: 13 registros
   Routes: 5 registros
   Demands: 480 registros
============================================================
   TOTAL: 552 registros migrados
============================================================

✅ Migración completada exitosamente!

🔍 Verificando migración...
[...]
```

### ⚙️ Configurar Backend para PostgreSQL

#### 1. Actualizar `app/config.py`

```python
# Cambiar de SQLite a PostgreSQL
DATABASE_URL = "postgresql+psycopg://logistic_user:logistic_pass@localhost:5432/logistic_db"

# O usar variable de entorno
import os
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://logistic_user:logistic_pass@localhost:5432/logistic_db"
)
```

#### 2. Instalar Driver PostgreSQL

```powershell
pip install psycopg[binary]
```

#### 3. Reiniciar Backend

```powershell
# Detener backend actual (Ctrl+C)

# Reiniciar con PostgreSQL
python -m uvicorn main:app --reload --port 8000
```

### ✅ Verificar Funcionamiento

#### 1. Verificar Conexión

Los logs del backend deben mostrar:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Sin errores de conexión a base de datos**.

#### 2. Probar Endpoints

```powershell
# Obtener bodegas
curl http://localhost:8000/api/inventory/warehouses

# Obtener productos
curl http://localhost:8000/api/inventory/products

# Dashboard
curl http://localhost:8000/api/analytics/dashboard
```

#### 3. Verificar Autenticación

```powershell
# Login
curl -X POST "http://localhost:8000/api/auth/login" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=admin&password=admin123"
```

Deberías recibir un token JWT.

### 🔧 Solución de Problemas

#### PostgreSQL no inicia

```powershell
# Ver logs detallados
docker-compose logs postgres

# Reiniciar contenedor
docker-compose restart postgres

# Recrear contenedor
docker-compose down
docker-compose up -d postgres
```

#### Error de conexión desde backend

Verifica:
1. ✅ PostgreSQL está corriendo: `docker-compose ps`
2. ✅ Puerto 5432 no está ocupado: `netstat -an | findstr 5432`
3. ✅ Credenciales en config.py coinciden con docker-compose.yml
4. ✅ Firewall no bloquea la conexión

#### Error de migración

```powershell
# Resetear PostgreSQL
docker-compose down
docker volume rm logistic_sol_postgres_data
docker-compose up -d postgres

# Ejecutar migración nuevamente
python migrate_to_postgres.py
```

### 📊 Ventajas de PostgreSQL vs SQLite

| Característica | SQLite | PostgreSQL |
|----------------|--------|------------|
| **Concurrencia** | ❌ Limitada | ✅ Excelente |
| **Transacciones** | ⚠️ Básicas | ✅ ACID completas |
| **Escalabilidad** | ❌ 1-100 usuarios | ✅ 1000+ usuarios |
| **Tipos de datos** | ⚠️ Limitados | ✅ Avanzados (JSON, arrays) |
| **Índices** | ✅ Sí | ✅ Avanzados (GiST, GIN) |
| **Replicación** | ❌ No | ✅ Streaming, lógica |
| **Backup** | ⚠️ Copiar archivo | ✅ pg_dump, WAL |

### 🚀 Comandos Útiles

```powershell
# Ver todos los servicios
docker-compose ps

# Logs en tiempo real
docker-compose logs -f postgres

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Reiniciar solo PostgreSQL
docker-compose restart postgres

# Ejecutar comando SQL
docker exec -it logistic_db psql -U logistic_user -d logistic_db -c "SELECT COUNT(*) FROM warehouses;"
```

---

## 📝 Checklist de Tareas

### ✅ Tarea 3: Modelos de ML

- [x] Notebook `demand_forecasting.ipynb` creado
- [ ] Ejecutar notebook completo
- [ ] Verificar modelos guardados en `data/models/`
- [ ] Revisar métricas de evaluación
- [ ] Verificar predicciones en base de datos

### ✅ Tarea 4: Algoritmos de Optimización

- [x] `genetic_algorithm.py` implementado
- [x] `simulated_annealing.py` implementado
- [x] Endpoints en `/api/analytics/optimize/*` creados
- [ ] Probar Algoritmo Genético desde API
- [ ] Probar Simulated Annealing desde API
- [ ] Probar 2-opt desde API
- [ ] Comparar resultados de algoritmos

### ⏳ Tarea 5: PostgreSQL con Docker

- [x] `docker-compose.yml` configurado
- [x] Script `migrate_to_postgres.py` creado
- [ ] Levantar PostgreSQL: `docker-compose up -d postgres`
- [ ] Verificar contenedor corriendo
- [ ] Ejecutar migración: `python migrate_to_postgres.py`
- [ ] Actualizar `config.py` con PostgreSQL URL
- [ ] Instalar `psycopg[binary]`
- [ ] Reiniciar backend
- [ ] Verificar endpoints funcionan correctamente

---

## 🎓 Conclusiones

### Logros

✅ **Sistema completo de predicción de demanda** con 3 modelos de ML  
✅ **3 algoritmos de optimización** avanzados implementados  
✅ **Migración a PostgreSQL** para producción  
✅ **API RESTful completa** con autenticación JWT  
✅ **Frontend React** con visualizaciones  
✅ **Dockerización** para deployment  

### Próximos Pasos

1. **Desplegar en producción**:
   - Configurar servidor (AWS, Azure, DigitalOcean)
   - Usar Nginx como reverse proxy
   - Configurar SSL/HTTPS

2. **Mejoras de ML**:
   - Reentrenamiento automático periódico
   - Más features para Random Forest
   - Ensemble de modelos

3. **Optimización**:
   - Cache con Redis para predicciones
   - Índices en PostgreSQL
   - WebSockets para actualizaciones en tiempo real

4. **Monitoreo**:
   - Logs con ELK Stack
   - Métricas con Prometheus + Grafana
   - Alertas de performance

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica servicios: `docker-compose ps`
3. Consulta la documentación: http://localhost:8000/api/docs

**¡Éxito con tu proyecto! 🚀**
