import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => setHealthStatus(data.status))
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="alert alert-error">
        Error al cargar estado del sistema: {error}
      </div>
    )
  }

  return (
    <div>
      <div className="home-hero">
        <h1>Sailor</h1>
        <p>Sistema de Gestión de Restaurante y Bar</p>
        {healthStatus && (
          <div className="alert alert-success">
            Estado del Sistema: <strong>{healthStatus}</strong>
          </div>
        )}
        {!healthStatus && <div className="loading">Verificando estado del sistema</div>}
      </div>

      <div className="quick-links">
        <Link to="/mesas" className="quick-link-card">
          <h3>Mesas</h3>
          <p>Gestión de mesas y espacios</p>
        </Link>

        <Link to="/productos" className="quick-link-card">
          <h3>Productos</h3>
          <p>Catálogo de productos y bebidas</p>
        </Link>

        <Link to="/pedidos" className="quick-link-card">
          <h3>Pedidos</h3>
          <p>Crear y gestionar pedidos</p>
        </Link>

        <Link to="/cocina" className="quick-link-card">
          <h3>Cocina</h3>
          <p>Vista de cocina y estado de pedidos</p>
        </Link>

        <Link to="/facturas" className="quick-link-card">
          <h3>Facturas</h3>
          <p>Facturación y pagos</p>
        </Link>

        <Link to="/inventario" className="quick-link-card">
          <h3>Inventario</h3>
          <p>Insumos, stock y recetas</p>
        </Link>

        <Link to="/reservas" className="quick-link-card">
          <h3>Reservas</h3>
          <p>Reservaciones de mesas</p>
        </Link>

        <Link to="/reportes" className="quick-link-card">
          <h3>Reportes</h3>
          <p>Análisis y reportes del negocio</p>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
