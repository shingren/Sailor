import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function MesasPage() {
  const [mesas, setMesas] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    capacidad: '',
    estado: 'disponible',
    locationId: ''
  })
  const [newLocationName, setNewLocationName] = useState('')
  const [createError, setCreateError] = useState(null)
  const [success, setSuccess] = useState(null)
  const { isAuthenticated, getAuthHeader } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }
    fetchMesas()
    fetchLocations()
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
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }
      if (!response.ok) throw new Error('Error al cargar mesas')
      const data = await response.json()
      setMesas(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    setLoadingLocations(true)
    try {
      const response = await fetch('/api/locations', {
        headers: {
          'Authorization': getAuthHeader()
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleCreateLocation = async (e) => {
    e.preventDefault()
    if (!newLocationName.trim()) return

    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ name: newLocationName })
      })

      if (response.ok) {
        setNewLocationName('')
        fetchLocations()
        setSuccess(`Ubicación "${newLocationName}" creada exitosamente!`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setCreateError('No se pudo crear la ubicación - puede que ya exista')
      }
    } catch (err) {
      setCreateError('Error al crear ubicación: ' + err.message)
    }
  }

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta ubicación?')) return

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchLocations()
        setSuccess('Ubicación eliminada exitosamente!')
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError('Error al eliminar ubicación: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreateError(null)
    setSuccess(null)

    try {
      const mesaData = {
        codigo: formData.codigo,
        capacidad: parseInt(formData.capacidad),
        estado: formData.estado
      }

      // Add location if selected
      if (formData.locationId) {
        mesaData.location = { id: parseInt(formData.locationId) }
      }

      const response = await fetch('/api/mesas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(mesaData)
      })

      if (response.status === 401) {
        setCreateError('No autorizado - por favor inicia sesión nuevamente')
        return
      }
      if (!response.ok) throw new Error('Error al crear mesa')

      setSuccess(`Mesa "${formData.codigo}" creada exitosamente!`)
      setFormData({ codigo: '', capacidad: '', estado: 'disponible', locationId: '' })
      fetchMesas()
    } catch (err) {
      setCreateError(err.message)
    }
  }

  const handleStatusChange = async (mesaId, newStatus) => {
    try {
      const response = await fetch(`/api/mesas/${mesaId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ estado: newStatus })
      })

      if (response.ok) {
        fetchMesas()
      }
    } catch (err) {
      setError('Error al actualizar estado: ' + err.message)
    }
  }

  const handleLocationChange = async (mesaId, locationId) => {
    try {
      const response = await fetch(`/api/mesas/${mesaId}/location?locationId=${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchMesas()
      }
    } catch (err) {
      setError('Error al actualizar ubicación: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Autenticación Requerida</h2>
          <p>Debes iniciar sesión para ver esta página.</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
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

  if (loading) return <div className="loading">Cargando mesas</div>
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

      {success && <div className="alert alert-success">{success}</div>}
      {createError && <div className="alert alert-error">{createError}</div>}

      {/* Location Management */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Gestionar Ubicaciones</h2>
        </div>
        <form onSubmit={handleCreateLocation} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="newLocation">Crear Nueva Ubicación:</label>
              <input
                id="newLocation"
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="ej: Interior, Terraza, Barra"
              />
            </div>
            <button type="submit" className="btn-primary">Crear Ubicación</button>
          </div>
        </form>

        {loadingLocations ? (
          <div className="loading">Cargando ubicaciones...</div>
        ) : (
          <div>
            <strong>Ubicaciones Existentes:</strong>
            {locations.length === 0 ? (
              <p className="text-muted">No hay ubicaciones creadas aún</p>
            ) : (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                {locations.map(location => (
                  <div key={location.id} style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span><strong>{location.name}</strong></span>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="btn-danger btn-small"
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Mesa */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Crear Nueva Mesa</h2>
        </div>

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
                <option value="disponible">Libre</option>
                <option value="ocupada">Ocupada</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="locationId">Ubicación</label>
              <select
                id="locationId"
                name="locationId"
                value={formData.locationId}
                onChange={handleChange}
              >
                <option value="">-- Seleccionar Ubicación --</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary">Crear Mesa</button>
        </form>
      </div>

      {/* Mesas List */}
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
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.id}</td>
                  <td><strong>{mesa.codigo}</strong></td>
                  <td>{mesa.capacidad} personas</td>
                  <td>
                    <select
                      value={mesa.estado}
                      onChange={(e) => handleStatusChange(mesa.id, e.target.value)}
                      className={`badge ${
                        mesa.estado === 'disponible' ? 'badge-green' :
                        mesa.estado === 'ocupada' ? 'badge-red' :
                        'badge-yellow'
                      }`}
                      style={{ border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <option value="disponible">LIBRE</option>
                      <option value="ocupada">OCUPADA</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={mesa.location?.id || ''}
                      onChange={(e) => handleLocationChange(mesa.id, e.target.value)}
                      style={{ padding: '4px 8px' }}
                    >
                      <option value="">-- Sin Ubicación --</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
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
