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
  const [success, setSuccess] = useState(null)
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
      const response = await fetch('/api/mesas', {
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
    setSuccess(null)

    try {
      const response = await fetch('/api/mesas', {
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

      setSuccess(`Mesa "${formData.codigo}" created successfully!`)
      setFormData({ codigo: '', capacidad: '', estado: 'disponible' })
      fetchMesas()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Authentication Required</h2>
          <p>You must log in to view this page.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (loading) return <div className="loading">Loading mesas</div>
  if (error) return <div className="alert alert-error">Error: {error}</div>

  // Calculate summary statistics
  const totalMesas = mesas.length
  const mesasDisponibles = mesas.filter(m => m.estado === 'disponible').length
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada' || m.estado === 'OCUPADA').length
  const mesasReservadas = mesas.filter(m => m.estado === 'reservada').length

  return (
    <div>
      <h1>Mesas</h1>

      {/* Summary Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Mesas</div>
          <div className="stat-value stat-value-primary">{totalMesas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Disponibles</div>
          <div className="stat-value stat-value-success">{mesasDisponibles}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ocupadas</div>
          <div className="stat-value stat-value-danger">{mesasOcupadas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reservadas</div>
          <div className="stat-value stat-value-warning">{mesasReservadas}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Crear Nueva Mesa</h2>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {createError && <div className="alert alert-error">{createError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigo">Código</label>
              <input
                id="codigo"
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="ej: MESA-01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacidad">Capacidad</label>
              <input
                id="capacidad"
                type="number"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleChange}
                placeholder="ej: 4"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="disponible">Disponible</option>
                <option value="ocupada">Ocupada</option>
                <option value="reservada">Reservada</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">Crear Mesa</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Listado de Mesas</h2>
        </div>

        {mesas.length === 0 ? (
          <p className="text-muted">No hay mesas registradas</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Capacidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.id}</td>
                  <td><strong>{mesa.codigo}</strong></td>
                  <td>{mesa.capacidad} personas</td>
                  <td>
                    <span className={`badge ${
                      mesa.estado === 'disponible' ? 'badge-green' :
                      mesa.estado === 'ocupada' ? 'badge-red' :
                      'badge-yellow'
                    }`}>
                      {mesa.estado.toUpperCase()}
                    </span>
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

export default MesasPage
