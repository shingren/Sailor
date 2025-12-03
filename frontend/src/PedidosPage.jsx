import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link, useLocation } from 'react-router-dom'

function PedidosPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const location = useLocation()

  const [pedidos, setPedidos] = useState([])
  const [mesas, setMesas] = useState([])
  const [productos, setProductos] = useState([])

  const [loading, setLoading] = useState(true)
  const [loadingMesas, setLoadingMesas] = useState(true)
  const [loadingProductos, setLoadingProductos] = useState(true)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    mesaId: '',
    observaciones: '',
    items: [{ productoId: '', cantidad: '' }]
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchPedidos()
      fetchMesas()
      fetchProductos()
    }
  }, [isAuthenticated])

  // Pre-fill mesa from query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const mesaId = params.get('mesaId')
    if (mesaId && mesas.length > 0) {
      setFormData(prev => ({
        ...prev,
        mesaId: mesaId
      }))
    }
  }, [location.search, mesas])

  const fetchPedidos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pedidos', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Error al cargar pedidos')
        setLoading(false)
        return
      }

      const data = await response.json()
      setPedidos(data)
    } catch (err) {
      setError('Error al cargar pedidos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMesas = async () => {
    setLoadingMesas(true)
    try {
      const response = await fetch('/api/mesas', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setMesas(data)
      }
    } catch (err) {
      console.error('Error al cargar mesas:', err)
    } finally {
      setLoadingMesas(false)
    }
  }

  const fetchProductos = async () => {
    setLoadingProductos(true)
    try {
      const response = await fetch('/api/productos', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (err) {
      console.error('Error al cargar productos:', err)
    } finally {
      setLoadingProductos(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = field === 'cantidad' ? (value === '' ? '' : parseInt(value) || '') : parseInt(value) || ''
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productoId: '', cantidad: '' }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        items: newItems
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.mesaId) {
      setError('Por favor selecciona una mesa')
      return
    }

    const hasInvalidItems = formData.items.some(item => !item.productoId || item.cantidad < 1)
    if (hasInvalidItems) {
      setError('Todos los ítems deben tener un producto y cantidad >= 1')
      return
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          mesaId: parseInt(formData.mesaId),
          observaciones: formData.observaciones,
          items: formData.items.map(item => ({
            productoId: parseInt(item.productoId),
            cantidad: item.cantidad
          }))
        })
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        setError('Error al crear pedido')
        return
      }

      setFormData({
        mesaId: '',
        observaciones: '',
        items: [{ productoId: '', cantidad: '' }]
      })

      fetchPedidos()
    } catch (err) {
      setError('Error al crear pedido: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Pedidos</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalPedidos = pedidos.length
  const pedidosPendientes = pedidos.filter(p => p.estado === 'PENDIENTE').length
  const pedidosEnPreparacion = pedidos.filter(p => p.estado === 'EN_PREPARACION' || p.estado === 'PREPARACION').length
  const pedidosListos = pedidos.filter(p => p.estado === 'LISTO').length

  return (
    <div>
      <h1>Pedidos</h1>

      {/* Summary Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total de Pedidos</div>
          <div className="stat-value stat-value-primary">{totalPedidos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value stat-value-warning">{pedidosPendientes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En Preparación</div>
          <div className="stat-value stat-value-primary">{pedidosEnPreparacion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Listos</div>
          <div className="stat-value stat-value-success">{pedidosListos}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pedidos Activos</h2>
        </div>
        {loading ? (
          <div className="loading">Cargando</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Ítems</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan="5">No se encontraron pedidos</td>
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
                    <td>{pedido.items.length} ítems</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Crear Nuevo Pedido</h2>
        </div>
        {loadingMesas || loadingProductos ? (
          <div className="loading">Cargando</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="mesaId">
                Mesa:
              </label>
              <select
                id="mesaId"
                name="mesaId"
                value={formData.mesaId}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Seleccionar Mesa --</option>
                {mesas.map(mesa => (
                  <option key={mesa.id} value={mesa.id}>
                    {mesa.codigo} (Capacidad: {mesa.capacidad})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="observaciones">
                Observaciones:
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <strong>Ítems:</strong>
              {formData.items.map((item, index) => (
                <div key={index} style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <label htmlFor={`producto-${index}`}>
                    Producto:
                  </label>
                  <select
                    id={`producto-${index}`}
                    value={item.productoId}
                    onChange={(e) => handleItemChange(index, 'productoId', e.target.value)}
                    required
                  >
                    <option value="">-- Seleccionar Producto --</option>
                    {productos.filter(p => p.activo).map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} (${producto.precio.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <label htmlFor={`cantidad-${index}`}>
                    Cantidad:
                  </label>
                  <input
                    id={`cantidad-${index}`}
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                    placeholder="ej: 1"
                    min="1"
                    required
                    style={{ width: '80px' }}
                  />

                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="btn-danger btn-small" style={{ marginLeft: '10px' }}>Eliminar</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="btn-secondary" style={{ marginTop: '10px' }}>Agregar Ítem</button>
            </div>

            <div style={{ marginTop: '15px' }}>
              <button type="submit" className="btn-primary">Crear Pedido</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PedidosPage
