# Documentación de la API - Sistema de Optimización Logística

## Base URL
```
http://localhost:8000/api
```

## Autenticación
La API utiliza JWT (JSON Web Tokens) para autenticación (próximamente).

## Endpoints

### 1. Routes Optimization

#### POST /routes/optimize
Optimiza una ruta para múltiples destinos.

**Request Body:**
```json
{
  "origin": {
    "latitude": -2.2,
    "longitude": -79.9,
    "name": "Almacén Central"
  },
  "destinations": [
    {
      "latitude": -2.21,
      "longitude": -79.91,
      "name": "Cliente 1"
    },
    {
      "latitude": -2.19,
      "longitude": -79.88,
      "name": "Cliente 2"
    }
  ],
  "vehicle_id": 1,
  "max_distance": 100,
  "max_time": 5
}
```

**Response:**
```json
{
  "total_distance": 45.8,
  "total_time": 0.92,
  "total_cost": 22.9,
  "optimized_sequence": ["Almacén Central", "Cliente 1", "Cliente 2"],
  "route_segments": [
    {
      "from_location": "Almacén Central",
      "to_location": "Cliente 1",
      "distance": 20.5,
      "time": 0.41
    }
  ]
}
```

#### GET /routes/calculate-distance
Calcula distancia entre dos puntos.

**Query Parameters:**
- `lat1` (float): Latitud origen
- `lon1` (float): Longitud origen
- `lat2` (float): Latitud destino
- `lon2` (float): Longitud destino

**Response:**
```json
{
  "distance_km": 15.32,
  "from": {"latitude": -2.2, "longitude": -79.9},
  "to": {"latitude": -2.21, "longitude": -79.91}
}
```

### 2. Inventory Management

#### POST /inventory/warehouses
Crear nuevo almacén.

**Request Body:**
```json
{
  "name": "Almacén Norte",
  "address": "Av. Principal 123",
  "latitude": -2.2,
  "longitude": -79.9,
  "capacity": 5000.0
}
```

#### GET /inventory/warehouses
Obtener lista de almacenes.

**Query Parameters:**
- `skip` (int): Registros a saltar
- `limit` (int): Límite de registros

#### POST /inventory/products
Crear nuevo producto.

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Producto Ejemplo",
  "description": "Descripción del producto",
  "unit_price": 25.50,
  "weight": 2.5,
  "volume": 0.1,
  "category": "Electrónicos"
}
```

#### GET /inventory/products
Obtener lista de productos.

**Query Parameters:**
- `skip` (int): Registros a saltar
- `limit` (int): Límite de registros
- `category` (string): Filtrar por categoría

#### POST /inventory/items
Crear item de inventario.

**Request Body:**
```json
{
  "warehouse_id": 1,
  "product_id": 1,
  "quantity": 100,
  "min_stock": 10,
  "max_stock": 500,
  "reorder_point": 20
}
```

#### GET /inventory/items
Obtener items de inventario.

**Query Parameters:**
- `warehouse_id` (int): Filtrar por almacén
- `product_id` (int): Filtrar por producto
- `low_stock` (bool): Solo items bajo stock

**Response:**
```json
[
  {
    "id": 1,
    "warehouse_id": 1,
    "product_id": 1,
    "quantity": 15,
    "min_stock": 10,
    "max_stock": 500,
    "reorder_point": 20,
    "created_at": "2025-11-24T10:00:00"
  }
]
```

#### GET /inventory/forecast
Predicción de demanda para un producto.

**Query Parameters:**
- `product_id` (int): ID del producto
- `warehouse_id` (int): ID del almacén
- `days` (int): Días a predecir (default: 30)

### 3. Analytics & Predictions

#### GET /analytics/dashboard
Obtener datos del dashboard principal.

**Response:**
```json
{
  "total_products": 150,
  "total_warehouses": 5,
  "total_vehicles": 12,
  "low_stock_items": 8,
  "total_inventory_value": 125430.50,
  "last_updated": "2025-11-24T12:00:00"
}
```

#### GET /analytics/demand-forecast
Predicción de demanda.

**Query Parameters:**
- `product_id` (int): ID del producto
- `warehouse_id` (int): ID del almacén
- `forecast_days` (int): Días a predecir

**Response:**
```json
[
  {
    "product_id": 1,
    "warehouse_id": 1,
    "forecast_date": "2025-11-25T00:00:00",
    "predicted_quantity": 105.5,
    "confidence_interval_lower": 84.4,
    "confidence_interval_upper": 126.6,
    "model_version": "v1.0-prophet"
  }
]
```

#### GET /analytics/inventory-trends
Tendencias de inventario.

**Query Parameters:**
- `warehouse_id` (int): ID del almacén (opcional)
- `days` (int): Periodo de análisis (default: 30)

#### GET /analytics/reports/generate
Generar reportes.

**Query Parameters:**
- `report_type` (string): Tipo de reporte (inventory, routes, costs, efficiency)
- `start_date` (string): Fecha inicio (ISO format)
- `end_date` (string): Fecha fin (ISO format)

## Códigos de Estado HTTP

- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Datos de entrada inválidos
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Modelos de Datos

### Warehouse
```python
{
  "id": int,
  "name": string,
  "address": string,
  "latitude": float,
  "longitude": float,
  "capacity": float,
  "created_at": datetime
}
```

### Product
```python
{
  "id": int,
  "sku": string,
  "name": string,
  "description": string,
  "unit_price": float,
  "weight": float,
  "volume": float,
  "category": string,
  "created_at": datetime
}
```

### InventoryItem
```python
{
  "id": int,
  "warehouse_id": int,
  "product_id": int,
  "quantity": int,
  "min_stock": int,
  "max_stock": int,
  "reorder_point": int,
  "created_at": datetime
}
```

## Ejemplos con cURL

### Optimizar Ruta
```bash
curl -X POST "http://localhost:8000/api/routes/optimize" \
  -H "Content-Type: application/json" \
  -d @route_request.json
```

### Crear Producto
```bash
curl -X POST "http://localhost:8000/api/inventory/products" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Producto Test",
    "unit_price": 99.99,
    "category": "Test"
  }'
```

### Obtener Dashboard
```bash
curl -X GET "http://localhost:8000/api/analytics/dashboard"
```
