import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Statistic, DatePicker, Tooltip, Divider
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined,
  CarOutlined, PhoneOutlined, MailOutlined, IdcardOutlined,
  CheckCircleOutlined, ClockCircleOutlined, StopOutlined,
  ReloadOutlined, SearchOutlined
} from '@ant-design/icons'
import { getDrivers, createDriver, updateDriver, deleteDriver, updateDriverStatus } from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select

function Drivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDriver, setEditingDriver] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDrivers()
  }, [statusFilter])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const data = await getDrivers(params)
      setDrivers(data)
    } catch (error) {
      message.error('Error al cargar transportistas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingDriver(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingDriver(record)
    form.setFieldsValue({
      ...record,
      license_expiry: record.license_expiry ? dayjs(record.license_expiry) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteDriver(id)
      message.success('Transportista eliminado correctamente')
      loadDrivers()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al eliminar transportista')
    }
  }

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        license_expiry: values.license_expiry ? values.license_expiry.toISOString() : null
      }

      if (editingDriver) {
        await updateDriver(editingDriver.id, data)
        message.success('Transportista actualizado correctamente')
      } else {
        await createDriver(data)
        message.success('Transportista creado correctamente')
      }
      setModalVisible(false)
      loadDrivers()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al guardar transportista')
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDriverStatus(id, newStatus)
      message.success('Estado actualizado')
      loadDrivers()
    } catch (error) {
      message.error('Error al actualizar estado')
    }
  }

  const getStatusTag = (status) => {
    const statusConfig = {
      available: { color: 'green', icon: <CheckCircleOutlined />, text: 'Disponible' },
      on_route: { color: 'blue', icon: <CarOutlined />, text: 'En Ruta' },
      off_duty: { color: 'orange', icon: <ClockCircleOutlined />, text: 'Fuera de Servicio' },
      inactive: { color: 'red', icon: <StopOutlined />, text: 'Inactivo' }
    }
    const config = statusConfig[status] || { color: 'default', text: status }
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const filteredDrivers = drivers.filter(driver => {
    const searchLower = searchText.toLowerCase()
    return (
      driver.first_name.toLowerCase().includes(searchLower) ||
      driver.last_name.toLowerCase().includes(searchLower) ||
      driver.id_number.toLowerCase().includes(searchLower) ||
      driver.license_number.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    onRoute: drivers.filter(d => d.status === 'on_route').length,
    offDuty: drivers.filter(d => d.status === 'off_duty').length
  }

  const columns = [
    {
      title: 'Nombre Completo',
      key: 'name',
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>
            {record.first_name} {record.last_name}
          </span>
        </Space>
      ),
      sorter: (a, b) => a.first_name.localeCompare(b.first_name)
    },
    {
      title: 'Cédula/DNI',
      dataIndex: 'id_number',
      key: 'id_number',
      render: (text) => (
        <Space>
          <IdcardOutlined />
          {text}
        </Space>
      )
    },
    {
      title: 'Licencia',
      key: 'license',
      render: (_, record) => (
        <div>
          <div><strong>{record.license_number}</strong></div>
          <small style={{ color: '#888' }}>Tipo: {record.license_type || 'N/A'}</small>
        </div>
      )
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          {record.phone && (
            <div><PhoneOutlined /> {record.phone}</div>
          )}
          {record.email && (
            <div><MailOutlined /> {record.email}</div>
          )}
        </div>
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Disponible', value: 'available' },
        { text: 'En Ruta', value: 'on_route' },
        { text: 'Fuera de Servicio', value: 'off_duty' },
        { text: 'Inactivo', value: 'inactive' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 280,
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
          
          <Select
            value={record.status}
            onChange={(value) => handleStatusChange(record.id, value)}
            size="small"
            style={{ width: 130 }}
          >
            <Option value="available">Disponible</Option>
            <Option value="on_route">En Ruta</Option>
            <Option value="off_duty">Fuera Servicio</Option>
            <Option value="inactive">Inactivo</Option>
          </Select>

          <Popconfirm
            title="¿Eliminar transportista?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <h1>🚛 Gestión de Transportistas</h1>
      <p>Administra los transportistas, sus datos personales y asignaciones</p>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Transportistas"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Disponibles"
              value={stats.available}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="En Ruta"
              value={stats.onRoute}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Fuera de Servicio"
              value={stats.offDuty}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Transportistas */}
      <Card
        title="Lista de Transportistas"
        extra={
          <Space>
            <Input
              placeholder="Buscar..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDrivers}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Nuevo Transportista
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredDrivers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} transportistas`
          }}
        />
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        title={editingDriver ? 'Editar Transportista' : 'Nuevo Transportista'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'available',
            is_active: true
          }}
        >
          <Divider orientation="left">Datos Personales</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label="Nombre"
                rules={[{ required: true, message: 'El nombre es requerido' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nombre" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label="Apellido"
                rules={[{ required: true, message: 'El apellido es requerido' }]}
              >
                <Input placeholder="Apellido" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id_number"
                label="Cédula/DNI"
                rules={[{ required: true, message: 'La cédula es requerida' }]}
              >
                <Input prefix={<IdcardOutlined />} placeholder="0912345678" disabled={!!editingDriver} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Teléfono"
              >
                <Input prefix={<PhoneOutlined />} placeholder="0991234567" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Email inválido' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="email@ejemplo.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="Dirección"
              >
                <Input placeholder="Dirección completa" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Datos de Licencia</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="license_number"
                label="Número de Licencia"
                rules={[{ required: true, message: 'La licencia es requerida' }]}
              >
                <Input placeholder="LIC-123456" disabled={!!editingDriver} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="license_type"
                label="Tipo de Licencia"
              >
                <Select placeholder="Seleccione tipo">
                  <Option value="A">Tipo A - Motocicleta</Option>
                  <Option value="B">Tipo B - Automóvil</Option>
                  <Option value="C">Tipo C - Camión</Option>
                  <Option value="D">Tipo D - Bus</Option>
                  <Option value="E">Tipo E - Trailer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="license_expiry"
                label="Fecha de Vencimiento"
              >
                <DatePicker style={{ width: '100%' }} placeholder="Seleccione fecha" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Estado</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Estado"
              >
                <Select>
                  <Option value="available">Disponible</Option>
                  <Option value="on_route">En Ruta</Option>
                  <Option value="off_duty">Fuera de Servicio</Option>
                  <Option value="inactive">Inactivo</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Activo"
              >
                <Select>
                  <Option value={true}>Sí</Option>
                  <Option value={false}>No</Option>
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
                {editingDriver ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Drivers


