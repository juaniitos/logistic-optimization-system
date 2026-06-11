import axios from 'axios'

// En producción usa la variable de entorno, en desarrollo usa localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Dashboard
export const getDashboardData = async () => {
  const response = await apiClient.get('/analytics/dashboard')
  return response.data
}

// Routes
export const optimizeRoute = async (data) => {
  const response = await apiClient.post('/routes/optimize', data)
  return response.data
}

export const calculateDistance = async (lat1, lon1, lat2, lon2) => {
  const response = await apiClient.get('/routes/calculate-distance', {
    params: { lat1, lon1, lat2, lon2 },
  })
  return response.data
}

export const getRoutes = async () => {
  const response = await apiClient.get('/routes/')
  return response.data
}

export const createRoute = async (data) => {
  const response = await apiClient.post('/routes/', data)
  return response.data
}

export const optimizeSavedRoute = async (id, options = {}) => {
  const response = await apiClient.post(`/routes/${id}/optimize`, null, {
    params: {
      use_road_routing: options.useRoadRouting ?? true,
    },
  })
  return response.data
}

// Inventory
export const getInventoryItems = async (params = {}) => {
  const response = await apiClient.get('/inventory/items', { params })
  return response.data
}

export const createInventoryItem = async (data) => {
  const response = await apiClient.post('/inventory/items', data)
  return response.data
}

export const updateInventoryItem = async (id, data) => {
  const response = await apiClient.put(`/inventory/items/${id}`, data)
  return response.data
}

export const updateInventoryItemStatus = async (id, isActive) => {
  const response = await apiClient.patch(`/inventory/items/${id}/status?is_active=${isActive}`)
  return response.data
}

export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/inventory/products', { params })
  return response.data
}

export const getWarehouses = async (locationType = null) => {
  const params = locationType ? { location_type: locationType } : {}
  const response = await apiClient.get('/inventory/warehouses', { params })
  return response.data
}

export const getWarehouse = async (id) => {
  const response = await apiClient.get(`/inventory/warehouses/${id}`)
  return response.data
}

export const createWarehouse = async (data) => {
  const response = await apiClient.post('/inventory/warehouses', data)
  return response.data
}

export const updateWarehouse = async (id, data) => {
  const response = await apiClient.put(`/inventory/warehouses/${id}`, data)
  return response.data
}

export const deleteWarehouse = async (id) => {
  const response = await apiClient.delete(`/inventory/warehouses/${id}`)
  return response.data
}

export const createProduct = async (data) => {
  const response = await apiClient.post('/inventory/products', data)
  return response.data
}

// Drivers (Transportistas)
export const getDrivers = async (params = {}) => {
  const response = await apiClient.get('/drivers/', { params })
  return response.data
}

export const getDriver = async (id) => {
  const response = await apiClient.get(`/drivers/${id}`)
  return response.data
}

export const createDriver = async (data) => {
  const response = await apiClient.post('/drivers/', data)
  return response.data
}

export const updateDriver = async (id, data) => {
  const response = await apiClient.put(`/drivers/${id}`, data)
  return response.data
}

export const deleteDriver = async (id) => {
  const response = await apiClient.delete(`/drivers/${id}`)
  return response.data
}

export const updateDriverStatus = async (id, status) => {
  const response = await apiClient.patch(`/drivers/${id}/status?new_status=${status}`)
  return response.data
}

export const assignVehicleToDriver = async (driverId, vehicleId) => {
  const params = vehicleId ? `?vehicle_id=${vehicleId}` : ''
  const response = await apiClient.patch(`/drivers/${driverId}/assign-vehicle${params}`)
  return response.data
}

// Route Assignments (Asignaciones de Rutas)
export const getRouteAssignments = async (params = {}) => {
  const response = await apiClient.get('/drivers/assignments', { params })
  return response.data
}

export const createRouteAssignment = async (data) => {
  const response = await apiClient.post('/drivers/assignments', data)
  return response.data
}

export const updateAssignmentStatus = async (id, status) => {
  const response = await apiClient.patch(`/drivers/assignments/${id}/status?new_status=${status}`)
  return response.data
}

export const deleteRouteAssignment = async (id) => {
  const response = await apiClient.delete(`/drivers/assignments/${id}`)
  return response.data
}

export const getDriverAssignments = async (driverId, includeCompleted = false) => {
  const response = await apiClient.get(`/drivers/${driverId}/assignments?include_completed=${includeCompleted}`)
  return response.data
}

// Vehicles
export const getVehicles = async () => {
  const response = await apiClient.get('/inventory/vehicles')
  return response.data
}

// Analytics
export const getDemandForecast = async (productId, warehouseId, days = 30) => {
  const response = await apiClient.get('/analytics/demand-forecast', {
    params: { product_id: productId, warehouse_id: warehouseId, forecast_days: days },
  })
  return response.data
}

export const getInventoryTrends = async (warehouseId, days = 30) => {
  const response = await apiClient.get('/analytics/inventory-trends', {
    params: { warehouse_id: warehouseId, days },
  })
  return response.data
}

export const generateReport = async (reportType, startDate, endDate) => {
  const response = await apiClient.get('/analytics/reports/generate', {
    params: { report_type: reportType, start_date: startDate, end_date: endDate },
  })
  return response.data
}

export default apiClient
