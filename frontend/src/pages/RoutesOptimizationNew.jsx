import { 
  Card, Button, Select, InputNumber, message, Tabs, Table, 
  Row, Col, Statistic, Tag, Space, Spin, Divider, Progress 
} from 'antd'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { 
  ThunderboltOutlined, ExperimentOutlined, 
  RocketOutlined, SwapOutlined, CarOutlined,
  EnvironmentOutlined, ClockCircleOutlined, 
  DollarOutlined, FireOutlined, CloudOutlined,
  SaveOutlined, RiseOutlined
} from '@ant-design/icons'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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
  const [comparisonResults, setComparisonResults] = useState(null)
  const [activeTab, setActiveTab] = useState('1')

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/inventory/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setWarehouses(data)
      } else if (response.status === 401) {
        message.error('Sesión expirada. Por favor inicia sesión nuevamente.')
      }
    } catch (error) {
      message.error('Error al cargar bodegas')
    }
  }

  const handleOptimize = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = ''
      let body = {}

      if (selectedAlgorithm === 'genetic-algorithm') {
        url = 'http://localhost:8000/api/analytics/optimize/genetic-algorithm'
        body = { num_vehicles: numVehicles, population_size: populationSize, generations }
      } else if (selectedAlgorithm === 'simulated-annealing') {
        url = 'http://localhost:8000/api/analytics/optimize/simulated-annealing'
        body = { initial_temperature: initialTemp, cooling_rate: coolingRate }
      } else if (selectedAlgorithm === 'two-opt') {
        url = 'http://localhost:8000/api/analytics/optimize/two-opt'
        body = { max_iterations: maxIterations }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        setRouteResult(data.result)
        setMetrics(data.metrics)
        setActiveTab('1')
        message.success('¡Optimización completada!')
      } else {
        message.error('Error al optimizar rutas')
      }
    } catch (error) {
      message.error('Error al optimizar rutas')
    } finally {
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://localhost:8000/api/analytics/optimize/compare?num_vehicles=${numVehicles}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setComparisonResults(data)
        setActiveTab('2')
        message.success('Comparación completada')
      } else {
        message.error('Error al comparar algoritmos')
      }
    } catch (error) {
      message.error('Error al comparar algoritmos')
    } finally {
      setLoading(false)
    }
  }

  const renderRouteMap = (result) => {
    if (!result || warehouses.length === 0) return null

    const center = warehouses[0] 
      ? [warehouses[0].latitude, warehouses[0].longitude]
      : [-2.1894, -79.8890] // Santa Elena, Ecuador por defecto

    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
    const markers = []
    const lines = []

    if (result.routes && Array.isArray(result.routes)) {
      // Algoritmo Genético - múltiples rutas
      result.routes.forEach((route, routeIdx) => {
        const color = colors[routeIdx % colors.length]
        const routeCoords = []

        route.warehouse_indices.forEach((warehouseIdx, idx) => {
          const warehouse = warehouses[warehouseIdx]
          if (warehouse) {
            const position = [warehouse.latitude, warehouse.longitude]
            routeCoords.push(position)

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
      const routeCoords = []
      
      result.route.forEach((warehouseIdx, idx) => {
        const warehouse = warehouses[warehouseIdx]
        if (warehouse) {
          const position = [warehouse.latitude, warehouse.longitude]
          routeCoords.push(position)
          
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
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
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

  const renderMetricsCards = () => {
    if (!metrics) return null

    const aggregateMetrics = metrics.aggregate || metrics

    return (
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Distancia Total"
              value={aggregateMetrics.distance_km}
              suffix="km"
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tiempo Estimado"
              value={aggregateMetrics.time?.total_hours || 0}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
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
              title="Emisiones CO₂"
              value={aggregateMetrics.emissions?.total_co2_kg || 0}
              suffix="kg"
              prefix={<CloudOutlined />}
              precision={2}
              valueStyle={{ color: '#f5222d' }}
            />
            <div style={{ fontSize: 12, marginTop: 8 }}>
              <Tag color={
                aggregateMetrics.emissions?.pollution_percentage < 30 ? 'green' :
                aggregateMetrics.emissions?.pollution_percentage < 60 ? 'orange' : 'red'
              }>
                {aggregateMetrics.emissions?.pollution_level || 'Bajo'}
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Métricas de ahorro */}
        {aggregateMetrics.savings && (
          <>
            <Col xs={24}>
              <Divider>Ahorros vs Ruta No Optimizada</Divider>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Ahorro en Distancia"
                  value={aggregateMetrics.savings.distance_saved_percent}
                  suffix="%"
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={aggregateMetrics.savings.distance_saved_percent} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {aggregateMetrics.savings.distance_saved_km} km ahorrados
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Reducción CO₂"
                  value={aggregateMetrics.savings.co2_saved_percent}
                  suffix="%"
                  prefix={<CloudOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={aggregateMetrics.savings.co2_saved_percent} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {aggregateMetrics.savings.co2_saved_kg} kg menos
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Ahorro en Tiempo"
                  value={aggregateMetrics.savings.time_saved_percent}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={aggregateMetrics.savings.time_saved_percent} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {aggregateMetrics.savings.time_saved_hours.toFixed(1)} hrs ahorradas
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Ahorro en Costos"
                  value={aggregateMetrics.savings.cost_saved_percent}
                  suffix="%"
                  prefix={<SaveOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Progress 
                  percent={aggregateMetrics.savings.cost_saved_percent} 
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  ${aggregateMetrics.savings.cost_saved_usd.toFixed(2)} USD
                </div>
              </Card>
            </Col>
          </>
        )}
      </Row>
    )
  }

  const renderRoutesTable = (result) => {
    if (!result) return null

    if (result.routes && Array.isArray(result.routes)) {
      const columns = [
        {
          title: 'Vehículo',
          dataIndex: 'vehicle_id',
          key: 'vehicle_id',
          render: (text) => <Tag color="blue"><CarOutlined /> Vehículo {text}</Tag>
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
        }
      ]

      return (
        <Table 
          columns={columns} 
          dataSource={result.routes}
          rowKey="vehicle_id"
          pagination={false}
        />
      )
    } else if (result.route) {
      const routeData = result.warehouse_names || result.route.map((idx, i) => ({
        order: i + 1,
        warehouse: warehouses[idx]?.name || `Bodega ${idx}`,
        distance: i === 0 ? 0 : '---'
      }))

      const columns = [
        { title: 'Orden', dataIndex: 'order', key: 'order', width: 80 },
        { title: 'Bodega', dataIndex: 'warehouse', key: 'warehouse' },
      ]

      return (
        <Table 
          columns={columns} 
          dataSource={routeData}
          rowKey="order"
          pagination={false}
        />
      )
    }
  }

  const renderComparisonTable = () => {
    if (!comparisonResults) return null

    const columns = [
      {
        title: 'Algoritmo',
        dataIndex: 'algorithm',
        key: 'algorithm',
        render: (text) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Distancia Total',
        dataIndex: 'total_distance',
        key: 'distance',
        render: (dist) => `${dist.toFixed(2)} km`,
        sorter: (a, b) => a.total_distance - b.total_distance
      },
      {
        title: 'Tiempo Ejecución',
        dataIndex: 'execution_time',
        key: 'time',
        render: (time) => `${time.toFixed(3)} seg`
      },
      {
        title: 'Vehículos',
        dataIndex: 'num_vehicles',
        key: 'vehicles',
        render: (num) => num || 1
      }
    ]

    const dataSource = comparisonResults.results?.map((r, idx) => ({
      key: idx,
      ...r
    })) || []

    return <Table columns={columns} dataSource={dataSource} pagination={false} />
  }

  return (
    <div style={{ padding: 20 }}>
      <h1><RocketOutlined /> Optimización de Rutas</h1>
      <p>Optimiza rutas de entrega usando algoritmos avanzados</p>

      <Row gutter={[16, 16]}>
        {/* Configuración */}
        <Col xs={24} lg={8}>
          <Card title="Configuración del Algoritmo">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label><strong>Algoritmo:</strong></label>
                <Select 
                  value={selectedAlgorithm} 
                  onChange={setSelectedAlgorithm}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="genetic-algorithm">
                    <ThunderboltOutlined /> Algoritmo Genético
                  </Option>
                  <Option value="simulated-annealing">
                    <FireOutlined /> Simulated Annealing
                  </Option>
                  <Option value="two-opt">
                    <ExperimentOutlined /> 2-opt
                  </Option>
                </Select>
              </div>

              {selectedAlgorithm === 'genetic-algorithm' && (
                <>
                  <div>
                    <label>Número de Vehículos:</label>
                    <InputNumber 
                      min={1} 
                      max={10} 
                      value={numVehicles}
                      onChange={setNumVehicles}
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <label>Tamaño de Población:</label>
                    <InputNumber 
                      min={20} 
                      max={500} 
                      value={populationSize}
                      onChange={setPopulationSize}
                      disabled
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <label>Generaciones:</label>
                    <InputNumber 
                      min={50} 
                      max={1000} 
                      value={generations}
                      onChange={setGenerations}
                      disabled
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>
                </>
              )}

              {selectedAlgorithm === 'simulated-annealing' && (
                <>
                  <div>
                    <label>Temperatura Inicial:</label>
                    <InputNumber 
                      min={100} 
                      max={10000} 
                      value={initialTemp}
                      onChange={setInitialTemp}
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>
                  <div>
                    <label>Tasa de Enfriamiento:</label>
                    <InputNumber 
                      min={0.8} 
                      max={0.99} 
                      step={0.01}
                      value={coolingRate}
                      onChange={setCoolingRate}
                      style={{ width: '100%', marginTop: 8 }}
                    />
                  </div>
                </>
              )}

              {selectedAlgorithm === 'two-opt' && (
                <div>
                  <label>Máximo de Iteraciones:</label>
                  <InputNumber 
                    min={100} 
                    max={5000} 
                    value={maxIterations}
                    onChange={setMaxIterations}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>
              )}

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

        {/* Resultados */}
        <Col xs={24} lg={16}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane 
              tab={<span><EnvironmentOutlined /> Resultado</span>} 
              key="1"
            >
              {loading ? (
                <Card>
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <Spin size="large" />
                    <p style={{ marginTop: 20 }}>Optimizando rutas...</p>
                  </div>
                </Card>
              ) : routeResult ? (
                <>
                  <Card title="Mapa de Rutas">
                    {renderRouteMap(routeResult)}
                  </Card>
                  
                  {renderMetricsCards()}

                  <Card title="Detalles de Rutas" style={{ marginTop: 16 }}>
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

            <Tabs.TabPane 
              tab={<span><SwapOutlined /> Comparación</span>} 
              key="2"
            >
              {comparisonResults ? (
                <Card title="Comparación de Algoritmos">
                  {renderComparisonTable()}
                </Card>
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
    </div>
  )
}

export default RoutesOptimization
