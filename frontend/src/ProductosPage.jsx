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
      const response = await fetch('http://localhost:8080/productos', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.status === 401) {
        setError('Not authorized - please log in again')
        return
      }
      if (!response.ok) throw new Error('Error loading productos')
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
      const response = await fetch('http://localhost:8080/productos', {
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
        setCreateError('Not authorized - please log in again')
        return
      }
      if (!response.ok) throw new Error('Error creating producto')

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
      <div>
        <p>You must log in to view this page.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  if (loading) return <div>Loading productos...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Productos</h1>

      <h2>Create New Producto</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Nombre:
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Categoria:
            <input
              type="text"
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Precio:
            <input
              type="number"
              step="0.01"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Activo:
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit">Create Producto</button>
      </form>
      {createError && <div>Error: {createError}</div>}

      <h2>Producto List</h2>
      {productos.length === 0 ? (
        <p>No productos found</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoria</th>
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
                <td>{producto.activo ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ProductosPage
