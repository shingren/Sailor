import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
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

function App() {
  const { isAuthenticated, email, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Don't show navbar on login page
  const showNav = location.pathname !== '/login'

  return (
    <div className="app-container">
      {showNav && (
        <nav className="navbar">
          <div className="navbar-content">
            <Link to="/" className="navbar-brand">Sailor</Link>
            <div className="navbar-links">
              <Link to="/">Home</Link>
              <Link to="/mesas">Mesas</Link>
              <Link to="/productos">Productos</Link>
              <Link to="/pedidos">Pedidos</Link>
              <Link to="/cocina">Cocina</Link>
              <Link to="/facturas">Facturas</Link>
              <Link to="/inventario">Inventario</Link>
              <Link to="/reservas">Reservas</Link>
              <Link to="/reportes">Reportes</Link>
            </div>
            {isAuthenticated && (
              <div className="navbar-user">
                <span className="navbar-email">{email}</span>
                <button onClick={handleLogout} className="btn-secondary btn-small">
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      <div className={showNav ? "main-content" : ""}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/mesas" element={<MesasPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/cocina" element={<CocinaPage />} />
          <Route path="/facturas" element={<FacturasPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
