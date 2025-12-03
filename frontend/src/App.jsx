import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import HomePage from './HomePage'
import MesasPage from './MesasPage'
import ProductosPage from './ProductosPage'
import PedidosPage from './PedidosPage'
import CocinaPage from './CocinaPage'
import FacturasPage from './FacturasPage'
import InventarioPage from './InventarioPage'
import ReservasPage from './ReservasPage'
import ReportesPage from './ReportesPage'
import LoginPage from './LoginPage'
import NotAuthorized from './NotAuthorized'
import StaffPage from './StaffPage'
import CierreCajaPage from './CierreCajaPage'
import FloorplanPage from './FloorplanPage'

// Helper component for role-based route protection
function ProtectedRoute({ children, allowedRoles }) {
  const { rol } = useAuth()

  if (!allowedRoles.includes(rol)) {
    return <NotAuthorized />
  }

  return children
}

// Layout wrapper for authenticated pages
function AuthenticatedLayout({ children }) {
  const { email, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-title">Sailor</div>
          <div className="navbar-user">
            <span className="navbar-email">{email}</span>
            <button onClick={handleLogout} className="btn-secondary btn-small">
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <TopBar />

      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Login page - no layout wrapper */}
      <Route path="/login" element={<LoginPage />} />

      {/* All other routes use authenticated layout */}
      <Route path="/" element={
        <AuthenticatedLayout>
          <HomePage />
        </AuthenticatedLayout>
      } />

      {/* MESAS - ADMIN, MESERO */}
      <Route path="/mesas" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <MesasPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* FLOORPLAN - ADMIN, MESERO */}
      <Route path="/floorplan" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <FloorplanPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* PRODUCTOS - ADMIN only */}
      <Route path="/productos" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <ProductosPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* PEDIDOS - ADMIN, MESERO */}
      <Route path="/pedidos" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <PedidosPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* COCINA - ADMIN, MESERO, COCINA */}
      <Route path="/cocina" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO', 'COCINA']}>
            <CocinaPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* FACTURAS - ADMIN, CAJA */}
      <Route path="/facturas" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'CAJA']}>
            <FacturasPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* INVENTARIO - ADMIN, INVENTARIO */}
      <Route path="/inventario" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'INVENTARIO']}>
            <InventarioPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* RESERVAS - ADMIN, MESERO */}
      <Route path="/reservas" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
            <ReservasPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* REPORTES - ADMIN, GERENCIA */}
      <Route path="/reportes" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'GERENCIA']}>
            <ReportesPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* CIERRE CAJA - ADMIN, CAJA */}
      <Route path="/cierre-caja" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN', 'CAJA']}>
            <CierreCajaPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />

      {/* STAFF - ADMIN only */}
      <Route path="/staff" element={
        <AuthenticatedLayout>
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <StaffPage />
          </ProtectedRoute>
        </AuthenticatedLayout>
      } />
    </Routes>
  )
}

export default App
