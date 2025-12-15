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
  const [expandedFacturas, setExpandedFacturas] = useState({})
  const [pedidoDetails, setPedidoDetails] = useState({})

  // New state for pedidos listos para facturar
  const [pedidosListos, setPedidosListos] = useState([])
  const [loadingPedidosListos, setLoadingPedidosListos] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      fetchFacturas()
      fetchPedidosListos()
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
        setError('No autorizado - por favor inicia sesión nuevamente')
        setLoading(false)
        return
      }

      if (!response.ok) {
        setError('Error al cargar facturas')
        setLoading(false)
        return
      }

      const data = await response.json()
      setFacturas(data)
    } catch (err) {
      setError('Error al cargar facturas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPedidosListos = async () => {
    setLoadingPedidosListos(true)
    try {
      const response = await fetch('/api/pedidos/listos-facturar', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setPedidosListos(data)
      }
    } catch (err) {
      console.error('Error al cargar pedidos listos:', err)
    } finally {
      setLoadingPedidosListos(false)
    }
  }

  const generarFacturaFromPedido = async (pedidoId) => {
    setError('')

    try {
      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ pedidoId: pedidoId })
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (response.status === 409) {
        const errorData = await response.json()
        setError(errorData.error || 'Ya existe una factura para este pedido')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al crear factura: ' + errorText)
        return
      }

      fetchFacturas()
      fetchPedidosListos()
    } catch (err) {
      setError('Error al crear factura: ' + err.message)
    }
  }

  const generarFactura = async (e) => {
    e.preventDefault()
    setError('')

    if (!genFacturaId) {
      setError('Por favor ingresa un ID de pedido')
      return
    }

    await generarFacturaFromPedido(parseInt(genFacturaId))
    setGenFacturaId('')
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
      setError('El monto debe ser mayor a 0')
      return
    }

    if (!form.metodo) {
      setError('Por favor selecciona un método de pago')
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
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al registrar pago: ' + errorText)
        return
      }

      setPagoForms(prev => ({ ...prev, [facturaId]: {} }))
      fetchFacturas()
      fetchPedidosListos() // Refresh pedidos listos when payment is registered
    } catch (err) {
      setError('Error al registrar pago: ' + err.message)
    }
  }

  const toggleFacturaDetails = async (facturaId, pedidoId) => {
    if (expandedFacturas[facturaId]) {
      // Collapse
      setExpandedFacturas(prev => ({ ...prev, [facturaId]: false }))
    } else {
      // Expand and fetch pedido details if not already loaded
      setExpandedFacturas(prev => ({ ...prev, [facturaId]: true }))

      if (!pedidoDetails[pedidoId]) {
        try {
          const response = await fetch(`/api/pedidos/${pedidoId}`, {
            headers: { 'Authorization': getAuthHeader() }
          })

          if (response.ok) {
            const data = await response.json()
            setPedidoDetails(prev => ({ ...prev, [pedidoId]: data }))
          }
        } catch (err) {
          console.error('Error fetching pedido details:', err)
        }
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Facturas</h2>
          <p>Debes iniciar sesión para ver esta página</p>
          <Link to="/login" className="btn-primary">Ir a Iniciar Sesión</Link>
        </div>
      </div>
    )
  }

  // Calculate summary statistics
  const totalFacturas = facturas.length
  const facturasPendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
  const facturasPagadas = facturas.filter(f => f.estado === 'PAGADA').length
  const montoTotalCobrado = facturas
    .filter(f => f.estado === 'PAGADA')
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
          <div className="stat-label">Total de Facturas</div>
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

      {/* NEW SECTION: Pedidos Listos para Facturar */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pedidos Listos para Facturar</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
            Pedidos entregados que aún no tienen factura generada
          </p>
        </div>
        {loadingPedidosListos ? (
          <div className="loading">Cargando pedidos...</div>
        ) : pedidosListos.length === 0 ? (
          <p className="text-muted">No hay pedidos listos para facturar</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID Pedido</th>
                  <th>Mesa</th>
                  <th>Fecha y Hora</th>
                  <th>Items</th>
                  <th>Total Estimado</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosListos.map(pedido => {
                  // Calculate total estimate
                  const totalEstimado = pedido.items.reduce((sum, item) => {
                    const itemTotal = item.cantidad * item.precioUnitario
                    const extrasTotal = (item.extras || []).reduce((eSum, extra) =>
                      eSum + (extra.cantidad * extra.precioUnitario * item.cantidad), 0)
                    return sum + itemTotal + extrasTotal
                  }, 0)

                  return (
                    <tr key={pedido.id}>
                      <td><strong>#{pedido.id}</strong></td>
                      <td>{pedido.mesaCodigo}</td>
                      <td>{new Date(pedido.fechaHora).toLocaleString()}</td>
                      <td>
                        {pedido.items.length} ítem{pedido.items.length !== 1 ? 's' : ''}
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
                          {pedido.items.map(item => `${item.cantidad}x ${item.productoNombre}`).join(', ')}
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(totalEstimado)}
                      </td>
                      <td>
                        <span className="badge badge-green">
                          {pedido.estado}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => generarFacturaFromPedido(pedido.id)}
                          className="btn-primary btn-small"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Generar Factura
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Facturas Recientes</h2>
        </div>
        {loading ? (
          <div className="loading">Cargando</div>
        ) : facturas.length === 0 ? (
          <p className="text-muted">No se encontraron facturas</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {facturas.map(factura => {
              const pagoForm = pagoForms[factura.id] || {}
              const isExpanded = expandedFacturas[factura.id]
              const pedido = pedidoDetails[factura.pedidoId]

              return (
                <div key={factura.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>Factura #{factura.id}</strong>
                      <span style={{ marginLeft: '15px' }}>Pedido: <strong>#{factura.pedidoId}</strong></span>
                      <span style={{ marginLeft: '15px' }}>{new Date(factura.fechaHora).toLocaleString()}</span>
                    </div>
                    <span className={`badge ${
                      factura.estado === 'PENDIENTE' ? 'badge-yellow' :
                      factura.estado === 'PAGADA' ? 'badge-green' :
                      'badge-gray'
                    }`}>
                      {factura.estado}
                    </span>
                  </div>

                  <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Subtotal:</span>
                      <div><strong>{formatCurrency(factura.subtotal)}</strong></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Impuestos (13%):</span>
                      <div><strong>{formatCurrency(factura.impuestos)}</strong></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Descuento:</span>
                      <div><strong>{formatCurrency(factura.descuento)}</strong></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Total:</span>
                      <div style={{ fontSize: '1.2em', color: '#059669' }}><strong>{formatCurrency(factura.total)}</strong></div>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleFacturaDetails(factura.id, factura.pedidoId)}
                      className="btn-secondary btn-small"
                    >
                      {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                    </button>

                    {factura.estado === 'PENDIENTE' && (
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginLeft: 'auto' }}>
                        <label htmlFor={`monto-${factura.id}`} style={{ fontSize: '0.9em' }}>
                          Monto:
                        </label>
                        <input
                          id={`monto-${factura.id}`}
                          type="number"
                          step="0.01"
                          value={pagoForm.monto || ''}
                          onChange={(e) => handlePagoFormChange(factura.id, 'monto', e.target.value)}
                          style={{ width: '100px' }}
                        />
                        <label htmlFor={`metodo-${factura.id}`} style={{ fontSize: '0.9em' }}>
                          Método:
                        </label>
                        <select
                          id={`metodo-${factura.id}`}
                          value={pagoForm.metodo || ''}
                          onChange={(e) => handlePagoFormChange(factura.id, 'metodo', e.target.value)}
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="EFECTIVO">EFECTIVO</option>
                          <option value="TARJETA">TARJETA</option>
                        </select>
                        <button onClick={() => registrarPago(factura.id)} className="btn-success btn-small">Registrar Pago</button>
                      </div>
                    )}
                  </div>

                  {isExpanded && pedido && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                      <strong>Detalle del Pedido:</strong>
                      <ul style={{ marginTop: '8px', marginLeft: '20px' }}>
                        {pedido.items.map((item, idx) => {
                          const itemSubtotal = item.cantidad * item.precioUnitario
                          const extrasSubtotal = item.extras?.reduce((sum, extra) => sum + (extra.cantidad * extra.precioUnitario * item.cantidad), 0) || 0
                          const itemTotal = itemSubtotal + extrasSubtotal

                          return (
                            <li key={idx} style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                  <strong>{item.cantidad}x</strong> {item.productoNombre}
                                </div>
                                <div style={{ marginLeft: '15px' }}>
                                  {formatCurrency(itemSubtotal)}
                                </div>
                              </div>
                              {item.extras && item.extras.length > 0 && (
                                <ul style={{ marginTop: '4px', marginLeft: '20px', listStyleType: 'circle', fontSize: '0.9em', color: '#666' }}>
                                  {item.extras.map((extra, extraIdx) => (
                                    <li key={extraIdx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <span>+ {extra.nombre} x{extra.cantidad}</span>
                                      <span style={{ marginLeft: '10px' }}>
                                        {formatCurrency(extra.cantidad * extra.precioUnitario * item.cantidad)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {item.extras && item.extras.length > 0 && (
                                <div style={{ fontSize: '0.85em', color: '#059669', marginTop: '4px', marginLeft: '20px' }}>
                                  Subtotal del ítem: {formatCurrency(itemTotal)}
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                      {pedido.observaciones && (
                        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderLeft: '3px solid #ffc107', borderRadius: '4px' }}>
                          <strong>Observaciones:</strong> {pedido.observaciones}
                        </div>
                      )}
                    </div>
                  )}

                  {factura.pagos.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                      <strong>Pagos registrados:</strong>
                      <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                        {factura.pagos.map((pago, idx) => (
                          <li key={idx}>
                            {formatCurrency(pago.monto)} - {pago.metodo} ({new Date(pago.fechaHora).toLocaleString()})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FacturasPage
