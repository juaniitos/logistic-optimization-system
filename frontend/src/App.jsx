import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppHeader from './components/Header'
import AppSidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import RoutesOptimization from './pages/RoutesOptimization'
import Inventory from './pages/Inventory'
import Analytics from './pages/Analytics'
import Drivers from './pages/Drivers'
import Locations from './pages/Locations'
import RouteAssignments from './pages/RouteAssignments'
import './App.css'

const { Content } = Layout

// Layout con Header y Sidebar
const MainLayout = ({ children }) => (
  <Layout style={{ minHeight: '100vh' }}>
    <AppHeader />
    <Layout>
      <AppSidebar />
      <Layout style={{ padding: '24px' }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  </Layout>
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/dashboard" replace />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/routes"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoutesOptimization />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/drivers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Drivers />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/locations"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Locations />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RouteAssignments />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Inventory />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Analytics />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
