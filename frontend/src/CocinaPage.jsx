import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function CocinaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return

    fetchActivePedidos()

    const interval = setInterval(() => {
      fetchActivePedidos()
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const fetchActivePedidos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pedidos/activos', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Failed to fetch active pedidos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError('Error fetching pedidos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    setError('')
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ estado: nuevoEstado })
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        return
      }

      if (!response.ok) {
        try {
          const errorData = await response.json()
          setError(`Failed to change estado: ${errorData.error || 'Unknown error'}`)
        } catch {
          const errorText = await response.text()
          setError(`Failed to change estado: ${errorText}`)
        }
        return
      }

      fetchActivePedidos()
    } catch (err) {
      setError('Error changing estado: ' + err.message)
    }
  }

  const getEstadoButton = (pedido) => {
    switch (pedido.estado) {
      case 'PENDIENTE':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'PREPARACION')} className="btn-primary btn-small">
            Pasar a PREPARACION
          </button>
        )
      case 'PREPARACION':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'LISTO')} className="btn-success btn-small">
            Marcar como LISTO
          </button>
        )
      case 'LISTO':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')} className="btn-secondary btn-small">
            Marcar como ENTREGADO
          </button>
        )
      case 'ENTREGADO':
        return <span>-</span>
      default:
        return <span>-</span>
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Cocina</h2>
          <p>You must log in to view this page</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Cocina - Operations Board</h1>
      <p className="text-muted" style={{ fontSize: '0.9rem' }}>Auto-refresh every 10 seconds</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Active Pedidos</h2>
        </div>
        {loading && pedidos.length === 0 ? (
          <div className="loading">Loading</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Pedido ID</th>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="6">No active pedidos</td>
                </tr>
              ) : (
                pedidos.map(pedido => (
                  <tr key={pedido.id}>
                    <td>{pedido.id}</td>
                    <td>{pedido.mesaCodigo} (ID: {pedido.mesaId})</td>
                    <td>
                      <span className={`badge ${
                        pedido.estado === 'PENDIENTE' ? 'badge-yellow' :
                        pedido.estado === 'PREPARACION' ? 'badge-blue' :
                        pedido.estado === 'LISTO' ? 'badge-green' :
                        'badge-gray'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>{new Date(pedido.fechaHora).toLocaleString()}</td>
                    <td>{pedido.items.length} items</td>
                    <td>{getEstadoButton(pedido)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Estado Workflow</h3>
        <p>
          <span className="badge badge-yellow">PENDIENTE</span>
          {' → '}
          <span className="badge badge-blue">PREPARACION</span>
          {' → '}
          <span className="badge badge-green">LISTO</span>
          {' → '}
          <span className="badge badge-gray">ENTREGADO</span>
        </p>
      </div>
    </div>
  )
}

export default CocinaPage
