import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'

function CierreCajaPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Resumen del día
  const [resumenDia, setResumenDia] = useState(null)

  // Form state for creating cierre
  const [formData, setFormData] = useState({
    saldoReal: '',
    saldoInicial: '0'
  })

  // History data
  const [historial, setHistorial] = useState([])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchResumenDia()
    fetchHistorial()
  }, [isAuthenticated])

  const fetchResumenDia = async () => {
    setError(null)
    try {
      const saldoInicial = formData.saldoInicial || '0'
      const response = await fetch(`/api/cierre-caja/resumen-dia?saldoInicial=${saldoInicial}`, {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as CAJA or ADMIN')
        return
      }

      if (!response.ok) {
        setError('Failed to fetch daily summary')
        return
      }

      const data = await response.json()
      setResumenDia(data)
    } catch (err) {
      setError('Error fetching daily summary: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistorial = async () => {
    try {
      const response = await fetch('/api/cierre-caja', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
      }
    } catch (err) {
      console.error('Error fetching historial:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Refresh resumen when saldoInicial changes
    if (name === 'saldoInicial') {
      setTimeout(fetchResumenDia, 300)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!formData.saldoReal || formData.saldoReal === '') {
      setError('Saldo real es requerido')
      return
    }

    try {
      const response = await fetch('/api/cierre-caja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          saldoReal: parseFloat(formData.saldoReal),
          saldoInicial: parseFloat(formData.saldoInicial || 0)
        })
      })

      if (response.status === 401 || response.status === 403) {
        setError('Not authorized - please log in as CAJA or ADMIN')
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create cierre')
        return
      }

      setSuccess('Cierre registrado exitosamente!')
      setFormData({ saldoReal: '', saldoInicial: '0' })

      // Refresh data
      fetchResumenDia()
      fetchHistorial()
    } catch (err) {
      setError('Error creating cierre: ' + err.message)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX')
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Cierre de Caja</h2>
          <p>You must log in as CAJA or ADMIN to view this page.</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  if (loading) return <div className="loading">Loading cierre de caja</div>

  return (
    <div>
      <h1>Cierre de Caja</h1>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Section A: Resumen del día */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Resumen del Día</h2>
        </div>

        {resumenDia && (
          <div>
            <p><strong>Fecha:</strong> {formatDate(resumenDia.fecha)}</p>

            <table>
              <tbody>
                <tr>
                  <td><strong>Total ventas del día:</strong></td>
                  <td>{formatCurrency(resumenDia.totalVentasDia)}</td>
                </tr>
                <tr>
                  <td><strong>Total efectivo:</strong></td>
                  <td>{formatCurrency(resumenDia.totalEfectivo)}</td>
                </tr>
                <tr>
                  <td><strong>Total tarjeta:</strong></td>
                  <td>{formatCurrency(resumenDia.totalTarjeta)}</td>
                </tr>
                <tr>
                  <td><strong>Cantidad de facturas:</strong></td>
                  <td>{resumenDia.cantidadFacturas}</td>
                </tr>
                <tr>
                  <td><strong>Saldo esperado:</strong></td>
                  <td>{formatCurrency(resumenDia.saldoEsperado)}</td>
                </tr>
              </tbody>
            </table>

            {resumenDia.cierreExiste && (
              <div className="alert alert-warning mt-2">
                Ya existe un cierre registrado para el día de hoy.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section B: Registrar cierre */}
      {resumenDia && !resumenDia.cierreExiste && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Registrar Cierre del Día</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="saldoInicial">Saldo Inicial</label>
                <input
                  id="saldoInicial"
                  name="saldoInicial"
                  type="number"
                  step="0.01"
                  value={formData.saldoInicial}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="saldoReal">Saldo Real (Conteo de caja) *</label>
                <input
                  id="saldoReal"
                  name="saldoReal"
                  type="number"
                  step="0.01"
                  value={formData.saldoReal}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {formData.saldoReal && resumenDia && (
              <div className="alert alert-info mt-2">
                <p><strong>Diferencia:</strong> {formatCurrency(parseFloat(formData.saldoReal) - resumenDia.saldoEsperado)}</p>
              </div>
            )}

            <button type="submit" className="btn-primary">
              Registrar Cierre del Día
            </button>
          </form>
        </div>
      )}

      {/* Section C: Historial de cierres */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Historial de Cierres</h2>
        </div>

        {historial.length === 0 ? (
          <p className="text-muted">No hay cierres registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ventas</th>
                <th>Efectivo</th>
                <th>Tarjeta</th>
                <th>Facturas #</th>
                <th>Saldo Esperado</th>
                <th>Saldo Real</th>
                <th>Diferencia</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {historial.map((cierre) => (
                <tr key={cierre.id}>
                  <td>{formatDate(cierre.fecha)}</td>
                  <td>{formatCurrency(cierre.totalVentasDia)}</td>
                  <td>{formatCurrency(cierre.totalEfectivo)}</td>
                  <td>{formatCurrency(cierre.totalTarjeta)}</td>
                  <td>{cierre.cantidadFacturas}</td>
                  <td>{formatCurrency(cierre.saldoEsperado)}</td>
                  <td>{formatCurrency(cierre.saldoReal)}</td>
                  <td className={cierre.diferencia !== 0 ? (cierre.diferencia > 0 ? 'badge-green' : 'badge-red') : ''}>
                    {formatCurrency(cierre.diferencia)}
                  </td>
                  <td>{cierre.usuarioEmail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default CierreCajaPage
