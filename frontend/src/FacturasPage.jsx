import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function FacturasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [genFacturaId, setGenFacturaId] = useState('')
  const [pagoForms, setPagoForms] = useState({})

  useEffect(() => {
    if (isAuthenticated) {
      fetchFacturas()
    }
  }, [isAuthenticated])

  const fetchFacturas = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/facturas', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Failed to fetch facturas')
        setLoading(false)
        return
      }

      const data = await response.json()
      setFacturas(data)
    } catch (err) {
      setError('Error fetching facturas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const generarFactura = async (e) => {
    e.preventDefault()
    setError('')

    if (!genFacturaId) {
      setError('Please enter a pedido ID')
      return
    }

    try {
      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ pedidoId: parseInt(genFacturaId) })
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to create factura: ' + errorText)
        return
      }

      setGenFacturaId('')
      fetchFacturas()
    } catch (err) {
      setError('Error creating factura: ' + err.message)
    }
  }

  const handlePagoFormChange = (facturaId, field, value) => {
    setPagoForms(prev => ({
      ...prev,
      [facturaId]: {
        ...prev[facturaId],
        [field]: value
      }
    }))
  }

  const registrarPago = async (facturaId) => {
    setError('')
    const form = pagoForms[facturaId] || {}

    if (!form.monto || form.monto <= 0) {
      setError('Monto must be greater than 0')
      return
    }

    if (!form.metodo) {
      setError('Please select a payment method')
      return
    }

    try {
      const response = await fetch('/api/pagos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          facturaId: facturaId,
          monto: parseFloat(form.monto),
          metodo: form.metodo
        })
      })

      if (response.status === 401) {
        setError('Not authorized - please log in again')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to register payment: ' + errorText)
        return
      }

      setPagoForms(prev => ({ ...prev, [facturaId]: {} }))
      fetchFacturas()
    } catch (err) {
      setError('Error registering payment: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Facturas</h2>
          <p>You must log in to view this page</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalFacturas = facturas.length
  const facturasPendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
  const facturasPagadas = facturas.filter(f => f.estado === 'PAGADO' || f.estado === 'PAGADA').length
  const montoTotalCobrado = facturas
    .filter(f => f.estado === 'PAGADO' || f.estado === 'PAGADA')
    .reduce((sum, f) => sum + f.total, 0)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
  }

  return (
    <div>
      <h1>Facturas</h1>

      {/* Summary Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Facturas</div>
          <div className="stat-value stat-value-primary">{totalFacturas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value stat-value-warning">{facturasPendientes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pagadas</div>
          <div className="stat-value stat-value-success">{facturasPagadas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cobrado</div>
          <div className="stat-value stat-value-success">{formatCurrency(montoTotalCobrado)}</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Generar Factura</h2>
        </div>
        <form onSubmit={generarFactura}>
          <label htmlFor="pedidoId">
            Pedido ID:
          </label>
          <input
            id="pedidoId"
            type="number"
            value={genFacturaId}
            onChange={(e) => setGenFacturaId(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">Generar Factura</button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Facturas Recientes</h2>
        </div>
        {loading ? (
          <div className="loading">Loading</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Factura ID</th>
                <th>Pedido ID</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pagos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan="7">No facturas found</td>
                </tr>
              ) : (
                facturas.map(factura => {
                  const pagoForm = pagoForms[factura.id] || {}
                  return (
                    <tr key={factura.id}>
                      <td>{factura.id}</td>
                      <td>{factura.pedidoId}</td>
                      <td>{new Date(factura.fechaHora).toLocaleString()}</td>
                      <td>${factura.total.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          factura.estado === 'PENDIENTE' ? 'badge-yellow' :
                          factura.estado === 'PAGADO' ? 'badge-green' :
                          'badge-gray'
                        }`}>
                          {factura.estado}
                        </span>
                      </td>
                      <td>{factura.pagos.length} items</td>
                      <td>
                        {factura.estado === 'PENDIENTE' ? (
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <label htmlFor={`monto-${factura.id}`}>
                              Monto:
                            </label>
                            <input
                              id={`monto-${factura.id}`}
                              type="number"
                              step="0.01"
                              value={pagoForm.monto || ''}
                              onChange={(e) => handlePagoFormChange(factura.id, 'monto', e.target.value)}
                              style={{ width: '80px' }}
                            />
                            <label htmlFor={`metodo-${factura.id}`}>
                              Método:
                            </label>
                            <select
                              id={`metodo-${factura.id}`}
                              value={pagoForm.metodo || ''}
                              onChange={(e) => handlePagoFormChange(factura.id, 'metodo', e.target.value)}
                            >
                              <option value="">-- Select --</option>
                              <option value="EFECTIVO">EFECTIVO</option>
                              <option value="TARJETA">TARJETA</option>
                            </select>
                            <button onClick={() => registrarPago(factura.id)} className="btn-success btn-small">Registrar Pago</button>
                          </div>
                        ) : (
                          <span>-</span>
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
    </div>
  )
}

export default FacturasPage
