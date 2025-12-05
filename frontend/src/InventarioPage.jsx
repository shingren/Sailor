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
    items: [{ insumoId: '', cantidadNecesaria: 0 }],
    extras: []
  })

  // Estado para edición de insumos
  const [editingInsumoId, setEditingInsumoId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    unidad: '',
    stockMinimo: 0
  })

  // Estado para edición de recetas
  const [editingRecetaId, setEditingRecetaId] = useState(null)
  const [editRecetaData, setEditRecetaData] = useState({
    items: [],
    extras: []
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
        setError('Error al cargar datos')
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
      setError('Error al cargar datos: ' + err.message)
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
        setError('Error al crear insumo')
        return
      }

      setNewInsumo({ nombre: '', unidad: '', stockActual: 0, stockMinimo: 0 })
      fetchData()
    } catch (err) {
      setError('Error al crear insumo: ' + err.message)
    }
  }

  const handleEditInsumo = (insumo) => {
    setEditingInsumoId(insumo.id)
    setEditFormData({
      nombre: insumo.nombre,
      unidad: insumo.unidad,
      stockMinimo: insumo.stockMinimo
    })
  }

  const handleCancelEdit = () => {
    setEditingInsumoId(null)
    setEditFormData({ nombre: '', unidad: '', stockMinimo: 0 })
  }

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveEdit = async (insumoId) => {
    setError('')
    try {
      const response = await fetch(`/api/insumos/${insumoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(editFormData)
      })

      if (!response.ok) {
        setError('Error al actualizar insumo')
        return
      }

      setEditingInsumoId(null)
      setEditFormData({ nombre: '', unidad: '', stockMinimo: 0 })
      fetchData()
    } catch (err) {
      setError('Error al actualizar insumo: ' + err.message)
    }
  }

  const handleCreateMovimiento = async (e) => {
    e.preventDefault()
    setError('')

    if (!newMovimiento.insumoId) {
      setError('Por favor selecciona un insumo')
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
        setError('Error al crear movimiento')
        return
      }

      setNewMovimiento({ insumoId: '', cantidad: 0, tipo: 'COMPRA', descripcion: '' })
      fetchData()
    } catch (err) {
      setError('Error al crear movimiento: ' + err.message)
    }
  }

  const handleCreateReceta = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReceta.productoId) {
      setError('Por favor selecciona un producto')
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
          })),
          extras: newReceta.extras.map(extra => ({
            nombre: extra.nombre,
            precio: parseFloat(extra.precio),
            insumoId: parseInt(extra.insumoId),
            cantidadInsumo: parseFloat(extra.cantidadInsumo)
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al crear receta: ' + errorText)
        return
      }

      setNewReceta({ productoId: '', items: [{ insumoId: '', cantidadNecesaria: 0 }], extras: [] })
      fetchData()
    } catch (err) {
      setError('Error al crear receta: ' + err.message)
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

  const addRecetaExtra = () => {
    setNewReceta({
      ...newReceta,
      extras: [...newReceta.extras, { nombre: '', precio: 0, insumoId: '', cantidadInsumo: 0 }]
    })
  }

  const removeRecetaExtra = (index) => {
    setNewReceta({
      ...newReceta,
      extras: newReceta.extras.filter((_, i) => i !== index)
    })
  }

  const updateRecetaExtra = (index, field, value) => {
    const updated = [...newReceta.extras]
    updated[index][field] = value
    setNewReceta({ ...newReceta, extras: updated })
  }

  // Funciones para editar recetas existentes
  const handleStartEditReceta = (receta) => {
    setEditingRecetaId(receta.id)
    setEditRecetaData({
      items: receta.items.map(item => ({
        insumoId: item.insumoId,
        cantidadNecesaria: item.cantidadNecesaria
      })),
      extras: receta.extras.map(extra => ({
        nombre: extra.nombre,
        precio: extra.precio,
        insumoId: extra.insumoId,
        cantidadInsumo: extra.cantidadInsumo
      }))
    })
    setError('')
  }

  const handleCancelEditReceta = () => {
    setEditingRecetaId(null)
    setEditRecetaData({ items: [], extras: [] })
  }

  const handleSaveEditReceta = async (recetaId) => {
    setError('')

    if (editRecetaData.items.length === 0) {
      setError('La receta debe tener al menos un ingrediente')
      return
    }

    try {
      const response = await fetch(`/api/recetas/${recetaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          items: editRecetaData.items.map(item => ({
            insumoId: parseInt(item.insumoId),
            cantidadNecesaria: parseFloat(item.cantidadNecesaria)
          })),
          extras: editRecetaData.extras.map(extra => ({
            nombre: extra.nombre,
            precio: parseFloat(extra.precio),
            insumoId: parseInt(extra.insumoId),
            cantidadInsumo: parseFloat(extra.cantidadInsumo)
          }))
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al actualizar receta: ' + errorText)
        return
      }

      setEditingRecetaId(null)
      setEditRecetaData({ items: [], extras: [] })
      fetchData()
    } catch (err) {
      setError('Error al actualizar receta: ' + err.message)
    }
  }

  const addEditRecetaItem = () => {
    setEditRecetaData({
      ...editRecetaData,
      items: [...editRecetaData.items, { insumoId: '', cantidadNecesaria: 0 }]
    })
  }

  const removeEditRecetaItem = (index) => {
    setEditRecetaData({
      ...editRecetaData,
      items: editRecetaData.items.filter((_, i) => i !== index)
    })
  }

  const updateEditRecetaItem = (index, field, value) => {
    const updated = [...editRecetaData.items]
    updated[index][field] = value
    setEditRecetaData({ ...editRecetaData, items: updated })
  }

  const addEditRecetaExtra = () => {
    setEditRecetaData({
      ...editRecetaData,
      extras: [...editRecetaData.extras, { nombre: '', precio: 0, insumoId: '', cantidadInsumo: 0 }]
    })
  }

  const removeEditRecetaExtra = (index) => {
    setEditRecetaData({
      ...editRecetaData,
      extras: editRecetaData.extras.filter((_, i) => i !== index)
    })
  }

  const updateEditRecetaExtra = (index, field, value) => {
    const updated = [...editRecetaData.extras]
    updated[index][field] = value
    setEditRecetaData({ ...editRecetaData, extras: updated })
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Inventario</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Gestión de Inventario</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Insumos</h2>
        </div>

        <h3>Crear Nuevo Insumo</h3>
        <form onSubmit={handleCreateInsumo}>
          <label htmlFor="insumo-nombre">
            Nombre:
          </label>
          <input
            id="insumo-nombre"
            type="text"
            value={newInsumo.nombre}
            onChange={(e) => setNewInsumo({ ...newInsumo, nombre: e.target.value })}
            required
          />
          <label htmlFor="insumo-unidad">
            Unidad:
          </label>
          <input
            id="insumo-unidad"
            type="text"
            value={newInsumo.unidad}
            onChange={(e) => setNewInsumo({ ...newInsumo, unidad: e.target.value })}
            placeholder="g, ml, unidad"
            required
          />
          <label htmlFor="insumo-stock-actual">
            Stock Actual:
          </label>
          <input
            id="insumo-stock-actual"
            type="number"
            step="0.01"
            value={newInsumo.stockActual}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockActual: parseFloat(e.target.value) })}
            required
          />
          <label htmlFor="insumo-stock-minimo">
            Stock Mínimo:
          </label>
          <input
            id="insumo-stock-minimo"
            type="number"
            step="0.01"
            value={newInsumo.stockMinimo}
            onChange={(e) => setNewInsumo({ ...newInsumo, stockMinimo: parseFloat(e.target.value) })}
            required
          />
          <button type="submit" className="btn-primary">Crear Insumo</button>
        </form>

        <h3>Insumos Existentes</h3>
        {loading ? (
          <div className="loading">Cargando</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Unidad</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.length === 0 ? (
                <tr>
                  <td colSpan="6">No se encontraron insumos</td>
                </tr>
              ) : (
                insumos.map(insumo => {
                  const isEditing = editingInsumoId === insumo.id
                  return (
                    <tr key={insumo.id}>
                      <td>{insumo.id}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.nombre}
                            onChange={(e) => handleEditChange('nombre', e.target.value)}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          insumo.nombre
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editFormData.unidad}
                            onChange={(e) => handleEditChange('unidad', e.target.value)}
                            style={{ width: '100%' }}
                          />
                        ) : (
                          insumo.unidad
                        )}
                      </td>
                      <td className={insumo.stockActual < insumo.stockMinimo ? 'low-stock' : ''}>
                        {insumo.stockActual}
                        {insumo.stockActual < insumo.stockMinimo && ' ⚠️'}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.stockMinimo}
                            onChange={(e) => handleEditChange('stockMinimo', parseFloat(e.target.value))}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          insumo.stockMinimo
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handleSaveEdit(insumo.id)}
                              className="btn-success btn-small"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="btn-secondary btn-small"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditInsumo(insumo)}
                            className="btn-primary btn-small"
                          >
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Movimientos de Inventario</h2>
        </div>

        <h3>Registrar Movimiento</h3>
        <form onSubmit={handleCreateMovimiento}>
          <label htmlFor="movimiento-insumo">
            Insumo:
          </label>
          <select
            id="movimiento-insumo"
            value={newMovimiento.insumoId}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, insumoId: e.target.value })}
            required
          >
            <option value="">-- Seleccionar Insumo --</option>
            {insumos.map(insumo => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre} ({insumo.unidad})
              </option>
            ))}
          </select>
          <label htmlFor="movimiento-cantidad">
            Cantidad:
          </label>
          <input
            id="movimiento-cantidad"
            type="number"
            step="0.01"
            value={newMovimiento.cantidad}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, cantidad: parseFloat(e.target.value) })}
            required
          />
          <label htmlFor="movimiento-tipo">
            Tipo:
          </label>
          <select
            id="movimiento-tipo"
            value={newMovimiento.tipo}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, tipo: e.target.value })}
          >
            <option value="COMPRA">COMPRA</option>
            <option value="AJUSTE">AJUSTE</option>
          </select>
          <label htmlFor="movimiento-descripcion">
            Descripción:
          </label>
          <input
            id="movimiento-descripcion"
            type="text"
            value={newMovimiento.descripcion}
            onChange={(e) => setNewMovimiento({ ...newMovimiento, descripcion: e.target.value })}
            placeholder="Descripción opcional"
          />
          <button type="submit" className="btn-primary">Registrar Movimiento</button>
        </form>

        <h3>Movimientos Recientes</h3>
        <table>
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
                <td colSpan="6">No se encontraron movimientos</td>
              </tr>
            ) : (
              movimientos.slice().reverse().slice(0, 20).map(mov => (
                <tr key={mov.id}>
                  <td>{mov.id}</td>
                  <td>{mov.insumoNombre}</td>
                  <td style={{ color: mov.cantidad >= 0 ? 'green' : 'red', fontWeight: '500' }}>{mov.cantidad}</td>
                  <td>
                    <span className={`badge ${
                      mov.tipo === 'COMPRA' ? 'badge-green' :
                      mov.tipo === 'AJUSTE' ? 'badge-blue' :
                      'badge-gray'
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td>{new Date(mov.fechaHora).toLocaleString()}</td>
                  <td>{mov.descripcion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recetas</h2>
        </div>

        <h3>Crear Nueva Receta</h3>
        <form onSubmit={handleCreateReceta}>
          <label htmlFor="receta-producto">
            Producto:
          </label>
          <select
            id="receta-producto"
            value={newReceta.productoId}
            onChange={(e) => setNewReceta({ ...newReceta, productoId: e.target.value })}
            required
          >
            <option value="">-- Seleccionar Producto --</option>
            {productos.map(producto => (
              <option key={producto.id} value={producto.id}>
                {producto.nombre}
              </option>
            ))}
          </select>

          <h4>Ingredientes de la Receta:</h4>
          {newReceta.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <label htmlFor={`receta-insumo-${index}`}>
                Insumo:
              </label>
              <select
                id={`receta-insumo-${index}`}
                value={item.insumoId}
                onChange={(e) => updateRecetaItem(index, 'insumoId', e.target.value)}
                required
              >
                <option value="">-- Seleccionar Insumo --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre} ({insumo.unidad})
                  </option>
                ))}
              </select>
              <label htmlFor={`receta-cantidad-${index}`}>
                Cantidad Necesaria:
              </label>
              <input
                id={`receta-cantidad-${index}`}
                type="number"
                step="0.01"
                value={item.cantidadNecesaria}
                onChange={(e) => updateRecetaItem(index, 'cantidadNecesaria', parseFloat(e.target.value))}
                required
                style={{ width: '100px' }}
              />
              {newReceta.items.length > 1 && (
                <button type="button" onClick={() => removeRecetaItem(index)} className="btn-danger btn-small" style={{ marginLeft: '10px' }}>Eliminar</button>
              )}
            </div>
          ))}

          <button type="button" onClick={addRecetaItem} className="btn-secondary">Agregar Ingrediente</button>

          <h4 style={{ marginTop: '20px' }}>Extras (Opcional):</h4>
          {newReceta.extras.map((extra, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <label htmlFor={`extra-nombre-${index}`}>
                Nombre del Extra:
              </label>
              <input
                id={`extra-nombre-${index}`}
                type="text"
                value={extra.nombre}
                onChange={(e) => updateRecetaExtra(index, 'nombre', e.target.value)}
                placeholder="Ej: Queso extra, Shot extra"
                required
                style={{ width: '200px', marginRight: '10px' }}
              />

              <label htmlFor={`extra-precio-${index}`}>
                Precio:
              </label>
              <input
                id={`extra-precio-${index}`}
                type="number"
                step="0.01"
                value={extra.precio}
                onChange={(e) => updateRecetaExtra(index, 'precio', e.target.value)}
                required
                style={{ width: '100px', marginRight: '10px' }}
              />

              <label htmlFor={`extra-insumo-${index}`}>
                Insumo:
              </label>
              <select
                id={`extra-insumo-${index}`}
                value={extra.insumoId}
                onChange={(e) => updateRecetaExtra(index, 'insumoId', e.target.value)}
                required
                style={{ marginRight: '10px' }}
              >
                <option value="">-- Seleccionar Insumo --</option>
                {insumos.map(insumo => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre} ({insumo.unidad})
                  </option>
                ))}
              </select>

              <label htmlFor={`extra-cantidad-${index}`}>
                Cantidad del Insumo:
              </label>
              <input
                id={`extra-cantidad-${index}`}
                type="number"
                step="0.01"
                value={extra.cantidadInsumo}
                onChange={(e) => updateRecetaExtra(index, 'cantidadInsumo', e.target.value)}
                required
                style={{ width: '100px', marginRight: '10px' }}
              />

              <button type="button" onClick={() => removeRecetaExtra(index)} className="btn-danger btn-small">Eliminar Extra</button>
            </div>
          ))}

          <button type="button" onClick={addRecetaExtra} className="btn-secondary">Agregar Extra</button>
          {' '}
          <button type="submit" className="btn-primary">Crear Receta</button>
        </form>

        <h3>Recetas Existentes</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Ingredientes</th>
              <th>Extras</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recetas.length === 0 ? (
              <tr>
                <td colSpan="5">No se encontraron recetas</td>
              </tr>
            ) : (
              recetas.map(receta => {
                const isEditing = editingRecetaId === receta.id

                return (
                  <tr key={receta.id}>
                    <td>{receta.id}</td>
                    <td>{receta.productoNombre}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ padding: '10px' }}>
                          <h5 style={{ marginTop: '0' }}>Ingredientes:</h5>
                          {editRecetaData.items.map((item, index) => (
                            <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
                              <select
                                value={item.insumoId}
                                onChange={(e) => updateEditRecetaItem(index, 'insumoId', e.target.value)}
                                required
                                style={{ marginRight: '10px' }}
                              >
                                <option value="">-- Seleccionar Insumo --</option>
                                {insumos.map(insumo => (
                                  <option key={insumo.id} value={insumo.id}>
                                    {insumo.nombre} ({insumo.unidad})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                value={item.cantidadNecesaria}
                                onChange={(e) => updateEditRecetaItem(index, 'cantidadNecesaria', e.target.value)}
                                required
                                style={{ width: '100px', marginRight: '10px' }}
                              />
                              {editRecetaData.items.length > 1 && (
                                <button type="button" onClick={() => removeEditRecetaItem(index)} className="btn-danger btn-small">
                                  Eliminar
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={addEditRecetaItem} className="btn-secondary btn-small" style={{ marginTop: '5px' }}>
                            Agregar Ingrediente
                          </button>
                        </div>
                      ) : (
                        <ul style={{ margin: '0', paddingLeft: '20px' }}>
                          {receta.items.map((item, idx) => (
                            <li key={idx}>
                              {item.insumoNombre}: {item.cantidadNecesaria}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ padding: '10px' }}>
                          <h5 style={{ marginTop: '0' }}>Extras:</h5>
                          {editRecetaData.extras.length === 0 ? (
                            <p style={{ color: '#999', fontSize: '0.9em' }}>Sin extras</p>
                          ) : (
                            editRecetaData.extras.map((extra, index) => (
                              <div key={index} style={{ marginBottom: '10px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    Nombre del Extra:
                                  </label>
                                  <input
                                    type="text"
                                    value={extra.nombre}
                                    onChange={(e) => updateEditRecetaExtra(index, 'nombre', e.target.value)}
                                    placeholder="Ej: Queso extra"
                                    required
                                    style={{ width: '200px' }}
                                  />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    Precio ($):
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={extra.precio}
                                    onChange={(e) => updateEditRecetaExtra(index, 'precio', e.target.value)}
                                    required
                                    style={{ width: '100px' }}
                                  />
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    Insumo Asociado:
                                  </label>
                                  <select
                                    value={extra.insumoId}
                                    onChange={(e) => updateEditRecetaExtra(index, 'insumoId', e.target.value)}
                                    required
                                    style={{ width: '200px' }}
                                  >
                                    <option value="">-- Seleccionar Insumo --</option>
                                    {insumos.map(insumo => (
                                      <option key={insumo.id} value={insumo.id}>
                                        {insumo.nombre} ({insumo.unidad})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ display: 'block', fontSize: '0.85em', marginBottom: '3px', fontWeight: '500' }}>
                                    Cantidad del Insumo:
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={extra.cantidadInsumo}
                                    onChange={(e) => updateEditRecetaExtra(index, 'cantidadInsumo', e.target.value)}
                                    required
                                    style={{ width: '100px' }}
                                  />
                                </div>
                                <button type="button" onClick={() => removeEditRecetaExtra(index)} className="btn-danger btn-small">
                                  Eliminar Extra
                                </button>
                              </div>
                            ))
                          )}
                          <button type="button" onClick={addEditRecetaExtra} className="btn-secondary btn-small" style={{ marginTop: '5px' }}>
                            Agregar Extra
                          </button>
                        </div>
                      ) : (
                        receta.extras && receta.extras.length > 0 ? (
                          <ul style={{ margin: '0', paddingLeft: '20px' }}>
                            {receta.extras.map((extra, idx) => (
                              <li key={idx}>
                                <strong>{extra.nombre}</strong> - ${extra.precio.toFixed(2)}<br/>
                                <small>({extra.insumoNombre}: {extra.cantidadInsumo})</small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span style={{ color: '#999' }}>Sin extras</span>
                        )
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                          <button
                            onClick={() => handleSaveEditReceta(receta.id)}
                            className="btn-success btn-small"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEditReceta}
                            className="btn-secondary btn-small"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEditReceta(receta)}
                          className="btn-primary btn-small"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default InventarioPage
