import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true)
  const { rol } = useAuth()
  const location = useLocation()

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  // Update CSS custom property when sidebar state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isExpanded ? '240px' : '60px'
    )
  }, [isExpanded])

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
        ≡
      </button>

      {isExpanded && (
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
            Inicio
          </Link>
          <Link to="/mesas" className={`sidebar-link ${isActive('/mesas') ? 'active' : ''}`}>
            Mesas
          </Link>
          <Link to="/floorplan" className={`sidebar-link ${isActive('/floorplan') ? 'active' : ''}`}>
            Plano de Sala
          </Link>
          <Link to="/productos" className={`sidebar-link ${isActive('/productos') ? 'active' : ''}`}>
            Productos
          </Link>
          <Link to="/pedidos" className={`sidebar-link ${isActive('/pedidos') ? 'active' : ''}`}>
            Pedidos
          </Link>
          <Link to="/cocina" className={`sidebar-link ${isActive('/cocina') ? 'active' : ''}`}>
            Cocina
          </Link>
          <Link to="/facturas" className={`sidebar-link ${isActive('/facturas') ? 'active' : ''}`}>
            Facturas
          </Link>
          <Link to="/inventario" className={`sidebar-link ${isActive('/inventario') ? 'active' : ''}`}>
            Inventario
          </Link>
          <Link to="/reservas" className={`sidebar-link ${isActive('/reservas') ? 'active' : ''}`}>
            Reservas
          </Link>
          <Link to="/reportes" className={`sidebar-link ${isActive('/reportes') ? 'active' : ''}`}>
            Reportes
          </Link>
          {(rol === 'ADMIN' || rol === 'CAJA') && (
            <Link to="/cierre-caja" className={`sidebar-link ${isActive('/cierre-caja') ? 'active' : ''}`}>
              Cierre de Caja
            </Link>
          )}
          {rol === 'ADMIN' && (
            <Link to="/staff" className={`sidebar-link ${isActive('/staff') ? 'active' : ''}`}>
              Personal
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}

export default Sidebar
