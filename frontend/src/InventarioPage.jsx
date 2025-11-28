import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function InventarioPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [insumos, setInsumos] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newInsumo, setNewInsumo] = useState({
    nombre: '',
    unidad: '',
    stockActual: 0,
    stockMinimo: 0
  })

  const [newMovimiento, setNewMovimiento] = useState({
    insumoId: '',
    cantidad: 0,
    tipo: 'COMPRA',
    descripcion: ''
  })

  const [newReceta, setNewReceta] = useState({
    productoId: '',
    items: [{ insumoId: '', cantidadNecesaria: 0 }]
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [insumosRes, movimientosRes, recetasRes, productosRes] = await Promise.all([
        fetch('/api/insumos', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/insumos/movimientos', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/recetas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/productos', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (!insumosRes.ok || !movimientosRes.ok || !recetasRes.ok || !productosRes.ok) {
        setError('Failed to fetch data')
        setLoading(false)
        return
      }

      const [insumosData, movimientosData, recetasData, productosData] = await Promise.all([
        insumosRes.json(),
        movimientosRes.json(),
        recetasRes.json(),
        productosRes.json()
      ])

      setInsumos(insumosData)
      setMovimientos(movimientosData)
      setRecetas(recetasData)
      setProductos(productosData)
    } catch (err) {
      setError('Error fetching data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInsumo = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/insumos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(newInsumo)
      })

      if (!response.ok) {
        setError('Failed to create insumo')
        return
      }

      setNewInsumo({ nombre: '', unidad: '', stockActual: 0, stockMinimo: 0 })
      fetchData()
    } catch (err) {
      setError('Error creating insumo: ' + err.message)
    }
  }

  const handleCreateMovimiento = async (e) => {
    e.preventDefault()
    setError('')

    if (!newMovimiento.insumoId) {
      setError('Please select an insumo')
      return
    }

    try {
      const response = await fetch('/api/insumos/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          insumoId: parseInt(newMovimiento.insumoId),
          cantidad: parseFloat(newMovimiento.cantidad),
          tipo: newMovimiento.tipo,
          descripcion: newMovimiento.descripcion
        })
      })

      if (!response.ok) {
        setError('Failed to create movimiento')
        return
      }

      setNewMovimiento({ insumoId: '', cantidad: 0, tipo: 'COMPRA', descripcion: '' })
      fetchData()
    } catch (err) {
      setError('Error creating movimiento: ' + err.message)
    }
  }

  const handleCreateReceta = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReceta.productoId) {
      setError('Please select a producto')
      return
    }

    try {
      const response = await fetch('/api/recetas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          productoId: parseInt(newReceta.productoId),
          items: newReceta.items.map(item => ({
            insumoId: parseInt(item.insumoId),
            cantidadNecesaria: parseFloat(item.cantidadNecesaria)
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to create receta: ' + errorText)
        return
      }

      setNewReceta({ productoId: '', items: [{ insumoId: '', cantidadNecesaria: 0 }] })
      fetchData()
    } catch (err) {
      setError('Error creating receta: ' + err.message)
    }
  }

  const addRecetaItem = () => {
    setNewReceta({
      ...newReceta,
      items: [...newReceta.items, { insumoId: '', cantidadNecesaria: 0 }]
    })
  }

  const removeRecetaItem = (index) => {
    setNewReceta({
      ...newReceta,
      items: newReceta.items.filter((_, i) => i !== index)
    })
  }

  const updateRecetaItem = (index, field, value) => {
    const updated = [...newReceta.items]
    updated[index][field] = value
    setNewReceta({ ...newReceta, items: updated })
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Inventario</h2>
        <p>You must log in to view this page</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Inventario - Inventory Management</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />
      <h3>SECTION A — Insumos (Ingredients)</h3>

      <h4>Create New Insumo</h4>
      <form onSubmit={handleCreateInsumo}>
        <label>
          Nombre:
          <input
            type="text"
            value={newInsumo.nombre}
            onChange={(e) => setNewInsumo({ ...newInsumo, nombre: e.target.value })}
            required
          />
        </label>
        {' '}
        <label>
          Unidad:
          <input
            type="text"
            value={newInsumo.unidad}
            onChange={(e) => setNewInsumo({ ...newInsumo, unidad: e.target.value })}
            placeholder="g, ml, unidad"
            required
          />
        </label>
        {' '}
        <label>
          Stock Actual:
          <input
            type="number"
            step="0.01"
            value={newInsumo.stockActual}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockActual: parseFloat(e.target.value) })}
            required
          />
        </label>
        {' '}
        <label>
          Stock Mínimo:
          <input
            type="number"
            step="0.01"
            value={newInsumo.stockMinimo}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockMinimo: parseFloat(e.target.value) })}
            required
          />
        </label>
        {' '}
        <button type="submit">Create Insumo</button>
      </form>

      <h4>Existing Insumos</h4>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr>
                <td colSpan="5">No insumos found</td>
              </tr>
            ) : (
              insumos.map(insumo => (
                <tr key={insumo.id} style={{ backgroundColor: insumo.stockActual < insumo.stockMinimo ? '#ffcccc' : 'white' }}>
                  <td>{insumo.id}</td>
                  <td>{insumo.nombre}</td>
                  <td>{insumo.unidad}</td>
                  <td>{insumo.stockActual}</td>
                  <td>{insumo.stockMinimo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <hr />
      <h3>SECTION B — Movimientos de Insumo (Stock Movements)</h3>

      <h4>Register Movement</h4>
      <form onSubmit={handleCreateMovimiento}>
        <label>
          Insumo:
          <select
            value={newMovimiento.insumoId}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, insumoId: e.target.value })}
            required
          >
            <option value="">-- Select Insumo --</option>
            {insumos.map(insumo => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre} ({insumo.unidad})
              </option>
            ))}
          </select>
        </label>
        {' '}
        <label>
          Cantidad:
          <input
            type="number"
            step="0.01"
            value={newMovimiento.cantidad}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, cantidad: parseFloat(e.target.value) })}
            required
          />
        </label>
        {' '}
        <label>
          Tipo:
          <select
            value={newMovimiento.tipo}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, tipo: e.target.value })}
          >
            <option value="COMPRA">COMPRA</option>
            <option value="AJUSTE">AJUSTE</option>
          </select>
        </label>
        {' '}
        <label>
          Descripción:
          <input
            type="text"
            value={newMovimiento.descripcion}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, descripcion: e.target.value })}
            placeholder="Optional description"
          />
        </label>
        {' '}
        <button type="submit">Register Movement</button>
      </form>

      <h4>Recent Movimientos</h4>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Insumo</th>
            <th>Cantidad</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.length === 0 ? (
            <tr>
              <td colSpan="6">No movimientos found</td>
            </tr>
          ) : (
            movimientos.slice().reverse().slice(0, 20).map(mov => (
              <tr key={mov.id}>
                <td>{mov.id}</td>
                <td>{mov.insumoNombre}</td>
                <td style={{ color: mov.cantidad >= 0 ? 'green' : 'red' }}>{mov.cantidad}</td>
                <td>{mov.tipo}</td>
                <td>{new Date(mov.fechaHora).toLocaleString()}</td>
                <td>{mov.descripcion}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <hr />
      <h3>SECTION C — Recetas (Recipes)</h3>

      <h4>Create New Receta</h4>
      <form onSubmit={handleCreateReceta}>
        <label>
          Producto:
          <select
            value={newReceta.productoId}
            onChange={(e) => setNewReceta({ ...newReceta, productoId: e.target.value })}
            required
          >
            <option value="">-- Select Producto --</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>
        </label>

        <h5>Recipe Items:</h5>
        {newReceta.items.map((item, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <label>
              Insumo:
              <select
                value={item.insumoId}
                onChange={(e) => updateRecetaItem(index, 'insumoId', e.target.value)}
                required
              >
                <option value="">-- Select Insumo --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre} ({insumo.unidad})
                  </option>
                ))}
              </select>
            </label>
            {' '}
            <label>
              Cantidad Necesaria:
              <input
                type="number"
                step="0.01"
                value={item.cantidadNecesaria}
                onChange={(e) => updateRecetaItem(index, 'cantidadNecesaria', parseFloat(e.target.value))}
                required
              />
            </label>
            {' '}
            {newReceta.items.length > 1 && (
              <button type="button" onClick={() => removeRecetaItem(index)}>Remove</button>
            )}
          </div>
        ))}

        <button type="button" onClick={addRecetaItem}>Add Item</button>
        {' '}
        <button type="submit">Create Receta</button>
      </form>

      <h4>Existing Recetas</h4>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Ingredients</th>
          </tr>
        </thead>
        <tbody>
          {recetas.length === 0 ? (
            <tr>
              <td colSpan="3">No recetas found</td>
            </tr>
          ) : (
            recetas.map(receta => (
              <tr key={receta.id}>
                <td>{receta.id}</td>
                <td>{receta.productoNombre}</td>
                <td>
                  <ul>
                    {receta.items.map((item, idx) => (
                      <li key={idx}>
                        {item.insumoNombre}: {item.cantidadNecesaria}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default InventarioPage
