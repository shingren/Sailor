import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import HomePage from './HomePage'
import MesasPage from './MesasPage'
import ProductosPage from './ProductosPage'
import PedidosPage from './PedidosPage'
import CocinaPage from './CocinaPage'
import FacturasPage from './FacturasPage'
import InventarioPage from './InventarioPage'
import ReservasPage from './ReservasPage'
import LoginPage from './LoginPage'

function App() {
  const { isAuthenticated, email, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | <Link to="/mesas">Mesas</Link> | <Link to="/productos">Productos</Link> | <Link to="/pedidos">Pedidos</Link> | <Link to="/cocina">Cocina</Link> | <Link to="/facturas">Facturas</Link> | <Link to="/inventario">Inventario</Link> | <Link to="/reservas">Reservas</Link> | <Link to="/login">Login</Link>
        {isAuthenticated && (
          <span>
            {' '}| Logged in as {email} | <button onClick={handleLogout}>Logout</button>
          </span>
        )}
      </nav>
      <hr />
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
      </Routes>
    </div>
  )
}

export default App
