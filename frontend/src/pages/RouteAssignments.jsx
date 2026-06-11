import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Select, InputNumber,
  message, Popconfirm, Row, Col, Statistic, Input, Tooltip, Divider,
  Timeline, Empty, Alert
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, CarOutlined, UserOutlined,
  CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined,
  StopOutlined, ReloadOutlined, SearchOutlined, EnvironmentOutlined,
  ThunderboltOutlined, BarChartOutlined
} from '@ant-design/icons'
import {
  getDrivers, getRoutes, getRouteAssignments, createRouteAssignment,
  updateAssignmentStatus, deleteRouteAssignment, getInventoryItems,
  getProducts, getWarehouses, createRoute, optimizeSavedRoute
} from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

function RouteAssignments() {
  const [assignments, setAssignments] = useState([])
  const [drivers, setDrivers] = useState([])
  const [routes, setRoutes] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [optimizationModalVisible, setOptimizationModalVisible] = useState(false)
  const [selectedOptimizationRoute, setSelectedOptimizationRoute] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [optimizingRouteId, setOptimizingRouteId] = useState(null)
  const [form] = Form.useForm()
  const selectedInventoryItemId = Form.useWatch('inventory_item_id', form)
  const selectedOriginWarehouseId = Form.useWatch('origin_warehouse_id', form)
  const selectedRouteMode = Form.useWatch('route_mode', form)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [assignmentsData, driversData, routesData, inventoryData, productsData, warehousesData] = await Promise.all([
        getRouteAssignments(statusFilter ? { status: statusFilter } : {}),
        getDrivers(),
        getRoutes(),
        getInventoryItems(),
        getProducts(),
        getWarehouses()
      ])
      setAssignments(assignmentsData)
      setDrivers(driversData)
      setRoutes(routesData)
      setInventoryItems(inventoryData)
      setProducts(productsData)
      setWarehouses(warehousesData)
    } catch (error) {
      console.error('Error loading data:', error)
      message.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      route_mode: 'new',
      use_road_routing: true
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      const payload = { ...values }
      if (payload.route_mode === 'new') {
        const route = await createRoute({
          origin_warehouse_id: payload.origin_warehouse_id,
          destination_warehouse_ids: payload.destination_warehouse_ids,
          route_name: payload.route_name,
          use_road_routing: payload.use_road_routing !== false
        })
        payload.route_id = route.id
      }

      if (!payload.inventory_item_id) {
        delete payload.inventory_item_id
        delete payload.inventory_quantity
      } else {
        payload.inventory_quantity = Number(payload.inventory_quantity)
      }
      delete payload.route_mode
      delete payload.origin_warehouse_id
      delete payload.destination_warehouse_ids
      delete payload.route_name
      delete payload.use_road_routing

      await createRouteAssignment(payload)
      message.success('Ruta asignada correctamente')
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al asignar ruta')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateAssignmentStatus(id, newStatus)
      const messages = {
        in_progress: 'Ruta iniciada',
        completed: 'Ruta completada',
        cancelled: 'Ruta cancelada'
      }
      message.success(messages[newStatus] || 'Estado actualizado')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al actualizar estado')
    }
  }

  const handleOptimizeRoute = async (record) => {
    setOptimizingRouteId(record.route_id)
    try {
      const result = await optimizeSavedRoute(record.route_id)
      const saved = result.optimization?.distance_saved_km || 0
      message.success(saved > 0
        ? `Ruta optimizada: ${saved.toFixed(2)} km ahorrados`
        : 'Ruta optimizada correctamente'
      )
      loadData()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al optimizar ruta')
    } finally {
      setOptimizingRouteId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteRouteAssignment(id)
      message.success('Asignación eliminada')
      loadData()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al eliminar asignación')
    }
  }

  const getStatusTag = (status) => {
    const statusConfig = {
      assigned: { color: 'blue', icon: <ClockCircleOutlined />, text: 'Asignada' },
      in_progress: { color: 'orange', icon: <PlayCircleOutlined />, text: 'En Progreso' },
      completed: { color: 'green', icon: <CheckCircleOutlined />, text: 'Completada' },
      cancelled: { color: 'red', icon: <StopOutlined />, text: 'Cancelada' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const stats = {
    total: assignments.length,
    assigned: assignments.filter(a => a.status === 'assigned').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length
  }

  // Obtener info de driver y ruta para mostrar en la tabla
  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId)
    return driver ? `${driver.first_name} ${driver.last_name}` : `Driver #${driverId}`
  }

  const getRouteName = (routeId) => {
    const route = routes.find(r => r.id === routeId)
    return route ? (route.route_name || `Ruta #${routeId}`) : `Ruta #${routeId}`
  }

  const getRouteStops = (routeId) => {
    const route = routes.find(r => r.id === routeId)
    if (!route?.route_data) return null

    try {
      const routeData = JSON.parse(route.route_data)
      return routeData.ordered_stop_names?.join(' -> ') || null
    } catch {
      return null
    }
  }

  const getRouteData = (routeId) => {
    const route = routes.find(r => r.id === routeId)
    if (!route?.route_data) return null

    try {
      return JSON.parse(route.route_data)
    } catch {
      return null
    }
  }

  const getRouteOptimizationStatus = (routeId) => {
    const routeData = getRouteData(routeId)
    return routeData?.optimized_at ? routeData.optimization_summary : null
  }

  const handleShowOptimization = (routeId) => {
    const route = routes.find(r => r.id === routeId)
    const routeData = getRouteData(routeId)
    setSelectedOptimizationRoute({ route, routeData })
    setOptimizationModalVisible(true)
  }

  const getProduct = (productId) => products.find(product => product.id === productId)
  const getWarehouse = (warehouseId) => warehouses.find(warehouse => warehouse.id === warehouseId)
  const getInventoryItem = (inventoryItemId) => inventoryItems.find(item => item.id === inventoryItemId)

  const getInventoryLabel = (inventoryItemId) => {
    const item = getInventoryItem(inventoryItemId)
    if (!item) return 'Sin inventario'

    const product = getProduct(item.product_id)
    const warehouse = getWarehouse(item.warehouse_id)
    return `${product?.name || `Producto #${item.product_id}`} - ${warehouse?.name || `Bodega #${item.warehouse_id}`}`
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: 'Transportista',
      dataIndex: 'driver_id',
      key: 'driver_id',
      render: (driverId) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          {getDriverName(driverId)}
        </Space>
      )
    },
    {
      title: 'Ruta',
      dataIndex: 'route_id',
      key: 'route_id',
      render: (routeId) => {
        const optimization = getRouteOptimizationStatus(routeId)
        return (
        <Space direction="vertical" size={0}>
          <Space>
          <EnvironmentOutlined style={{ color: '#52c41a' }} />
          {getRouteName(routeId)}
          {optimization && (
            <Tag color="green">Optimizada</Tag>
          )}
          </Space>
          {getRouteStops(routeId) && (
            <small style={{ color: '#888' }}>{getRouteStops(routeId)}</small>
          )}
          {optimization && (
            <small style={{ color: '#52c41a' }}>
              Ahorro: {Number(optimization.distance_saved_km || 0).toFixed(2)} km
            </small>
          )}
        </Space>
        )
      }
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Asignada', value: 'assigned' },
        { text: 'En Progreso', value: 'in_progress' },
        { text: 'Completada', value: 'completed' },
        { text: 'Cancelada', value: 'cancelled' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Carga',
      key: 'inventory',
      render: (_, record) => record.inventory_item_id ? (
        <Space direction="vertical" size={0}>
          <span>{getInventoryLabel(record.inventory_item_id)}</span>
          <small style={{ color: '#888' }}>
            {record.inventory_quantity || 0} unidades
            {record.inventory_dispatched ? ' despachadas' : ' asignadas'}
          </small>
        </Space>
      ) : (
        <Tag>Sin carga</Tag>
      )
    },
    {
      title: 'Asignada',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Iniciada',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Completada',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space wrap>
          {record.status === 'assigned' && (
            <>
              <Button
                size="small"
                icon={<ThunderboltOutlined />}
                loading={optimizingRouteId === record.route_id}
                onClick={() => handleOptimizeRoute(record)}
              >
                Optimizar
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStatusChange(record.id, 'in_progress')}
              >
                Iniciar
              </Button>
            </>
          )}
          {getRouteOptimizationStatus(record.route_id) && (
            <Button
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => handleShowOptimization(record.route_id)}
            >
              Ver optimización
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleStatusChange(record.id, 'completed')}
            >
              Completar
            </Button>
          )}
          {(record.status === 'assigned' || record.status === 'in_progress') && (
            <Popconfirm
              title="¿Cancelar asignación?"
              onConfirm={() => handleStatusChange(record.id, 'cancelled')}
              okText="Sí"
              cancelText="No"
            >
              <Button size="small" danger icon={<StopOutlined />}>
                Cancelar
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="¿Eliminar asignación?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // Obtener transportistas disponibles (que no tengan asignaciones activas)
  const getAvailableDrivers = () => {
    const busyDriverIds = assignments
      .filter(a => a.status === 'assigned' || a.status === 'in_progress')
      .map(a => a.driver_id)
    return drivers.filter(d => !busyDriverIds.includes(d.id) && d.status === 'available')
  }

  // Obtener rutas disponibles (que no tengan asignaciones activas)
  const getAvailableRoutes = () => {
    const assignedRouteIds = assignments
      .filter(a => a.status === 'assigned' || a.status === 'in_progress')
      .map(a => a.route_id)
    return routes.filter(r => !assignedRouteIds.includes(r.id))
  }

  const getDestinationOptions = () => (
    warehouses.filter(warehouse => warehouse.id !== selectedOriginWarehouseId)
  )

  const getAvailableInventoryItems = () => (
    inventoryItems.filter(item => item.is_active !== false && item.quantity > 0)
  )

  const selectedInventoryItem = selectedInventoryItemId
    ? getInventoryItem(selectedInventoryItemId)
    : null

  return (
    <div>
      <h1>📋 Asignación de Rutas</h1>
      <p>Asigna rutas a los transportistas y gestiona el progreso de las entregas</p>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Asignaciones"
              value={stats.total}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Asignadas"
              value={stats.assigned}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="En Progreso"
              value={stats.inProgress}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Completadas"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerta informativa */}
      {drivers.length === 0 && (
        <Alert
          message="No hay transportistas disponibles"
          description="Agrega transportistas primero para poder asignarles rutas."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Tabla de Asignaciones */}
      <Card
        title="Lista de Asignaciones"
        extra={
          <Space>
            <Select
              placeholder="Filtrar por estado"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="assigned">Asignada</Option>
              <Option value="in_progress">En Progreso</Option>
              <Option value="completed">Completada</Option>
              <Option value="cancelled">Cancelada</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              disabled={getAvailableDrivers().length === 0}
            >
              Nueva Ruta
            </Button>
          </Space>
        }
      >
        {assignments.length > 0 ? (
          <Table
            columns={columns}
            dataSource={assignments}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total: ${total} asignaciones`
            }}
          />
        ) : (
          <Empty
            description="No hay asignaciones"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={handleCreate} disabled={getAvailableDrivers().length === 0}>
              Crear Primera Ruta
            </Button>
          </Empty>
        )}
      </Card>

      {/* Resumen de Transportistas Disponibles */}
      <Card title="Transportistas Disponibles" style={{ marginTop: 16 }}>
        {getAvailableDrivers().length > 0 ? (
          <Row gutter={[16, 16]}>
            {getAvailableDrivers().map(driver => (
              <Col xs={24} sm={12} md={8} lg={6} key={driver.id}>
                <Card size="small" hoverable>
                  <Space direction="vertical" size="small">
                    <div>
                      <UserOutlined style={{ marginRight: 8 }} />
                      <strong>{driver.first_name} {driver.last_name}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Licencia: {driver.license_number}
                    </div>
                    <Tag color="green">Disponible</Tag>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No hay transportistas disponibles" />
        )}
      </Card>

      {/* Modal de Nueva Asignación */}
      <Modal
        title="Nueva Ruta"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="driver_id"
            label="Transportista"
            rules={[{ required: true, message: 'Seleccione un transportista' }]}
          >
            <Select
              placeholder="Seleccione un transportista"
              showSearch
              optionFilterProp="children"
            >
              {getAvailableDrivers().map(driver => (
                <Option key={driver.id} value={driver.id}>
                  <Space>
                    <UserOutlined />
                    {driver.first_name} {driver.last_name}
                    <Tag size="small">{driver.license_type || 'N/A'}</Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">Ruta y destinos</Divider>

          <Form.Item
            name="route_mode"
            label="Tipo de ruta"
            rules={[{ required: true, message: 'Seleccione el tipo de ruta' }]}
          >
            <Select>
              <Option value="new">Nueva ruta con varios destinos</Option>
              <Option value="existing">Ruta guardada</Option>
            </Select>
          </Form.Item>

          {selectedRouteMode === 'existing' ? (
            <Form.Item
              name="route_id"
              label="Ruta"
              rules={[{ required: true, message: 'Seleccione una ruta' }]}
            >
              <Select
                placeholder="Seleccione una ruta"
                showSearch
                optionFilterProp="label"
              >
                {getAvailableRoutes().map(route => (
                  <Option
                    key={route.id}
                    value={route.id}
                    label={route.route_name || `Ruta #${route.id}`}
                  >
                    <Space direction="vertical" size={0}>
                      <Space>
                        <EnvironmentOutlined />
                        {route.route_name || `Ruta #${route.id}`}
                        {route.total_distance && (
                          <Tag size="small">{route.total_distance.toFixed(1)} km</Tag>
                        )}
                      </Space>
                      {getRouteStops(route.id) && (
                        <small style={{ color: '#888' }}>{getRouteStops(route.id)}</small>
                      )}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="route_name"
                label="Nombre de la ruta (opcional)"
              >
                <Input placeholder="Ej. Ruta Península Norte" />
              </Form.Item>

              <Form.Item
                name="origin_warehouse_id"
                label="Origen"
                rules={[{ required: true, message: 'Seleccione el punto de origen' }]}
              >
                <Select
                  placeholder="Seleccione origen"
                  showSearch
                  optionFilterProp="label"
                  onChange={() => form.setFieldValue('destination_warehouse_ids', [])}
                >
                  {warehouses.map(warehouse => (
                    <Option key={warehouse.id} value={warehouse.id} label={warehouse.name}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="destination_warehouse_ids"
                label="Destinos"
                rules={[{ required: true, message: 'Seleccione uno o más destinos' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="Seleccione destinos"
                  showSearch
                  optionFilterProp="label"
                  disabled={!selectedOriginWarehouseId}
                >
                  {getDestinationOptions().map(warehouse => (
                    <Option key={warehouse.id} value={warehouse.id} label={warehouse.name}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="use_road_routing"
                label="Tipo de cálculo"
              >
                <Select>
                  <Option value={true}>Rutas por carretera</Option>
                  <Option value={false}>Distancia directa</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Divider orientation="left">Inventario a despachar</Divider>

          <Form.Item
            name="inventory_item_id"
            label="Inventario"
          >
            <Select
              placeholder="Seleccione inventario"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={() => form.setFieldValue('inventory_quantity', null)}
            >
              {getAvailableInventoryItems().map(item => {
                const label = getInventoryLabel(item.id)
                return (
                  <Option key={item.id} value={item.id} label={label}>
                    <Space direction="vertical" size={0}>
                      <span>{label}</span>
                      <small style={{ color: '#888' }}>Disponible: {item.quantity} unidades</small>
                    </Space>
                  </Option>
                )
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="inventory_quantity"
            label="Cantidad"
            dependencies={['inventory_item_id']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const inventoryItemId = getFieldValue('inventory_item_id')
                  if (!inventoryItemId) return Promise.resolve()
                  if (!value || value <= 0) {
                    return Promise.reject(new Error('Ingrese la cantidad a despachar'))
                  }
                  const item = getInventoryItem(inventoryItemId)
                  if (item && value > item.quantity) {
                    return Promise.reject(new Error('La cantidad supera el inventario disponible'))
                  }
                  return Promise.resolve()
                }
              })
            ]}
          >
            <InputNumber
              min={1}
              max={selectedInventoryItem?.quantity}
              disabled={!selectedInventoryItem}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notas (opcional)"
          >
            <TextArea
              rows={3}
              placeholder="Instrucciones especiales, observaciones..."
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                Crear Ruta
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Detalle de Optimización"
        open={optimizationModalVisible}
        onCancel={() => setOptimizationModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setOptimizationModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={760}
      >
        {selectedOptimizationRoute?.routeData?.optimization_summary ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Space direction="vertical" size={4}>
                <strong>{selectedOptimizationRoute.route?.route_name || 'Ruta optimizada'}</strong>
                <span style={{ color: '#888' }}>
                  Método: {selectedOptimizationRoute.routeData.optimization_method || 'optimización de paradas'}
                </span>
                <span style={{ color: '#888' }}>
                  Fecha: {selectedOptimizationRoute.routeData.optimized_at
                    ? dayjs(selectedOptimizationRoute.routeData.optimized_at).format('DD/MM/YYYY HH:mm')
                    : '-'}
                </span>
              </Space>
            </Card>

            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic
                    title="Distancia original"
                    value={selectedOptimizationRoute.routeData.optimization_summary.original_distance_km || 0}
                    suffix="km"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic
                    title="Distancia optimizada"
                    value={selectedOptimizationRoute.routeData.optimization_summary.optimized_distance_km || 0}
                    suffix="km"
                    precision={2}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic
                    title="Ahorro"
                    value={selectedOptimizationRoute.routeData.optimization_summary.distance_saved_km || 0}
                    suffix="km"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card>
                  <Statistic
                    title="Mejora"
                    value={selectedOptimizationRoute.routeData.optimization_summary.distance_saved_percent || 0}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="Orden original">
                  <Timeline
                    items={(selectedOptimizationRoute.routeData.original_ordered_stop_names || []).map((name, index) => ({
                      color: index === 0 ? 'green' : 'blue',
                      children: `${index + 1}. ${name}`
                    }))}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card size="small" title="Orden optimizado">
                  <Timeline
                    items={(selectedOptimizationRoute.routeData.ordered_stop_names || []).map((name, index) => ({
                      color: index === 0 ? 'green' : 'blue',
                      children: `${index + 1}. ${name}`
                    }))}
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        ) : (
          <Empty description="Esta ruta todavía no tiene datos de optimización" />
        )}
      </Modal>
    </div>
  )
}

export default RouteAssignments
