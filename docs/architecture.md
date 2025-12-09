# Arquitectura del Sistema - Sistema de Optimización Logística

## Visión General

El sistema está diseñado con una arquitectura de microservicios moderna y escalable, siguiendo principios de diseño limpio y separación de responsabilidades.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                    React + Vite + Ant Design                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │Dashboard  │  │  Routes   │  │ Inventory │  │Analytics ││
│  │           │  │           │  │           │  │          ││
│  └───────────┘  └───────────┘  └───────────┘  └──────────┘│
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND API                               │
│                   FastAPI + Python                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              API Layer (Routers)                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │ │
│  │  │ Routes   │  │Inventory │  │Analytics │           │ │
│  │  │  API     │  │   API    │  │   API    │           │ │
│  │  └──────────┘  └──────────┘  └──────────┘           │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           Business Logic (Services)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│ │
│  │  │RoutePlanner  │  │  Predictor   │  │ Optimizer   ││ │
│  │  │- TSP Solver  │  │- Forecasting │  │- VRP Solver ││ │
│  │  │- Haversine   │  │- Time Series │  │- ABC Analysis││ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘│ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Data Layer (Models)                       │ │
│  │  ┌──────────────────────────────────────────────────┐│ │
│  │  │ SQLAlchemy ORM - Pydantic Schemas                ││ │
│  │  └──────────────────────────────────────────────────┘│ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
┌───────▼────────┐              ┌─────────▼──────┐
│   PostgreSQL   │              │     Redis      │
│   Database     │              │     Cache      │
│                │              │                │
│ - Warehouses   │              │ - Sessions     │
│ - Products     │              │ - Temp Data    │
│ - Inventory    │              │                │
│ - Routes       │              │                │
│ - Vehicles     │              │                │
│ - Demands      │              │                │
└────────────────┘              └────────────────┘
```

## Capas del Sistema

### 1. Frontend Layer

**Tecnologías**: React 18, Vite 5, Ant Design, Leaflet

**Responsabilidades**:
- Interfaz de usuario responsive
- Visualización de datos (mapas, gráficos)
- Gestión de estado local
- Comunicación con API backend

**Componentes Principales**:
```
frontend/src/
├── components/      # Componentes reutilizables
│   ├── Header.jsx
│   └── Sidebar.jsx
├── pages/          # Vistas principales
│   ├── Dashboard.jsx
│   ├── RoutesOptimization.jsx
│   ├── Inventory.jsx
│   └── Analytics.jsx
└── services/       # Servicios de API
    └── api.js
```

### 2. API Layer (Backend)

**Tecnología**: FastAPI

**Responsabilidades**:
- Validación de requests (Pydantic)
- Routing y endpoints
- Manejo de errores
- Documentación automática (OpenAPI)

**Estructura**:
```
backend/app/api/
├── routes.py       # Endpoints de optimización de rutas
├── inventory.py    # Endpoints de inventario
└── analytics.py    # Endpoints de análisis
```

### 3. Business Logic Layer

**Responsabilidades**:
- Lógica de negocio
- Algoritmos de optimización
- Modelos de Machine Learning
- Procesamiento de datos

**Servicios**:

#### RoutePlanner
- Cálculo de distancias (Haversine)
- Traveling Salesman Problem (TSP)
- Optimización de rutas
- Gestión de restricciones de vehículos

#### Predictor
- Forecasting de demanda
- Time series analysis
- Cálculo de ROI y EOQ
- Análisis de tendencias

#### Optimizer
- Vehicle Routing Problem (VRP) con OR-Tools
- Análisis ABC de inventarios
- Optimización de safety stock
- Algoritmos de asignación

### 4. Data Layer

**Tecnologías**: SQLAlchemy ORM, PostgreSQL

**Modelos Principales**:
```python
- Warehouse: Almacenes y ubicaciones
- Product: Catálogo de productos
- InventoryItem: Stock por almacén
- Vehicle: Flota de vehículos
- Route: Rutas planificadas/ejecutadas
- Demand: Predicciones de demanda
```

## Patrones de Diseño

### 1. Repository Pattern
Abstracción de acceso a datos a través de SQLAlchemy ORM.

### 2. Service Layer Pattern
Lógica de negocio encapsulada en servicios reutilizables.

### 3. Dependency Injection
FastAPI maneja inyección de dependencias automáticamente.

### 4. DTO Pattern
Pydantic schemas para transferencia de datos validados.

## Flujo de Datos

### Ejemplo: Optimización de Ruta

```
1. Usuario ingresa puntos en el Frontend
2. Frontend → POST /api/routes/optimize
3. API valida request con Pydantic schema
4. API → RoutePlanner.optimize_route()
5. RoutePlanner calcula distancias y resuelve TSP
6. RoutePlanner → devuelve RouteOptimizationResponse
7. API → serializa respuesta
8. Frontend ← recibe JSON
9. Frontend renderiza resultado en mapa
```

## Seguridad

### Implementaciones Actuales
- CORS configurado
- Validación de datos con Pydantic
- SQL Injection protection (SQLAlchemy)

### Próximas Implementaciones
- JWT Authentication
- Role-based access control (RBAC)
- Rate limiting
- HTTPS/TLS

## Escalabilidad

### Horizontal Scaling
- Backend stateless (puede escalar horizontalmente)
- Redis para sesiones compartidas
- PostgreSQL con replicación

### Vertical Scaling
- Optimización de queries
- Indexación de base de datos
- Caching estratégico

### Optimizaciones
- Lazy loading de datos
- Paginación en endpoints
- Query optimization
- Connection pooling

## Performance

### Backend
- Operaciones asíncronas con FastAPI
- Connection pooling de SQLAlchemy
- Redis para caching
- Batch processing para ML

### Frontend
- Code splitting con Vite
- Lazy loading de componentes
- Memoización de cálculos costosos
- Virtual scrolling para tablas grandes

## Monitoreo y Logging

### Logging
```python
import logging

logger = logging.getLogger(__name__)
logger.info("Request received")
logger.error("Error occurred", exc_info=True)
```

### Métricas (Próximamente)
- Request/Response times
- Error rates
- Database query performance
- ML model performance

## Deployment

### Desarrollo
```bash
docker-compose up
```

### Producción
- Docker containers
- Nginx como reverse proxy
- PostgreSQL con backups automáticos
- Redis para cache y sessions
- CI/CD pipeline (GitHub Actions)

## Tecnologías Clave

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | React | 18.2 |
| Frontend Build | Vite | 5.0 |
| UI Library | Ant Design | 5.11 |
| Backend | FastAPI | 0.104 |
| ORM | SQLAlchemy | 2.0 |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7 |
| Optimization | OR-Tools | 9.8 |
| ML | Scikit-learn | 1.3 |
| Graphs | NetworkX | 3.2 |
| Forecasting | Prophet | 1.1 |

## Próximas Mejoras

1. **Autenticación completa** con JWT
2. **WebSockets** para actualizaciones en tiempo real
3. **Microservicios** separados para ML models
4. **Message Queue** (RabbitMQ/Kafka) para tareas asíncronas
5. **API Gateway** para enrutamiento avanzado
6. **Monitoring** con Prometheus + Grafana
7. **Testing** automatizado completo
8. **CI/CD** pipeline robusto
