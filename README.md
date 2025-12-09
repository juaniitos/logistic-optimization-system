# 🚚 Sistema de Optimización Logística - UPSE 2025-2

Sistema integral de optimización logística desarrollado para la Universidad Estatal Península de Santa Elena (UPSE) como parte del proyecto de investigación semilla 2025-2.

## 📋 Descripción

Solución tecnológica avanzada que integra:
- **Optimización de Rutas**: Algoritmos inteligentes para planificación de rutas eficientes
- **Gestión de Inventarios**: Control y predicción de stock en tiempo real
- **Análisis Predictivo**: Machine Learning para forecasting de demanda
- **Dashboard Interactivo**: Visualización de datos y métricas clave
- **API REST**: Integración completa con sistemas existentes

## 🏗️ Arquitectura del Sistema

```
logistic_sol/
├── backend/          # API FastAPI + Python
├── frontend/         # Dashboard React + Vite
├── data/            # Datasets y modelos ML
├── notebooks/       # Jupyter notebooks para análisis
├── docs/            # Documentación técnica
└── docker-compose.yml
```

## 🛠️ Stack Tecnológico

### Backend
- **Framework**: FastAPI 0.104+
- **Base de Datos**: PostgreSQL 15
- **Cache**: Redis 7
- **ML/Optimización**: 
  - OR-Tools (optimización)
  - NetworkX (grafos)
  - Scikit-learn (ML)
  - Prophet (forecasting)
  - Pandas/NumPy (análisis)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **UI Library**: Ant Design
- **Mapas**: Leaflet + React-Leaflet
- **Gráficos**: Recharts

### DevOps
- **Containerización**: Docker + Docker Compose
- **Base de Datos**: PostgreSQL
- **Cache**: Redis

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker Desktop instalado
- Git
- Node.js 18+ (para desarrollo local)
- Python 3.11+ (para desarrollo local)

### Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
```powershell
git clone <repository-url>
cd logistic_sol
```

2. **Iniciar todos los servicios**
```powershell
docker-compose up -d
```

3. **Acceder a la aplicación**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Instalación Local (Desarrollo)

#### Backend

1. **Crear entorno virtual**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. **Instalar dependencias**
```powershell
pip install -r requirements.txt
```

3. **Configurar variables de entorno**
```powershell
cp .env.example .env
# Editar .env con tus configuraciones
```

4. **Iniciar servidor**
```powershell
python main.py
```

#### Frontend

1. **Instalar dependencias**
```powershell
cd frontend
npm install
```

2. **Iniciar servidor de desarrollo**
```powershell
npm run dev
```

## 📊 Módulos Principales

### 1. Optimización de Rutas
- Algoritmos de camino más corto (Dijkstra, A*)
- Vehicle Routing Problem (VRP) con OR-Tools
- Cálculo de distancias con Haversine
- Visualización en mapas interactivos

**Endpoint**: `POST /api/routes/optimize`

### 2. Gestión de Inventarios
- CRUD completo de productos y almacenes
- Control de stock con alertas automáticas
- Análisis ABC de inventarios
- Cálculo de punto de reorden (ROP)
- Economic Order Quantity (EOQ)

**Endpoints**: `/api/inventory/*`

### 3. Análisis Predictivo
- Forecasting de demanda con ML
- Time series analysis
- Predicción de stock futuro
- Detección de anomalías
- Modelos Prophet y ARIMA

**Endpoints**: `/api/analytics/*`

### 4. Dashboard
- KPIs principales en tiempo real
- Gráficos de tendencias
- Mapas de rutas optimizadas
- Reportes exportables
- Filtros avanzados

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en `backend/`:

```env
DATABASE_URL=postgresql://logistic_user:logistic_pass@localhost:5432/logistic_db
REDIS_HOST=localhost
REDIS_PORT=6379
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Base de Datos

Las tablas se crean automáticamente al iniciar el backend. Para migraciones:

```powershell
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 📖 API Documentation

La documentación completa de la API está disponible en:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

### Ejemplos de Uso

#### Optimizar Ruta
```bash
curl -X POST "http://localhost:8000/api/routes/optimize" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": {"latitude": -2.2, "longitude": -79.9, "name": "Almacén Central"},
    "destinations": [
      {"latitude": -2.21, "longitude": -79.91, "name": "Cliente 1"},
      {"latitude": -2.19, "longitude": -79.88, "name": "Cliente 2"}
    ]
  }'
```

#### Obtener Dashboard
```bash
curl -X GET "http://localhost:8000/api/analytics/dashboard"
```

## 🧪 Testing

### Backend
```powershell
cd backend
pytest tests/ -v --cov=app
```

### Frontend
```powershell
cd frontend
npm test
```

## 📈 Desarrollo y Contribución

### Estructura de Desarrollo

1. **Backend Services** (`backend/app/services/`)
   - `route_planner.py`: Optimización de rutas
   - `predictor.py`: Modelos predictivos
   - `optimizer.py`: Algoritmos de optimización

2. **Frontend Pages** (`frontend/src/pages/`)
   - `Dashboard.jsx`: Panel principal
   - `RoutesOptimization.jsx`: Módulo de rutas
   - `Inventory.jsx`: Gestión de inventario
   - `Analytics.jsx`: Análisis y predicciones

### Próximos Pasos para Desarrollo

1. ✅ Estructura del proyecto inicializada
2. 🔄 Instalar dependencias (`pip install -r requirements.txt` y `npm install`)
3. 🔄 Configurar base de datos PostgreSQL
4. 🔄 Implementar autenticación JWT
5. 🔄 Desarrollar modelos ML para forecasting
6. 🔄 Integrar OR-Tools para VRP
7. 🔄 Crear tests unitarios e integración
8. 🔄 Optimizar performance
9. 🔄 Documentar API completamente
10. 🔄 Deployment en producción

## 👥 Equipo

**Investigadores Principales**
- Graciela Sosa
- Alejandro Veliz

**Institución**: Universidad Estatal Península de Santa Elena (UPSE)

## 📄 Licencia

Este proyecto es parte de un proyecto de investigación académica de la UPSE 2025-2.

## 🤝 Soporte

Para preguntas o soporte:
- Crear un issue en el repositorio
- Contactar al equipo de investigación

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Estado**: 🚧 En Desarrollo
