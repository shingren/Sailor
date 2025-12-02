import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
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

// Helper component for role-based route protection
function ProtectedRoute({ children, allowedRoles }) {
  const { rol } = useAuth()

  if (!allowedRoles.includes(rol)) {
    return <NotAuthorized />
  }

  return children
}

function App() {
  const { isAuthenticated, email, rol, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Don't show navbar on login page
  const showNav = location.pathname !== '/login'

  // Show login button when not authenticated
  return (
    <div className="app-container">
      {showNav && (
        <nav className="navbar">
          <div className="navbar-content">
            <div className="navbar-title">Sailor</div>
            {isAuthenticated ? (
              <div className="navbar-user">
                <span className="navbar-email">{email}</span>
                <button onClick={handleLogout} className="btn-secondary btn-small">
                  Logout
                </button>
              </div>
            ) : (
              <div className="navbar-user">
                <Link to="/login" className="btn-primary btn-small">
                  Login
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}

      {showNav && isAuthenticated && <TopBar />}

      <div className="app-layout">
        {showNav && isAuthenticated && <Sidebar />}
        <div className={showNav ? "main-content" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* MESAS - ADMIN, MESERO */}
          <Route path="/mesas" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
              <MesasPage />
            </ProtectedRoute>
          } />

          {/* PRODUCTOS - ADMIN only */}
          <Route path="/productos" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProductosPage />
            </ProtectedRoute>
          } />

          {/* PEDIDOS - ADMIN, MESERO */}
          <Route path="/pedidos" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
              <PedidosPage />
            </ProtectedRoute>
          } />

          {/* COCINA - ADMIN, MESERO, COCINA */}
          <Route path="/cocina" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MESERO', 'COCINA']}>
              <CocinaPage />
            </ProtectedRoute>
          } />

          {/* FACTURAS - ADMIN, CAJA */}
          <Route path="/facturas" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJA']}>
              <FacturasPage />
            </ProtectedRoute>
          } />

          {/* INVENTARIO - ADMIN, INVENTARIO */}
          <Route path="/inventario" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'INVENTARIO']}>
              <InventarioPage />
            </ProtectedRoute>
          } />

          {/* RESERVAS - ADMIN, MESERO */}
          <Route path="/reservas" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'MESERO']}>
              <ReservasPage />
            </ProtectedRoute>
          } />

          {/* REPORTES - ADMIN, GERENCIA */}
          <Route path="/reportes" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'GERENCIA']}>
              <ReportesPage />
            </ProtectedRoute>
          } />

          {/* CIERRE CAJA - ADMIN, CAJA */}
          <Route path="/cierre-caja" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJA']}>
              <CierreCajaPage />
            </ProtectedRoute>
          } />

          {/* STAFF - ADMIN only */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StaffPage />
            </ProtectedRoute>
          } />
        </Routes>
        </div>
      </div>
    </div>
  )
}

export default App
