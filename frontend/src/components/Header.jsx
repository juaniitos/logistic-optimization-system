import { Layout, Button, Dropdown, Avatar, Space } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Header } = Layout

function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.full_name || user?.username || 'Usuario',
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
      danger: true
    }
  ]

  return (
    <Header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px'
    }}>
      <div className="logo">
        🚚 Sistema de Optimización Logística - UPSE
      </div>
      
      {user && (
        <Space>
          <span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
            {user.username}
            {user.is_admin && <span style={{ marginLeft: 8, color: '#52c41a' }}>👑 Admin</span>}
          </span>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar 
              style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Space>
      )}
    </Header>
  )
}

export default AppHeader
