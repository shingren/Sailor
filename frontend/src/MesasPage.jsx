import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function MesasPage() {
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    capacidad: '',
    estado: 'disponible'
  })
  const [createError, setCreateError] = useState(null)
  const { isAuthenticated, getAuthHeader } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchMesas()
  }, [isAuthenticated])

  const fetchMesas = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:8080/mesas', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.status === 401) {
        setError('Not authorized - please log in again')
        return
      }
      if (!response.ok) throw new Error('Error loading mesas')
      const data = await response.json()
      setMesas(data)
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
      const response = await fetch('http://localhost:8080/mesas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          codigo: formData.codigo,
          capacidad: parseInt(formData.capacidad),
          estado: formData.estado
        })
      })

      if (response.status === 401) {
        setCreateError('Not authorized - please log in again')
        return
      }
      if (!response.ok) throw new Error('Error creating mesa')

      setFormData({ codigo: '', capacidad: '', estado: 'disponible' })
      fetchMesas()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <p>You must log in to view this page.</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) return <div>Loading mesas...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Mesas</h1>

      <h2>Create New Mesa</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Codigo:
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Capacidad:
            <input
              type="number"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Estado:
            <input
              type="text"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        <button type="submit">Create Mesa</button>
      </form>
      {createError && <div>Error: {createError}</div>}

      <h2>Mesa List</h2>
      {mesas.length === 0 ? (
        <p>No mesas found</p>
      ) : (
        <table border="1">
          <thead>
            <tr>
              <th>ID</th>
              <th>Codigo</th>
              <th>Capacidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {mesas.map((mesa) => (
              <tr key={mesa.id}>
                <td>{mesa.id}</td>
                <td>{mesa.codigo}</td>
                <td>{mesa.capacidad}</td>
                <td>{mesa.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default MesasPage
