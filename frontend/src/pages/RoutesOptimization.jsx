import { 
  Card, Button, Select, InputNumber, message, Tabs, Table, 
  Row, Col, Statistic, Tag, Space, Spin, Divider, Progress, Modal 
} from 'antd'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { 
  ThunderboltOutlined, ExperimentOutlined, 
  RocketOutlined, SwapOutlined, CarOutlined,
  EnvironmentOutlined, ClockCircleOutlined, 
  DollarOutlined, CloudOutlined, SaveOutlined, 
  RiseOutlined, FullscreenOutlined, CloseOutlined
} from '@ant-design/icons'
import GoogleMapFullscreen from '../components/GoogleMapFullscreen'
import GoogleMapSmall from '../components/GoogleMapSmall'
import 'leaflet/dist/leaflet.css'

const { Option } = Select

function RoutesOptimization() {
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState([])
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('genetic-algorithm')
  const [numVehicles, setNumVehicles] = useState(3)
  const [populationSize, setPopulationSize] = useState(100)
  const [generations, setGenerations] = useState(200)
  const [initialTemp, setInitialTemp] = useState(1000)
  const [coolingRate, setCoolingRate] = useState(0.95)
  const [maxIterations, setMaxIterations] = useState(1000)
  const [routeResult, setRouteResult] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)
  const [comparisonResults, setComparisonResults] = useState(null)
  const [activeTab, setActiveTab] = useState('1')
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [useRoadRouting, setUseRoadRouting] = useState(true)

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/inventory/warehouses')
      const data = await response.json()
      setWarehouses(data)
    } catch (error) {
      message.error('Error al cargar bodegas')
    }
  }

  const handleOptimize = async () => {
    setLoading(true)
    const startTime = performance.now()
    
    try {
      let url = ''
      let body = {}

      if (selectedAlgorithm === 'genetic-algorithm') {
        url = 'http://localhost:8000/api/analytics/optimize/genetic-algorithm'
        body = {
          num_vehicles: numVehicles,
          population_size: populationSize,
          generations: generations,
          use_road_routing: useRoadRouting
        }
      } else if (selectedAlgorithm === 'simulated-annealing') {
        url = 'http://localhost:8000/api/analytics/optimize/simulated-annealing'
        body = {
          initial_temperature: initialTemp,
          cooling_rate: coolingRate,
          use_road_routing: useRoadRouting
        }
      } else if (selectedAlgorithm === 'two-opt') {
        url = 'http://localhost:8000/api/analytics/optimize/two-opt'
        body = {
          max_iterations: maxIterations,
          use_road_routing: useRoadRouting
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const endTime = performance.now()
      const execTime = ((endTime - startTime) / 1000).toFixed(2)
      setExecutionTime(execTime)

      const data = await response.json()
      
      if (data.success) {
        setRouteResult(data.result)
        setMetrics(data.metrics)
        setActiveTab('1')
        message.success(`Optimización completada en ${execTime}s`)
      } else {
        message.error('Error en la optimización')
      }
    } catch (error) {
      message.error('Error al optimizar rutas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/api/analytics/optimize/compare?num_vehicles=${numVehicles}`
      )
      const data = await response.json()
      setComparisonResults(data)
      setActiveTab('2')
      message.success('Comparación completada')
    } catch (error) {
      message.error('Error al comparar algoritmos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getAlgorithmColor = (algorithm) => {
    const colors = {
      'genetic_algorithm': 'blue',
      'simulated_annealing': 'orange',
      'two_opt': 'green'
    }
    return colors[algorithm] || 'default'
  }

  const renderRouteMap = (result) => {
    if (!result || !warehouses.length) return null

    const center = warehouses.length > 0 
      ? [warehouses[0].latitude, warehouses[0].longitude]
      : [-2.1894, -79.8890]

    // Preparar marcadores y líneas
    const markers = []
    const lines = []

    if (result.routes && Array.isArray(result.routes)) {
      // Algoritmo Genético con múltiples rutas
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
      
      result.routes.forEach((route, routeIdx) => {
        const color = colors[routeIdx % colors.length]
        
        // Usar geometría real si está disponible, sino usar línea recta
        const routeCoords = route.geometry && route.geometry.length > 0 
          ? route.geometry 
          : []

        // Si no hay geometría, crear línea recta con las bodegas
        if (routeCoords.length === 0) {
          route.warehouse_indices?.forEach((warehouseIdx) => {
            const warehouse = warehouses[warehouseIdx]
            if (warehouse) {
              routeCoords.push([warehouse.latitude, warehouse.longitude])
            }
          })
        }

        // Crear marcadores solo en los puntos de parada (no en cada punto de la geometría)
        const warehouseIndices = route.warehouse_indices || route.warehouses || []
        warehouseIndices.forEach((warehouseIdx, idx) => {
          const warehouse = warehouses[warehouseIdx]
          if (warehouse) {
            const position = [warehouse.latitude, warehouse.longitude]
            
            markers.push(
              <Marker key={`route-${routeIdx}-wh-${idx}`} position={position}>
                <Popup>
                  <strong>{warehouse.name}</strong><br />
                  Vehículo: {route.vehicle_id}<br />
                  Orden: {idx + 1}
                </Popup>
              </Marker>
            )
          }
        })

        // Dibujar la ruta (con geometría real o línea recta)
        if (routeCoords.length > 1) {
          lines.push(
            <Polyline 
              key={`line-${routeIdx}`}
              positions={routeCoords} 
              color={color} 
              weight={4}
              opacity={0.7}
            />
          )
        }
      })
    } else if (result.route && Array.isArray(result.route)) {
      // Simulated Annealing o 2-opt con ruta única
      
      // Usar geometría real si está disponible
      const routeCoords = result.geometry && result.geometry.length > 0 
        ? result.geometry 
        : []

      // Si no hay geometría, crear línea recta con las bodegas
      if (routeCoords.length === 0) {
        result.route.forEach((warehouseIdx) => {
          const warehouse = warehouses[warehouseIdx]
          if (warehouse) {
            routeCoords.push([warehouse.latitude, warehouse.longitude])
          }
        })
      }
      
      // Crear marcadores en los puntos de parada
      result.route.forEach((warehouseIdx, idx) => {
        const warehouse = warehouses[warehouseIdx]
        if (warehouse) {
          const position = [warehouse.latitude, warehouse.longitude]
          
          markers.push(
            <Marker key={`wh-${idx}`} position={position}>
              <Popup>
                <strong>{warehouse.name}</strong><br />
                Orden: {idx + 1}
              </Popup>
            </Marker>
          )
        }
      })

      // Dibujar la ruta
      if (routeCoords.length > 1) {
        lines.push(
          <Polyline 
            key="route-line"
            positions={routeCoords} 
            color="#1890ff" 
            weight={4}
            opacity={0.7}
          />
        )
      }
    }

    return (
      <MapContainer 
        center={center} 
        zoom={10} 
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {lines}
        {markers}
      </MapContainer>
    )
  }

  const renderRoutesTable = (result) => {
    if (!result) return null

    if (result.routes && Array.isArray(result.routes)) {
      // Algoritmo Genético
      const CO2_PER_KM = 0.12
      const FUEL_PER_KM = 0.08
      const FUEL_COST = 2.5
      const AVG_SPEED = 40

      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']

      const columns = [
        {
          title: 'Vehículo',
          dataIndex: 'vehicle_id',
          key: 'vehicle_id',
          render: (text, record, index) => (
            <Tag color={colors[index % 6]}>
              <CarOutlined /> Vehículo {text}
            </Tag>
          )
        },
        {
          title: 'Bodegas',
          dataIndex: 'warehouse_names',
          key: 'warehouses',
          render: (names) => names.join(' → ')
        },
        {
          title: 'Distancia',
          dataIndex: 'distance',
          key: 'distance',
          render: (dist) => `${dist.toFixed(2)} km`
        },
        {
          title: 'Paradas',
          key: 'stops',
          render: (_, record) => (record.warehouse_indices || record.warehouses || []).length - 1
        }
      ]

      const expandedRowRender = (record, index) => {
        const distance = record.distance || 0
        const stops = (record.warehouse_indices || record.warehouses || []).length - 1
        
        const co2 = (distance * CO2_PER_KM).toFixed(2)
        const fuel = (distance * FUEL_PER_KM).toFixed(2)
        const cost = (fuel * FUEL_COST).toFixed(2)
        const timeHours = (distance / AVG_SPEED).toFixed(1)
        const timeMinutes = Math.round((distance / AVG_SPEED) * 60)

        const color = colors[index % 6]

        // Crear un objeto routeResult simulado solo para esta ruta
        const singleRouteResult = {
          routes: [record]
        }

        return (
          <div style={{ padding: '16px', background: '#fafafa' }}>
            <Row gutter={[16, 16]}>
              {/* Métricas */}
              <Col xs={24} md={8}>
                <Card 
                  size="small" 
                  title="📊 Métricas de esta Ruta"
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Statistic
                      title="Distancia Total"
                      value={distance}
                      suffix="km"
                      precision={2}
                      valueStyle={{ fontSize: 20, color: color }}
                    />
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <Row gutter={8}>
                      <Col span={12}>
                        <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: 4 }}>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            <EnvironmentOutlined /> Paradas
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                            {stops}
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: 4 }}>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            <ClockCircleOutlined /> Tiempo
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                            {timeHours}h
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={8} style={{ marginTop: 8 }}>
                      <Col span={12}>
                        <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: 4 }}>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            <CloudOutlined /> CO₂
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                            {co2} kg
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: 4 }}>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            ⛽ Combustible
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
                            {fuel} L
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div style={{ 
                      marginTop: 12, 
                      padding: '12px', 
                      background: '#e6f7ff', 
                      borderRadius: 4,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        <DollarOutlined /> Costo Total
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                        ${cost}
                      </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />
                    
                    <div style={{ fontSize: 12 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        🗺️ Secuencia de Paradas:
                      </div>
                      {(record.warehouse_indices || record.warehouses || []).map((idx, i) => (
                        <div key={i} style={{ 
                          padding: '4px 8px', 
                          marginBottom: 4,
                          background: '#fff',
                          borderRadius: 4,
                          borderLeft: `3px solid ${color}`
                        }}>
                          <strong>{i + 1}.</strong> {warehouses[idx]?.name || `Bodega ${idx}`}
                        </div>
                      ))}
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Mapa Individual */}
              <Col xs={24} md={16}>
                <Card 
                  size="small" 
                  title={`🗺️ Mapa de Ruta - Vehículo ${record.vehicle_id}`}
                  style={{ height: '100%' }}
                >
                  <GoogleMapSmall 
                    warehouses={warehouses} 
                    routeResult={singleRouteResult} 
                    height="450px"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )
      }

      return (
        <Table 
          columns={columns} 
          dataSource={result.routes}
          rowKey="vehicle_id"
          pagination={false}
          expandable={{
            expandedRowRender,
            expandRowByClick: true,
            expandIcon: ({ expanded, onExpand, record }) =>
              expanded ? (
                <Button 
                  type="text" 
                  icon={<span style={{ fontSize: 16 }}>▼</span>} 
                  onClick={e => onExpand(record, e)}
                  size="small"
                />
              ) : (
                <Button 
                  type="text" 
                  icon={<span style={{ fontSize: 16 }}>▶</span>} 
                  onClick={e => onExpand(record, e)}
                  size="small"
                />
              )
          }}
        />
      )
    } else if (result.route) {
      // Simulated Annealing o 2-opt
      const columns = [
        {
          title: 'Orden',
          dataIndex: 'order',
          key: 'order'
        },
        {
          title: 'Bodega',
          dataIndex: 'warehouse',
          key: 'warehouse'
        }
      ]

      const dataSource = result.warehouse_names?.map((name, idx) => ({
        order: idx + 1,
        warehouse: name,
        key: idx
      })) || []

      return (
        <Table 
          columns={columns} 
          dataSource={dataSource}
          pagination={false}
        />
      )
    }

    return null
  }

  const renderMetricsCards = () => {
    if (!metrics) return null

    const aggregateMetrics = metrics.aggregate || metrics

    return (
      <>
        <Row gutter={[16, 16]} style={{ marginTop: 20, marginBottom: 20 }}>
          <Col xs={24}>
            <Divider>Métricas de Sostenibilidad</Divider>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Emisiones CO₂"
                value={aggregateMetrics.emissions?.total_co2_kg || 0}
                suffix="kg"
                prefix={<CloudOutlined />}
                precision={2}
                valueStyle={{ color: '#f5222d' }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={
                  aggregateMetrics.emissions?.pollution_percentage < 30 ? 'green' :
                  aggregateMetrics.emissions?.pollution_percentage < 60 ? 'orange' : 'red'
                }>
                  {aggregateMetrics.emissions?.pollution_level || 'Bajo'}
                </Tag>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Tiempo Estimado"
                value={aggregateMetrics.time?.total_hours || 0}
                suffix="hrs"
                prefix={<ClockCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {aggregateMetrics.time?.total_minutes || 0} minutos
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Costo Combustible"
                value={aggregateMetrics.fuel?.fuel_cost_usd || 0}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                {aggregateMetrics.fuel?.fuel_liters || 0} litros
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Ahorro Total"
                value={aggregateMetrics.savings?.cost_saved_percent || 0}
                suffix="%"
                prefix={<SaveOutlined />}
                precision={1}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                ${(aggregateMetrics.savings?.cost_saved_usd || 0).toFixed(2)} USD
              </div>
            </Card>
          </Col>
        </Row>

        {aggregateMetrics.savings && (
          <Card title="📊 Ahorros vs Ruta No Optimizada" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Reducción Distancia"
                  value={aggregateMetrics.savings.distance_saved_percent}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={Math.min(aggregateMetrics.savings.distance_saved_percent, 100)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {aggregateMetrics.savings.distance_saved_km} km ahorrados
                </div>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Reducción CO₂"
                  value={aggregateMetrics.savings.co2_saved_percent}
                  suffix="%"
                  prefix={<CloudOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={Math.min(aggregateMetrics.savings.co2_saved_percent, 100)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {aggregateMetrics.savings.co2_saved_kg} kg menos
                </div>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Ahorro Tiempo"
                  value={aggregateMetrics.savings.time_saved_percent}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={Math.min(aggregateMetrics.savings.time_saved_percent, 100)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {(aggregateMetrics.savings.time_saved_hours || 0).toFixed(1)} hrs ahorradas
                </div>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Ahorro Costos"
                  value={aggregateMetrics.savings.cost_saved_percent}
                  suffix="%"
                  prefix={<SaveOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={Math.min(aggregateMetrics.savings.cost_saved_percent, 100)} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  ${(aggregateMetrics.savings.cost_saved_usd || 0).toFixed(2)} USD
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </>
    )
  }

  const renderComparisonTable = () => {
    if (!comparisonResults) return null

    const data = []
    Object.entries(comparisonResults.algorithms).forEach(([key, result]) => {
      if (!result.error) {
        data.push({
          key,
          algorithm: key.replace(/_/g, ' ').toUpperCase(),
          distance: result.total_distance,
          color: getAlgorithmColor(key)
        })
      }
    })

    const columns = [
      {
        title: 'Algoritmo',
        dataIndex: 'algorithm',
        key: 'algorithm',
        render: (text, record) => <Tag color={record.color}>{text}</Tag>
      },
      {
        title: 'Distancia Total',
        dataIndex: 'distance',
        key: 'distance',
        sorter: (a, b) => a.distance - b.distance,
        render: (dist) => `${dist} km`
        },
      {
        title: 'Mejor',
        key: 'best',
        render: (_, record) => {
          const isBest = record.key === comparisonResults.summary.best_algorithm
          return isBest ? <Tag color="green">✓ Mejor</Tag> : '-'
        }
      }
    ]

    return <Table columns={columns} dataSource={data} pagination={false} />
  }

  return (
    <div>
      <h1>🗺️ Optimización de Rutas</h1>
      <p>Encuentra las rutas más eficientes usando algoritmos avanzados de optimización</p>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Panel de Configuración */}
        <Col xs={24} lg={8}>
          <Card title="⚙️ Configuración" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* Selector de Algoritmo */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Algoritmo
                </label>
                <Select
                  value={selectedAlgorithm}
                  onChange={setSelectedAlgorithm}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="genetic-algorithm">
                    <ExperimentOutlined /> Algoritmo Genético
                  </Option>
                  <Option value="simulated-annealing">
                    <ThunderboltOutlined /> Simulated Annealing
                  </Option>
                  <Option value="two-opt">
                    <RocketOutlined /> 2-opt
                  </Option>
                </Select>
              </div>

              <Divider />

              {/* Tipo de Enrutamiento */}
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  Tipo de Ruta
                </label>
                <Select
                  value={useRoadRouting}
                  onChange={setUseRoadRouting}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value={true}>
                    🛣️ Rutas por Carreteras (Real)
                  </Option>
                  <Option value={false}>
                    📏 Línea Recta (Haversine)
                  </Option>
                </Select>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#888' }}>
                  {useRoadRouting 
                    ? 'Usa OSRM para calcular rutas reales por carreteras' 
                    : 'Calcula distancia directa entre puntos'}
                </div>
              </div>

              <Divider />

              {/* Parámetros según algoritmo */}
              {selectedAlgorithm === 'genetic-algorithm' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      Número de Vehículos
                    </label>
                    <InputNumber
                      min={1}
                      max={10}
                      value={numVehicles}
                      onChange={setNumVehicles}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      Tamaño de Población
                    </label>
                    <InputNumber
                      min={50}
                      max={500}
                      value={populationSize}
                      onChange={setPopulationSize}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      Generaciones
                    </label>
                    <InputNumber
                      min={50}
                      max={1000}
                      value={generations}
                      onChange={setGenerations}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {selectedAlgorithm === 'simulated-annealing' && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      Temperatura Inicial
                    </label>
                    <InputNumber
                      min={100}
                      max={10000}
                      value={initialTemp}
                      onChange={setInitialTemp}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      Tasa de Enfriamiento
                    </label>
                    <InputNumber
                      min={0.01}
                      max={0.99}
                      step={0.01}
                      value={coolingRate}
                      onChange={setCoolingRate}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {selectedAlgorithm === 'two-opt' && (
                <div>
                  <label style={{ display: 'block', marginBottom: 8 }}>
                    Iteraciones Máximas
                  </label>
                  <InputNumber
                    min={100}
                    max={5000}
                    value={maxIterations}
                    onChange={setMaxIterations}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <Divider />

              {/* Botones de Acción */}
              <Button
                type="primary"
                size="large"
                block
                onClick={handleOptimize}
                loading={loading}
                icon={<RocketOutlined />}
              >
                Optimizar Ruta
              </Button>

              <Button
                size="large"
                block
                onClick={handleCompare}
                loading={loading}
                icon={<SwapOutlined />}
              >
                Comparar Algoritmos
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Panel de Resultados */}
        <Col xs={24} lg={16}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="Resultado Individual" key="1">
              {loading ? (
                <Card>
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 20 }}>Optimizando rutas...</p>
                  </div>
                </Card>
              ) : routeResult ? (
                <>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Distancia Total"
                          value={routeResult.total_distance}
                          suffix="km"
                          precision={2}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Tiempo de Ejecución"
                          value={executionTime}
                          suffix="seg"
                          prefix={<ClockCircleOutlined />}
                          precision={2}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Algoritmo"
                          value={routeResult.algorithm}
                          valueStyle={{ fontSize: 18 }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card 
                    title="🗺️ Mapa de Rutas" 
                    style={{ marginBottom: 16 }}
                    extra={
                      <Button 
                        icon={<FullscreenOutlined />}
                        onClick={() => setIsMapFullscreen(true)}
                      >
                        Pantalla Completa
                      </Button>
                    }
                  >
                    <GoogleMapSmall warehouses={warehouses} routeResult={routeResult} />
                  </Card>

                  {metrics && renderMetricsCards()}

                  <Card title="📋 Detalle de Rutas - Haz clic en cada fila para ver métricas y mapa">
                    {renderRoutesTable(routeResult)}
                  </Card>
                </>
              ) : (
                <Card>
                  <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                    <RocketOutlined style={{ fontSize: 64, marginBottom: 20 }} />
                    <p>Selecciona un algoritmo y haz clic en "Optimizar Ruta"</p>
                  </div>
                </Card>
              )}
            </Tabs.TabPane>

            <Tabs.TabPane tab="Comparación de Algoritmos" key="2">
              {loading ? (
                <Card>
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 20 }}>Comparando algoritmos...</p>
                  </div>
                </Card>
              ) : comparisonResults ? (
                <>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                      <Card>
                        <Statistic
                          title="Mejor Algoritmo"
                          value={comparisonResults.summary.best_algorithm?.replace(/_/g, ' ').toUpperCase()}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card>
                        <Statistic
                          title="Mejor Distancia"
                          value={comparisonResults.summary.best_distance}
                          suffix="km"
                          precision={2}
                          valueStyle={{ color: '#3f8600' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="📊 Tabla Comparativa">
                    {renderComparisonTable()}
                  </Card>
                </>
              ) : (
                <Card>
                  <div style={{ textAlign: 'center', padding: 50, color: '#999' }}>
                    <SwapOutlined style={{ fontSize: 64, marginBottom: 20 }} />
                    <p>Haz clic en "Comparar Algoritmos" para ver los resultados</p>
                  </div>
                </Card>
              )}
            </Tabs.TabPane>
          </Tabs>
        </Col>
      </Row>

      {/* Modal de Pantalla Completa con Google Maps */}
      <Modal
        title="🗺️ Mapa de Rutas - Vista Completa (Google Maps)"
        open={isMapFullscreen}
        onCancel={() => setIsMapFullscreen(false)}
        width="95vw"
        style={{ top: 20 }}
        footer={null}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden={true}
      >
        <div style={{ 
          height: '85vh', 
          position: 'relative'
        }}>
          <GoogleMapFullscreen 
            warehouses={warehouses} 
            routeResult={routeResult} 
          />
          <Button
            icon={<CloseOutlined />}
            onClick={() => setIsMapFullscreen(false)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            size="large"
          >
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default RoutesOptimization
