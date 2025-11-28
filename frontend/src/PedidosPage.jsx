import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function PedidosPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

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
    items: [{ productoId: '', cantidad: 1 }]
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchPedidos()
      fetchMesas()
      fetchProductos()
    }
  }, [isAuthenticated])

  const fetchPedidos = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/pedidos', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Failed to fetch pedidos')
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
      console.error('Error fetching mesas:', err)
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
      console.error('Error fetching productos:', err)
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
    newItems[index][field] = field === 'cantidad' ? parseInt(value) || 1 : parseInt(value) || ''
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productoId: '', cantidad: 1 }]
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
      setError('Please select a mesa')
      return
    }

    const hasInvalidItems = formData.items.some(item => !item.productoId || item.cantidad < 1)
    if (hasInvalidItems) {
      setError('All items must have a product and quantity >= 1')
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
        setError('Not authorized - please log in again')
        return
      }

      if (!response.ok) {
        setError('Failed to create pedido')
        return
      }

      setFormData({
        mesaId: '',
        observaciones: '',
        items: [{ productoId: '', cantidad: 1 }]
      })

      fetchPedidos()
    } catch (err) {
      setError('Error creating pedido: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Pedidos</h2>
        <p>You must log in to view this page</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Pedidos</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Existing Pedidos</h3>
      {loading ? (
        <p>Loading pedidos...</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa ID</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Items Count</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="5">No pedidos found</td>
              </tr>
            ) : (
              pedidos.map(pedido => (
                <tr key={pedido.id}>
                  <td>{pedido.id}</td>
                  <td>{pedido.mesaId} ({pedido.mesaCodigo})</td>
                  <td>{pedido.estado}</td>
                  <td>{new Date(pedido.fechaHora).toLocaleString()}</td>
                  <td>{pedido.items.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h3>Create New Pedido</h3>
      {loadingMesas || loadingProductos ? (
        <p>Loading form data...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label>
              Mesa:
              <select
                name="mesaId"
                value={formData.mesaId}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Select Mesa --</option>
                {mesas.map(mesa => (
                  <option key={mesa.id} value={mesa.id}>
                    {mesa.codigo} (Capacidad: {mesa.capacidad})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: '10px' }}>
            <label>
              Observaciones:
              <br />
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
                cols="40"
              />
            </label>
          </div>

          <div style={{ marginTop: '10px' }}>
            <strong>Items:</strong>
            {formData.items.map((item, index) => (
              <div key={index} style={{ marginTop: '5px', padding: '5px', border: '1px solid #ccc' }}>
                <label>
                  Producto:
                  <select
                    value={item.productoId}
                    onChange={(e) => handleItemChange(index, 'productoId', e.target.value)}
                    required
                  >
                    <option value="">-- Select Producto --</option>
                    {productos.filter(p => p.activo).map(producto => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre} (${producto.precio.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </label>
                {' '}
                <label>
                  Cantidad:
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                    min="1"
                    required
                    style={{ width: '60px' }}
                  />
                </label>
                {' '}
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)}>Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItem} style={{ marginTop: '5px' }}>Add Item</button>
          </div>

          <div style={{ marginTop: '10px' }}>
            <button type="submit">Create Pedido</button>
          </div>
        </form>
      )}
    </div>
  )
}

export default PedidosPage
