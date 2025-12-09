import { 
  Row, Col, Card, Statistic, Progress, Table, Tag, 
  Space, Badge, List, Avatar, Divider 
} from 'antd'
import {
  ShoppingOutlined, HomeOutlined, CarOutlined, 
  WarningOutlined, DollarOutlined, RiseOutlined,
  FallOutlined, ClockCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

function Dashboard() {
  const [data, setData] = useState({
    total_products: 0,
    total_warehouses: 0,
    total_vehicles: 0,
    low_stock_items: 0,
    total_inventory_value: 0,
  })

  const [products, setProducts] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    try {
      // Dashboard stats
      const dashboardRes = await fetch('http://localhost:8000/api/analytics/dashboard')
      const dashboardData = await dashboardRes.json()
      setData(dashboardData)

      // Products
      const productsRes = await fetch('http://localhost:8000/api/inventory/products')
      const productsData = await productsRes.json()
      setProducts(productsData.slice(0, 5))

      // Inventory
      const inventoryRes = await fetch('http://localhost:8000/api/inventory/items')
      const inventoryData = await inventoryRes.json()
      setInventoryItems(inventoryData.slice(0, 10))

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Datos para gráfico de distribución de inventario
  const inventoryDistribution = [
    { name: 'Electrónicos', value: 35, color: '#1890ff' },
    { name: 'Alimentos', value: 25, color: '#52c41a' },
    { name: 'Textiles', value: 20, color: '#faad14' },
    { name: 'Muebles', value: 12, color: '#f5222d' },
    { name: 'Otros', value: 8, color: '#722ed1' }
  ]

  // Datos para gráfico de ventas semanales
  const weeklyData = [
    { day: 'Lun', ventas: 120, pedidos: 15 },
    { day: 'Mar', ventas: 150, pedidos: 20 },
    { day: 'Mié', ventas: 100, pedidos: 12 },
    { day: 'Jue', ventas: 180, pedidos: 22 },
    { day: 'Vie', ventas: 200, pedidos: 25 },
    { day: 'Sáb', ventas: 250, pedidos: 30 },
    { day: 'Dom', ventas: 170, pedidos: 18 }
  ]

  // Actividad reciente (simulado)
  const recentActivity = [
    {
      id: 1,
      type: 'order',
      title: 'Nuevo pedido recibido',
      description: 'Pedido #1234 - 50 unidades',
      time: '5 min',
      icon: <ShoppingOutlined />,
      color: '#1890ff'
    },
    {
      id: 2,
      type: 'stock',
      title: 'Stock bajo detectado',
      description: 'Laptop HP - Bodega Central',
      time: '15 min',
      icon: <WarningOutlined />,
      color: '#faad14'
    },
    {
      id: 3,
      type: 'route',
      title: 'Ruta optimizada completada',
      description: 'Vehículo #3 - 5 entregas',
      time: '1 hora',
      icon: <CarOutlined />,
      color: '#52c41a'
    },
    {
      id: 4,
      type: 'inventory',
      title: 'Inventario actualizado',
      description: 'Bodega Sur - 120 productos',
      time: '2 horas',
      icon: <HomeOutlined />,
      color: '#722ed1'
    }
  ]

  // Top productos por valor
  const topProductsColumns = [
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar style={{ backgroundColor: '#1890ff' }}>
            {text.charAt(0)}
          </Avatar>
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (value) => {
        const status = value > 50 ? 'success' : value > 20 ? 'warning' : 'error'
        return <Badge status={status} text={`${value} unidades`} />
      }
    },
    {
      title: 'Precio',
      dataIndex: 'unit_price',
      key: 'price',
      render: (value) => `$${value.toFixed(2)}`
    }
  ]

  // Preparar datos de productos para la tabla
  const productsTableData = products.map((p, idx) => ({
    key: p.id,
    name: p.name,
    stock: inventoryItems
      .filter(i => i.product_id === p.id)
      .reduce((sum, i) => sum + i.quantity, 0),
    unit_price: p.unit_price || 0
  }))

  // Cálculos adicionales
  const stockHealth = data.low_stock_items > 0 
    ? Math.max(0, 100 - (data.low_stock_items / data.total_products * 100))
    : 100

  const inventoryFillRate = inventoryItems.length > 0
    ? (inventoryItems.reduce((sum, i) => sum + (i.quantity / (i.reorder_point * 2)), 0) / inventoryItems.length) * 100
    : 0

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>🏠 Panel de Control</h1>
        <p style={{ color: '#666', marginBottom: 0 }}>
          Bienvenido al sistema de optimización logística UPSE
        </p>
      </div>

      {/* KPIs Principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Productos"
              value={data.total_products}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress 
              percent={75} 
              size="small" 
              showInfo={false} 
              strokeColor="#1890ff"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Bodegas Activas"
              value={data.total_warehouses}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
              <CheckCircleOutlined /> Todas operativas
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Vehículos"
              value={data.total_vehicles}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#722ed1' }}>
              <ClockCircleOutlined /> {Math.floor(data.total_vehicles * 0.8)} en ruta
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Valor Inventario"
              value={data.total_inventory_value}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#52c41a' }}>
              <RiseOutlined /> +12% este mes
            </div>
          </Card>
        </Col>
      </Row>

      {/* Alertas y Estado */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="⚠️ Alertas de Stock">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Productos con Stock Bajo</span>
                <span style={{ fontWeight: 600 }}>{data.low_stock_items}</span>
              </div>
              <Progress 
                percent={data.low_stock_items > 0 ? (data.low_stock_items / data.total_products * 100) : 0}
                status={data.low_stock_items > 5 ? 'exception' : data.low_stock_items > 0 ? 'normal' : 'success'}
                strokeColor={data.low_stock_items > 5 ? '#ff4d4f' : '#faad14'}
              />
            </div>

            <Divider />

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Salud del Inventario</span>
                <span style={{ fontWeight: 600 }}>{stockHealth.toFixed(0)}%</span>
              </div>
              <Progress 
                percent={stockHealth}
                status={stockHealth > 80 ? 'success' : stockHealth > 50 ? 'normal' : 'exception'}
              />
            </div>

            {data.low_stock_items > 0 && (
              <div style={{ 
                marginTop: 16, 
                padding: 12, 
                background: '#fff7e6', 
                border: '1px solid #ffd591',
                borderRadius: 4 
              }}>
                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                <span style={{ color: '#ad6800' }}>
                  Se requiere reabastecimiento urgente de {data.low_stock_items} productos
                </span>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="📊 Distribución de Inventario">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={inventoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Gráficos de Tendencias */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 Actividad Semanal">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" orientation="left" stroke="#1890ff" />
                <YAxis yAxisId="right" orientation="right" stroke="#52c41a" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="ventas" fill="#1890ff" name="Ventas ($)" />
                <Bar yAxisId="right" dataKey="pedidos" fill="#52c41a" name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="🔔 Actividad Reciente" bodyStyle={{ padding: 0 }}>
            <List
              itemLayout="horizontal"
              dataSource={recentActivity}
              renderItem={item => (
                <List.Item style={{ padding: '12px 24px' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: item.color }}>
                        {item.icon}
                      </Avatar>
                    }
                    title={item.title}
                    description={
                      <>
                        <div>{item.description}</div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          <ClockCircleOutlined /> hace {item.time}
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Top Productos */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="🏆 Top Productos por Stock">
            <Table
              columns={topProductsColumns}
              dataSource={productsTableData}
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Métricas Adicionales */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tasa de Cumplimiento"
              value={95.6}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tiempo Promedio Entrega"
              value={2.4}
              precision={1}
              suffix="horas"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Ahorro en Rutas"
              value={18.5}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
