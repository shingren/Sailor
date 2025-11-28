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
      <div>
        <h2>Facturas</h2>
        <p>You must log in to view this page</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Facturas - Billing & Payments</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>Generar Factura</h3>
      <form onSubmit={generarFactura}>
        <label>
          Pedido ID:
          <input
            type="number"
            value={genFacturaId}
            onChange={(e) => setGenFacturaId(e.target.value)}
            required
          />
        </label>
        {' '}
        <button type="submit">Generar Factura</button>
      </form>

      <h3>Facturas Existentes</h3>
      {loading ? (
        <p>Loading facturas...</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>Factura ID</th>
              <th>Pedido ID</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Pagos Count</th>
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
                    <td><strong>{factura.estado}</strong></td>
                    <td>{factura.pagos.length}</td>
                    <td>
                      {factura.estado === 'PENDIENTE' ? (
                        <div>
                          <label>
                            Monto:
                            <input
                              type="number"
                              step="0.01"
                              value={pagoForm.monto || ''}
                              onChange={(e) => handlePagoFormChange(factura.id, 'monto', e.target.value)}
                              style={{ width: '80px' }}
                            />
                          </label>
                          {' '}
                          <label>
                            Método:
                            <select
                              value={pagoForm.metodo || ''}
                              onChange={(e) => handlePagoFormChange(factura.id, 'metodo', e.target.value)}
                            >
                              <option value="">-- Select --</option>
                              <option value="EFECTIVO">EFECTIVO</option>
                              <option value="TARJETA">TARJETA</option>
                            </select>
                          </label>
                          {' '}
                          <button onClick={() => registrarPago(factura.id)}>Registrar Pago</button>
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
  )
}

export default FacturasPage
