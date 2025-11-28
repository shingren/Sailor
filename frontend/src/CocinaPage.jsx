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
        const errorText = await response.text()
        setError(`Failed to change estado: ${errorText}`)
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
          <button onClick={() => cambiarEstado(pedido.id, 'PREPARACION')}>
            Pasar a PREPARACION
          </button>
        )
      case 'PREPARACION':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'LISTO')}>
            Marcar como LISTO
          </button>
        )
      case 'LISTO':
        return (
          <button onClick={() => cambiarEstado(pedido.id, 'ENTREGADO')}>
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
      <div>
        <h2>Cocina</h2>
        <p>You must log in to view this page</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Cocina - Operations Board</h2>
      <p style={{ fontSize: '12px', color: '#666' }}>Auto-refresh every 10 seconds</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading && pedidos.length === 0 ? (
        <p>Loading active orders...</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Pedido ID</th>
              <th>Mesa ID</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Items Count</th>
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
                  <td>{pedido.mesaId} ({pedido.mesaCodigo})</td>
                  <td><strong>{pedido.estado}</strong></td>
                  <td>{new Date(pedido.fechaHora).toLocaleString()}</td>
                  <td>{pedido.items.length}</td>
                  <td>{getEstadoButton(pedido)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>Estado Workflow</h3>
        <p>PENDIENTE → PREPARACION → LISTO → ENTREGADO</p>
      </div>
    </div>
  )
}

export default CocinaPage
