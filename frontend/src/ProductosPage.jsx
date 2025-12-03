import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

function ProductosPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    activo: true
  })
  const [createError, setCreateError] = useState(null)
  const { isAuthenticated, getAuthHeader } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchProductos()
  }, [isAuthenticated])

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/productos', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }
      if (!response.ok) throw new Error('Error al cargar productos')
      const data = await response.json()
      setProductos(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreateError(null)

    try {
      const response = await fetch('/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          categoria: formData.categoria || null,
          precio: parseFloat(formData.precio),
          activo: formData.activo
        })
      })

      if (response.status === 401) {
        setCreateError('No autorizado - por favor inicia sesión nuevamente')
        return
      }
      if (!response.ok) throw new Error('Error al crear producto')

      setFormData({ nombre: '', categoria: '', precio: '', activo: true })
      fetchProductos()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Productos</h2>
          <p>Debes iniciar sesión para ver esta página.</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Cargando</div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <h1>Productos</h1>

      <div className="card">
        <div className="card-header">
          <h2>Crear Nuevo Producto</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre">
              Nombre:
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="categoria">
              Categoría:
            </label>
            <input
              id="categoria"
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="precio">
              Precio:
            </label>
            <input
              id="precio"
              type="number"
              step="0.01"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="activo">
              Activo:
              <input
                id="activo"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
            </label>
          </div>
          <button type="submit" className="btn-primary">Crear Producto</button>
        </form>
        {createError && <div className="alert alert-error">{createError}</div>}
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Listado de Productos</h2>
        </div>
        {productos.length === 0 ? (
          <p>No se encontraron productos</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>{producto.id}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria || '-'}</td>
                  <td>${producto.precio.toFixed(2)}</td>
                  <td>
                    {producto.activo ? (
                      <span className="badge badge-green">Activo</span>
                    ) : (
                      <span className="badge badge-gray">Inactivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ProductosPage
