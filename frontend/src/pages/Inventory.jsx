import { useEffect, useState } from 'react'
import {
  Button, Card, Col, Form, InputNumber, Modal, Popconfirm, Row,
  Select, Space, Statistic, Table, Tag, Tooltip, message
} from 'antd'
import {
  CheckCircleOutlined, DeleteOutlined, EditOutlined, InboxOutlined,
  PlusOutlined, ReloadOutlined, StopOutlined
} from '@ant-design/icons'
import {
  createInventoryItem, getInventoryItems, getProducts, getWarehouses,
  updateInventoryItem, updateInventoryItemStatus
} from '../services/api'

const { Option } = Select

function Inventory() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const [items, productsData, warehousesData] = await Promise.all([
        getInventoryItems({ include_inactive: true }),
        getProducts(),
        getWarehouses()
      ])
      setData(items)
      setProducts(productsData)
      setWarehouses(warehousesData)
    } catch (error) {
      console.error('Error loading inventory:', error)
      message.error('Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      quantity: 0,
      min_stock: 10,
      max_stock: 1000,
      reorder_point: 20,
      is_active: true
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        quantity: Number(values.quantity),
        min_stock: Number(values.min_stock),
        max_stock: Number(values.max_stock),
        reorder_point: Number(values.reorder_point)
      }

      if (editingItem) {
        await updateInventoryItem(editingItem.id, payload)
        message.success('Inventario actualizado correctamente')
      } else {
        await createInventoryItem(payload)
        message.success('Inventario agregado correctamente')
      }

      setModalVisible(false)
      loadInventory()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al guardar inventario')
    }
  }

  const handleStatusChange = async (record, isActive) => {
    try {
      await updateInventoryItemStatus(record.id, isActive)
      message.success(isActive ? 'Inventario habilitado' : 'Inventario deshabilitado')
      loadInventory()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al actualizar estado')
    }
  }

  const getProduct = (productId) => products.find(product => product.id === productId)
  const getWarehouse = (warehouseId) => warehouses.find(warehouse => warehouse.id === warehouseId)

  const stats = {
    total: data.length,
    active: data.filter(item => item.is_active).length,
    lowStock: data.filter(item => item.is_active && item.quantity <= item.reorder_point).length,
    units: data.filter(item => item.is_active).reduce((sum, item) => sum + item.quantity, 0)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70
    },
    {
      title: 'Bodega',
      dataIndex: 'warehouse_id',
      key: 'warehouse_id',
      render: (warehouseId) => getWarehouse(warehouseId)?.name || `Bodega #${warehouseId}`
    },
    {
      title: 'Producto',
      dataIndex: 'product_id',
      key: 'product_id',
      render: (productId) => {
        const product = getProduct(productId)
        return product ? (
          <Space direction="vertical" size={0}>
            <strong>{product.name}</strong>
            <span style={{ fontSize: 12, color: '#888' }}>{product.sku}</span>
          </Space>
        ) : `Producto #${productId}`
      }
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: 'Stock Mínimo',
      dataIndex: 'min_stock',
      key: 'min_stock',
    },
    {
      title: 'Punto de Reorden',
      dataIndex: 'reorder_point',
      key: 'reorder_point',
    },
    {
      title: 'Estado',
      key: 'status',
      render: (_, record) => {
        const isLowStock = record.quantity <= record.reorder_point
        if (!record.is_active) {
          return <Tag color="red" icon={<StopOutlined />}>Deshabilitado</Tag>
        }
        return (
          <Tag color={isLowStock ? 'red' : 'green'}>
            {isLowStock ? 'Bajo Stock' : 'Normal'}
          </Tag>
        )
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 190,
      render: (_, record) => (
        <Space wrap>
          <Tooltip title="Editar">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          {record.is_active ? (
            <Popconfirm
              title="¿Deshabilitar inventario?"
              onConfirm={() => handleStatusChange(record, false)}
              okText="Sí"
              cancelText="No"
            >
              <Button danger size="small" icon={<DeleteOutlined />}>
                Deshabilitar
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusChange(record, true)}
            >
              Habilitar
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h1>Gestión de Inventario</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Total Items" value={stats.total} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Activos" value={stats.active} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Bajo Stock" value={stats.lowStock} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title="Unidades Activas" value={stats.units} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Lista de Inventario"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadInventory}>
              Actualizar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Añadir Inventario
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingItem ? 'Actualizar Inventario' : 'Añadir Inventario'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={640}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="warehouse_id"
                label="Bodega"
                rules={[{ required: true, message: 'Seleccione una bodega' }]}
              >
                <Select placeholder="Seleccione una bodega" showSearch optionFilterProp="label">
                  {warehouses.map(warehouse => (
                    <Option key={warehouse.id} value={warehouse.id} label={warehouse.name}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="product_id"
                label="Producto"
                rules={[{ required: true, message: 'Seleccione un producto' }]}
              >
                <Select placeholder="Seleccione un producto" showSearch optionFilterProp="label">
                  {products.map(product => (
                    <Option key={product.id} value={product.id} label={`${product.name} ${product.sku}`}>
                      {product.name} - {product.sku}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="quantity"
                label="Cantidad"
                rules={[{ required: true, message: 'Ingrese la cantidad' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="min_stock"
                label="Stock Mínimo"
                rules={[{ required: true, message: 'Ingrese el stock mínimo' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="max_stock"
                label="Stock Máximo"
                rules={[{ required: true, message: 'Ingrese el stock máximo' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="reorder_point"
                label="Punto de Reorden"
                rules={[{ required: true, message: 'Ingrese el punto de reorden' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Estado"
              >
                <Select>
                  <Option value={true}>Activo</Option>
                  <Option value={false}>Deshabilitado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingItem ? 'Actualizar' : 'Añadir'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inventory
