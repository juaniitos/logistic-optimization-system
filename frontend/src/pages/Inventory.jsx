import { Table, Card, Tag, Button } from 'antd'
import { useEffect, useState } from 'react'
import { getInventoryItems } from '../services/api'

function Inventory() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const result = await getInventoryItems()
      setData(result)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Almacén',
      dataIndex: 'warehouse_id',
      key: 'warehouse_id',
    },
    {
      title: 'Producto',
      dataIndex: 'product_id',
      key: 'product_id',
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
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
        return (
          <Tag color={isLowStock ? 'red' : 'green'}>
            {isLowStock ? 'Bajo Stock' : 'Normal'}
          </Tag>
        )
      },
    },
  ]

  return (
    <div>
      <h1>Gestión de Inventario</h1>
      <Card style={{ marginTop: 24 }}>
        <Button
          type="primary"
          style={{ marginBottom: 16 }}
          onClick={loadInventory}
        >
          Actualizar
        </Button>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  )
}

export default Inventory
