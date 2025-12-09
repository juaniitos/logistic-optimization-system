import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  LineChartOutlined,
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  SwapOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/routes',
      icon: <EnvironmentOutlined />,
      label: 'Optimización de Rutas',
    },
    {
      key: 'logistics',
      icon: <CarOutlined />,
      label: 'Logística',
      children: [
        {
          key: '/drivers',
          icon: <UserOutlined />,
          label: 'Transportistas',
        },
        {
          key: '/locations',
          icon: <ShopOutlined />,
          label: 'Bodegas y Destinos',
        },
        {
          key: '/assignments',
          icon: <SwapOutlined />,
          label: 'Asignación de Rutas',
        },
      ],
    },
    {
      key: '/inventory',
      icon: <DatabaseOutlined />,
      label: 'Inventario',
    },
    {
      key: '/analytics',
      icon: <LineChartOutlined />,
      label: 'Análisis y Predicciones',
    },
  ]

  const handleMenuClick = (e) => {
    navigate(e.key)
  }

  // Determinar qué menú padre está abierto
  const getOpenKeys = () => {
    if (['/drivers', '/locations', '/assignments'].includes(location.pathname)) {
      return ['logistics']
    }
    return []
  }

  return (
    <Sider width={250} className="site-layout-background">
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={getOpenKeys()}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  )
}

export default AppSidebar
