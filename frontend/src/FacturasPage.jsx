import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function FacturasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [genFacturaId, setGenFacturaId] = useState('')
  const [pagoForms, setPagoForms] = useState({})
  const [expandedFacturas, setExpandedFacturas] = useState({})
  const [pedidoDetails, setPedidoDetails] = useState({})
  const [cuentaDetails, setCuentaDetails] = useState({})

  // New state for pedidos listos para facturar
  const [pedidosListos, setPedidosListos] = useState([])
  const [loadingPedidosListos, setLoadingPedidosListos] = useState(true)

  // New state for cuenta-based invoicing (migration to tab/open order flow)
  const [cuentasAbiertas, setCuentasAbiertas] = useState([])
  const [loadingCuentasAbiertas, setLoadingCuentasAbiertas] = useState(true)
  const [cuentasListasFacturar, setCuentasListasFacturar] = useState([])
  const [loadingCuentasListas, setLoadingCuentasListas] = useState(true)

  // Cliente fiscal data state - POR PEDIDO (aislado por pedidoId)
  const [datosFiscalesPorPedido, setDatosFiscalesPorPedido] = useState({})
  // Estructura: { [pedidoId]: { esConsumidorFinal, clienteForm, clienteEncontrado, buscandoCliente, expanded } }

  // Estado global legacy (mantener para no romper generarFactura manual - oculto en UI)
  const [esConsumidorFinal, setEsConsumidorFinal] = useState(true)
  const [clienteForm, setClienteForm] = useState({
    identificacionFiscal: '',
    nombre: '',
    direccion: '',
    email: '',
    telefono: '',
    guardarCliente: false
  })
  const [clienteEncontrado, setClienteEncontrado] = useState(null)
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      fetchFacturas()
      fetchPedidosListos()
      fetchCuentasAbiertas()
      fetchCuentasListasFacturar()
    }
  }, [isAuthenticated])

  // Pre-rellenar monto de pago con saldoPendiente
  useEffect(() => {
    const newPagoForms = {}
    facturas.forEach(factura => {
      if (factura.estado === 'PENDIENTE' && factura.saldoPendiente > 0) {
        // Solo pre-rellenar si no hay valor ya establecido
        if (!pagoForms[factura.id]?.monto) {
          newPagoForms[factura.id] = {
            monto: factura.saldoPendiente.toFixed(2),
            metodo: pagoForms[factura.id]?.metodo || ''
          }
        }
      }
    })

    if (Object.keys(newPagoForms).length > 0) {
      setPagoForms(prev => ({ ...prev, ...newPagoForms }))
    }
  }, [facturas])

  // Helper function for currency formatting (must be defined before use in confirmation dialogs)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0)
  }

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

  const fetchCuentasAbiertas = async () => {
    setLoadingCuentasAbiertas(true)
    try {
      const response = await fetch('/api/cuentas/abiertas', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setCuentasAbiertas(data)
      }
    } catch (err) {
      console.error('Error al cargar cuentas abiertas:', err)
    } finally {
      setLoadingCuentasAbiertas(false)
    }
  }

  const fetchCuentasListasFacturar = async () => {
    setLoadingCuentasListas(true)
    try {
      const response = await fetch('/api/cuentas/listas-facturar', {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.ok) {
        const data = await response.json()
        setCuentasListasFacturar(data)
      }
    } catch (err) {
      console.error('Error al cargar cuentas listas:', err)
    } finally {
      setLoadingCuentasListas(false)
    }
  }

  const buscarCliente = async () => {
    if (!clienteForm.identificacionFiscal || clienteForm.identificacionFiscal.trim() === '') {
      setError('Por favor ingresa una identificación fiscal para buscar')
      return
    }

    setBuscandoCliente(true)
    setError('')
    try {
      const response = await fetch(`/api/clientes/buscar?identificacion=${encodeURIComponent(clienteForm.identificacionFiscal)}`, {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 404) {
        // Cliente no existe - limpiar campos para que usuario llene manualmente
        setClienteEncontrado(null)
        setSuccessMessage(`Cliente no encontrado. Ingresa los datos manualmente.`)
        setClienteForm(prev => ({
          ...prev,
          nombre: '',
          direccion: '',
          email: '',
          telefono: '',
          guardarCliente: true // Sugerir guardar el nuevo cliente
        }))
        return
      }

      if (!response.ok) {
        setError('Error al buscar cliente')
        return
      }

      const cliente = await response.json()
      setClienteEncontrado(cliente)
      // Auto-rellenar campos con datos del cliente encontrado
      setClienteForm(prev => ({
        ...prev,
        identificacionFiscal: cliente.identificacionFiscal,
        nombre: cliente.nombre,
        direccion: cliente.direccion || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        guardarCliente: false // No necesario guardar si ya existe
      }))
      setSuccessMessage(`Cliente encontrado: ${cliente.nombre}`)
    } catch (err) {
      setError('Error al buscar cliente: ' + err.message)
    } finally {
      setBuscandoCliente(false)
    }
  }

  const resetClienteForm = () => {
    setClienteForm({
      identificacionFiscal: '',
      nombre: '',
      direccion: '',
      email: '',
      telefono: '',
      guardarCliente: false
    })
    setClienteEncontrado(null)
  }

  // ========== FUNCIONES PARA MANEJAR DATOS FISCALES POR PEDIDO ==========

  const initDatosFiscalesPedido = (pedidoId) => {
    if (!datosFiscalesPorPedido[pedidoId]) {
      setDatosFiscalesPorPedido(prev => ({
        ...prev,
        [pedidoId]: {
          esConsumidorFinal: true,
          clienteForm: {
            identificacionFiscal: '',
            nombre: '',
            direccion: '',
            email: '',
            telefono: '',
            guardarCliente: false
          },
          clienteEncontrado: null,
          buscandoCliente: false,
          expanded: false
        }
      }))
    }
  }

  const toggleDatosFiscalesPedido = (pedidoId) => {
    initDatosFiscalesPedido(pedidoId)
    setDatosFiscalesPorPedido(prev => ({
      ...prev,
      [pedidoId]: {
        ...prev[pedidoId],
        expanded: !prev[pedidoId]?.expanded
      }
    }))
  }

  const updateDatosFiscalesPedido = (pedidoId, updates) => {
    setDatosFiscalesPorPedido(prev => ({
      ...prev,
      [pedidoId]: {
        ...prev[pedidoId],
        ...updates
      }
    }))
  }

  const buscarClientePedido = async (pedidoId) => {
    const datos = datosFiscalesPorPedido[pedidoId]
    if (!datos?.clienteForm.identificacionFiscal || datos.clienteForm.identificacionFiscal.trim() === '') {
      setError('Por favor ingresa una identificación fiscal para buscar')
      return
    }

    updateDatosFiscalesPedido(pedidoId, { buscandoCliente: true })
    setError('')

    try {
      const response = await fetch(`/api/clientes/buscar?identificacion=${encodeURIComponent(datos.clienteForm.identificacionFiscal)}`, {
        headers: { 'Authorization': getAuthHeader() }
      })

      if (response.status === 404) {
        updateDatosFiscalesPedido(pedidoId, {
          clienteEncontrado: null,
          clienteForm: {
            ...datos.clienteForm,
            nombre: '',
            direccion: '',
            email: '',
            telefono: '',
            guardarCliente: true
          },
          buscandoCliente: false
        })
        setSuccessMessage(`Cliente no encontrado. Ingresa los datos manualmente.`)
        return
      }

      if (!response.ok) {
        setError('Error al buscar cliente')
        updateDatosFiscalesPedido(pedidoId, { buscandoCliente: false })
        return
      }

      const cliente = await response.json()
      updateDatosFiscalesPedido(pedidoId, {
        clienteEncontrado: cliente,
        clienteForm: {
          identificacionFiscal: cliente.identificacionFiscal,
          nombre: cliente.nombre,
          direccion: cliente.direccion || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          guardarCliente: false
        },
        buscandoCliente: false
      })
      setSuccessMessage(`Cliente encontrado: ${cliente.nombre}`)
    } catch (err) {
      setError('Error al buscar cliente: ' + err.message)
      updateDatosFiscalesPedido(pedidoId, { buscandoCliente: false })
    }
  }

  const resetDatosFiscalesPedido = (pedidoId) => {
    setDatosFiscalesPorPedido(prev => {
      const newState = { ...prev }
      delete newState[pedidoId]
      return newState
    })
  }

  const generarFacturaFromPedido = async (pedidoId) => {
    setError('')
    setSuccessMessage('')

    // Obtener datos fiscales del pedido específico (o usar defaults)
    const datosPedido = datosFiscalesPorPedido[pedidoId] || {
      esConsumidorFinal: true,
      clienteForm: {
        identificacionFiscal: '',
        nombre: '',
        direccion: '',
        email: '',
        telefono: '',
        guardarCliente: false
      }
    }

    // Validar cliente data si es nominativa
    if (!datosPedido.esConsumidorFinal) {
      if (!datosPedido.clienteForm.identificacionFiscal || datosPedido.clienteForm.identificacionFiscal.trim() === '') {
        setError('Para factura nominativa, la identificación fiscal es obligatoria')
        return
      }
      if (!datosPedido.clienteForm.nombre || datosPedido.clienteForm.nombre.trim() === '') {
        setError('Para factura nominativa, el nombre del cliente es obligatorio')
        return
      }
    }

    // Find pedido info for confirmation dialog
    const pedido = pedidosListos.find(p => p.id === pedidoId)
    let confirmMessage = `¿Confirmas generar la factura para el pedido #${pedidoId}?`

    if (pedido) {
      const totalEstimado = pedido.items.reduce((sum, item) => {
        const itemTotal = item.cantidad * item.precioUnitario
        const extrasTotal = (item.extras || []).reduce((eSum, extra) =>
          eSum + (extra.cantidad * extra.precioUnitario * item.cantidad), 0)
        return sum + itemTotal + extrasTotal
      }, 0)

      const tipoFactura = datosPedido.esConsumidorFinal ? 'Consumidor Final' : `${datosPedido.clienteForm.nombre} (${datosPedido.clienteForm.identificacionFiscal})`
      confirmMessage = `¿Confirmas generar la factura para el pedido #${pedidoId} (Mesa ${pedido.mesaCodigo}) por ${formatCurrency(totalEstimado)}?\n\nTipo: ${tipoFactura}\n\nEsta acción no se puede deshacer.`
    } else {
      confirmMessage += '\n\nEsta acción no se puede deshacer.'
    }

    // Show confirmation dialog
    if (!window.confirm(confirmMessage)) {
      return
    }

    // Build request body usando datos del pedido específico
    const requestBody = {
      pedidoId: pedidoId,
      esConsumidorFinal: datosPedido.esConsumidorFinal
    }

    if (!datosPedido.esConsumidorFinal) {
      requestBody.clienteIdentificacionFiscal = datosPedido.clienteForm.identificacionFiscal
      requestBody.clienteNombre = datosPedido.clienteForm.nombre
      requestBody.clienteDireccion = datosPedido.clienteForm.direccion || null
      requestBody.clienteEmail = datosPedido.clienteForm.email || null
      requestBody.clienteTelefono = datosPedido.clienteForm.telefono || null
      requestBody.guardarCliente = datosPedido.clienteForm.guardarCliente
    }

    try {
      const response = await fetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify(requestBody)
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (response.status === 400) {
        const errorData = await response.json()
        setError(errorData.error || 'Estado de pedido inválido para facturación')
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

      const facturaData = await response.json()
      const tipoMsg = datosPedido.esConsumidorFinal ? '(Consumidor Final)' : `(${datosPedido.clienteForm.nombre})`
      setSuccessMessage(`Factura #${facturaData.id} generada exitosamente para el pedido #${pedidoId} ${tipoMsg}`)
      fetchFacturas()
      fetchPedidosListos()
      // Reset datos fiscales del pedido específico after successful creation
      resetDatosFiscalesPedido(pedidoId)
    } catch (err) {
      setError('Error al crear factura: ' + err.message)
    }
  }

  const generarFacturaFromCuenta = async (cuentaId) => {
    setError('')
    setSuccessMessage('')

    // Find cuenta info for confirmation dialog
    const cuenta = cuentasListasFacturar.find(c => c.id === cuentaId)
    if (!cuenta) {
      setError('No se encontró la cuenta')
      return
    }

    const confirmMessage = `¿Confirmas generar la factura para la cuenta de Mesa ${cuenta.mesaCodigo}?\n\nTotal estimado: ${formatCurrency(cuenta.totalEstimado)}\nPedidos: ${cuenta.totalPedidos}\n\nEsta acción no se puede deshacer.`

    // Show confirmation dialog
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/facturas/cuenta/${cuentaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          esConsumidorFinal: true
        })
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (response.status === 400) {
        const errorData = await response.json()
        setError(errorData.error || 'Estado de cuenta inválido para facturación')
        return
      }

      if (response.status === 409) {
        const errorData = await response.json()
        setError(errorData.error || 'Ya existe una factura para esta cuenta')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al crear factura: ' + errorText)
        return
      }

      const facturaData = await response.json()
      setSuccessMessage(`Factura #${facturaData.id} generada exitosamente para la cuenta de Mesa ${cuenta.mesaCodigo}`)
      fetchFacturas()
      fetchCuentasAbiertas()
      fetchCuentasListasFacturar()
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
    setSuccessMessage('')
    const form = pagoForms[facturaId] || {}

    if (!form.monto || form.monto <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    if (!form.metodo) {
      setError('Por favor selecciona un método de pago')
      return
    }

    // Find factura for confirmation dialog
    const factura = facturas.find(f => f.id === facturaId)
    if (!factura) {
      setError('No se encontró la factura')
      return
    }

    const monto = parseFloat(form.monto)
    const saldoPendiente = factura.saldoPendiente || 0

    // Build confirmation message with details
    let confirmMessage = `Resumen del Pago:\n\n`
    confirmMessage += `Factura #${facturaId}\n`
    confirmMessage += `Total: ${formatCurrency(factura.total)}\n`
    confirmMessage += `Total Pagado: ${formatCurrency(factura.totalPagado || 0)}\n`
    confirmMessage += `Saldo Pendiente: ${formatCurrency(saldoPendiente)}\n\n`
    confirmMessage += `Monto a Registrar: ${formatCurrency(monto)}\n`
    confirmMessage += `Método: ${form.metodo}\n\n`

    // Add warning or confirmation based on payment type
    if (monto < saldoPendiente) {
      // Partial payment warning
      const nuevoSaldo = saldoPendiente - monto
      confirmMessage += `⚠️ PAGO PARCIAL\n\n`
      confirmMessage += `Esto dejará la factura en estado PENDIENTE con saldo pendiente de ${formatCurrency(nuevoSaldo)}.\n\n`
      confirmMessage += `¿Deseas continuar?`
    } else if (Math.abs(monto - saldoPendiente) < 0.01) {
      // Full payment
      confirmMessage += `✓ PAGO TOTAL\n\n`
      confirmMessage += `Esto marcará la factura como PAGADA y el pedido como PAGADO.\n\n`
      confirmMessage += `¿Confirmas registrar el pago?`
    } else {
      // Should not happen due to UI validation, but just in case
      confirmMessage += `¿Confirmas registrar el pago?`
    }

    // Show confirmation dialog
    if (!window.confirm(confirmMessage)) {
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
          monto: monto,
          metodo: form.metodo
        })
      })

      if (response.status === 401) {
        setError('No autorizado - por favor inicia sesión nuevamente')
        return
      }

      if (response.status === 400) {
        const errorData = await response.json()
        setError(errorData.error || 'Error de validación al registrar pago')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Error al registrar pago: ' + errorText)
        return
      }

      const updatedFactura = await response.json()

      // Show success message based on payment result
      if (updatedFactura.estado === 'PAGADA') {
        setSuccessMessage(`Pago registrado exitosamente. Factura #${facturaId} marcada como PAGADA.`)
      } else {
        setSuccessMessage(`Pago parcial de ${formatCurrency(monto)} registrado exitosamente. Saldo pendiente: ${formatCurrency(updatedFactura.saldoPendiente || 0)}`)
      }

      setPagoForms(prev => ({ ...prev, [facturaId]: {} }))
      fetchFacturas()
      fetchPedidosListos() // Refresh pedidos listos when payment is registered
    } catch (err) {
      setError('Error al registrar pago: ' + err.message)
    }
  }

  const toggleFacturaDetails = async (facturaId, pedidoId, cuentaId) => {
    if (expandedFacturas[facturaId]) {
      // Collapse
      setExpandedFacturas(prev => ({ ...prev, [facturaId]: false }))
    } else {
      // Expand and fetch details if not already loaded
      setExpandedFacturas(prev => ({ ...prev, [facturaId]: true }))

      // For pedido-based facturas: fetch pedido details
      if (pedidoId && !pedidoDetails[pedidoId]) {
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

      // For cuenta-based facturas: fetch cuenta details (includes all pedidos)
      if (cuentaId && !cuentaDetails[cuentaId]) {
        try {
          const response = await fetch(`/api/cuentas/${cuentaId}`, {
            headers: { 'Authorization': getAuthHeader() }
          })

          if (response.ok) {
            const data = await response.json()
            setCuentaDetails(prev => ({ ...prev, [cuentaId]: data }))
          }
        } catch (err) {
          console.error('Error fetching cuenta details:', err)
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
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* SECCIÓN "GENERAR FACTURA" MANUAL - OCULTA (NO ELIMINADA)
          Mantener código para fallback/reactivación futura */}
      {false && (
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

            {/* Cliente Fiscal Data Section */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Datos Fiscales:</div>

              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={esConsumidorFinal}
                    onChange={() => {
                      setEsConsumidorFinal(true)
                      resetClienteForm()
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  Consumidor Final
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={!esConsumidorFinal}
                    onChange={() => setEsConsumidorFinal(false)}
                    style={{ marginRight: '8px' }}
                  />
                  Factura a nombre de
                </label>
              </div>

              {!esConsumidorFinal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="clienteIdentificacion" style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                        Cédula/RUC *
                      </label>
                      <input
                        id="clienteIdentificacion"
                        type="text"
                        value={clienteForm.identificacionFiscal}
                        onChange={(e) => setClienteForm(prev => ({ ...prev, identificacionFiscal: e.target.value }))}
                        required={!esConsumidorFinal}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={buscarCliente}
                      disabled={buscandoCliente || !clienteForm.identificacionFiscal}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {buscandoCliente ? 'Buscando...' : 'Buscar Cliente'}
                    </button>
                  </div>

                  <div>
                    <label htmlFor="clienteNombre" style={{ fontSize: '0.9em', fontWeight: 'bold' }}>
                      Nombre Completo *
                    </label>
                    <input
                      id="clienteNombre"
                      type="text"
                      value={clienteForm.nombre}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, nombre: e.target.value }))}
                      required={!esConsumidorFinal}
                      style={{ marginTop: '4px' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="clienteDireccion" style={{ fontSize: '0.9em' }}>
                      Dirección
                    </label>
                    <input
                      id="clienteDireccion"
                      type="text"
                      value={clienteForm.direccion}
                      onChange={(e) => setClienteForm(prev => ({ ...prev, direccion: e.target.value }))}
                      style={{ marginTop: '4px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label htmlFor="clienteEmail" style={{ fontSize: '0.9em' }}>
                        Email
                      </label>
                      <input
                        id="clienteEmail"
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => setClienteForm(prev => ({ ...prev, email: e.target.value }))}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="clienteTelefono" style={{ fontSize: '0.9em' }}>
                        Teléfono
                      </label>
                      <input
                        id="clienteTelefono"
                        type="tel"
                        value={clienteForm.telefono}
                        onChange={(e) => setClienteForm(prev => ({ ...prev, telefono: e.target.value }))}
                        style={{ marginTop: '4px' }}
                      />
                    </div>
                  </div>

                  {!clienteEncontrado && (
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9em' }}>
                      <input
                        type="checkbox"
                        checked={clienteForm.guardarCliente}
                        onChange={(e) => setClienteForm(prev => ({ ...prev, guardarCliente: e.target.checked }))}
                        style={{ marginRight: '8px' }}
                      />
                      Guardar cliente para futuras facturas
                    </label>
                  )}

                  {clienteEncontrado && (
                    <div style={{ padding: '8px', backgroundColor: '#d1fae5', borderLeft: '3px solid #10b981', borderRadius: '4px', fontSize: '0.9em' }}>
                      Cliente encontrado en el sistema
                    </div>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>Generar Factura</button>
          </form>
        </div>
      )}

      {/* ORDENES ABIERTAS (Cuentas abiertas con pedidos en progreso) */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Ordenes Abiertas</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
            Cuentas con pedidos en progreso (PENDIENTE, PREPARACION, LISTO)
          </p>
        </div>
        {loadingCuentasAbiertas ? (
          <div className="loading">Cargando ordenes abiertas...</div>
        ) : cuentasAbiertas.length === 0 ? (
          <p className="text-muted">No hay ordenes abiertas</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID Cuenta</th>
                  <th>Mesa</th>
                  <th>Fecha Apertura</th>
                  <th>Total Pedidos</th>
                  <th>Pendientes</th>
                  <th>Entregados</th>
                  <th>Total Estimado</th>
                  <th>Pedidos</th>
                </tr>
              </thead>
              <tbody>
                {cuentasAbiertas.map(cuenta => {
                  return (
                    <tr key={cuenta.id}>
                      <td><strong>#{cuenta.id}</strong></td>
                      <td><strong>{cuenta.mesaCodigo}</strong></td>
                      <td>{new Date(cuenta.fechaHoraApertura).toLocaleString()}</td>
                      <td>{cuenta.totalPedidos}</td>
                      <td>
                        <span className="badge badge-yellow">
                          {cuenta.pedidosPendientes}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-green">
                          {cuenta.pedidosEntregados}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(cuenta.totalEstimado)}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85em' }}>
                          {cuenta.pedidos && cuenta.pedidos.length > 0 ? (
                            cuenta.pedidos.map(pedido => (
                              <div key={pedido.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                  Pedido #{pedido.id} - <span className="badge badge-yellow">{pedido.estado}</span>
                                </div>
                                {pedido.items && pedido.items.map((item, idx) => (
                                  <div key={idx} style={{ marginLeft: '10px', marginBottom: '5px' }}>
                                    <div style={{ fontWeight: '500' }}>
                                      {item.cantidad}x {item.productoNombre}
                                    </div>
                                    {item.extras && item.extras.length > 0 && (
                                      <div style={{ marginTop: '2px', marginLeft: '12px', fontSize: '0.85em', color: '#666' }}>
                                        {item.extras.map((extra, extraIdx) => (
                                          <div key={extraIdx}>
                                            + {extra.nombre} x{extra.cantidad} ({formatCurrency(extra.precioUnitario)})
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">Sin pedidos</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUENTA-BASED: Pedidos Listos para Facturar (Cuentas listas) */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Pedidos Listos para Facturar</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
            Cuentas con todos los pedidos entregados, listas para facturar
          </p>
        </div>
        {loadingCuentasListas ? (
          <div className="loading">Cargando cuentas listas...</div>
        ) : cuentasListasFacturar.length === 0 ? (
          <p className="text-muted">No hay cuentas listas para facturar</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ID Cuenta</th>
                  <th>Mesa</th>
                  <th>Total Pedidos</th>
                  <th>Entregados</th>
                  <th>Total Estimado</th>
                  <th>Pedidos (Items + Extras)</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cuentasListasFacturar.map(cuenta => {
                  return (
                    <tr key={cuenta.id}>
                      <td><strong>#{cuenta.id}</strong></td>
                      <td><strong>{cuenta.mesaCodigo}</strong></td>
                      <td>{cuenta.totalPedidos}</td>
                      <td>
                        <span className="badge badge-green">
                          {cuenta.pedidosEntregados}
                        </span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(cuenta.totalEstimado)}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85em' }}>
                          {cuenta.pedidos && cuenta.pedidos.length > 0 ? (
                            cuenta.pedidos.map(pedido => (
                              <div key={pedido.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                  Pedido #{pedido.id} - <span className="badge badge-green">{pedido.estado}</span>
                                </div>
                                {pedido.items && pedido.items.map((item, idx) => (
                                  <div key={idx} style={{ marginLeft: '10px', marginBottom: '5px' }}>
                                    <div style={{ fontWeight: '500' }}>
                                      {item.cantidad}x {item.productoNombre}
                                    </div>
                                    {item.extras && item.extras.length > 0 && (
                                      <div style={{ marginTop: '2px', marginLeft: '12px', fontSize: '0.85em', color: '#666' }}>
                                        {item.extras.map((extra, extraIdx) => (
                                          <div key={extraIdx}>
                                            + {extra.nombre} x{extra.cantidad} ({formatCurrency(extra.precioUnitario)})
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))
                          ) : (
                            <span className="text-muted">Sin pedidos</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => generarFacturaFromCuenta(cuenta.id)}
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
                      {factura.creadaPor && (
                        <span style={{ marginLeft: '15px', fontSize: '0.85em', color: '#666' }}>
                          Generada por: <strong>{factura.creadaPor}</strong>
                        </span>
                      )}
                    </div>
                    <span className={`badge ${
                      factura.estado === 'PENDIENTE' ? 'badge-yellow' :
                      factura.estado === 'PAGADA' ? 'badge-green' :
                      'badge-gray'
                    }`}>
                      {factura.estado}
                    </span>
                  </div>

                  {/* Cliente Snapshot */}
                  {factura.clienteNombre && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: '5px' }}>Datos Fiscales (Snapshot):</div>
                      <div style={{ fontSize: '0.85em', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 10px' }}>
                        <span style={{ color: '#666' }}>Nombre:</span>
                        <span><strong>{factura.clienteNombre}</strong></span>
                        {factura.clienteIdentificacionFiscal && factura.clienteIdentificacionFiscal !== 'CONSUMIDOR FINAL' && (
                          <>
                            <span style={{ color: '#666' }}>Identificación:</span>
                            <span><strong>{factura.clienteIdentificacionFiscal}</strong></span>
                          </>
                        )}
                        {factura.clienteDireccion && (
                          <>
                            <span style={{ color: '#666' }}>Dirección:</span>
                            <span>{factura.clienteDireccion}</span>
                          </>
                        )}
                        {factura.clienteEmail && (
                          <>
                            <span style={{ color: '#666' }}>Email:</span>
                            <span>{factura.clienteEmail}</span>
                          </>
                        )}
                        {factura.clienteTelefono && (
                          <>
                            <span style={{ color: '#666' }}>Teléfono:</span>
                            <span>{factura.clienteTelefono}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

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
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Total Pagado:</span>
                      <div style={{ color: '#2563eb' }}><strong>{formatCurrency(factura.totalPagado || 0)}</strong></div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85em', color: '#666' }}>Saldo Pendiente:</span>
                      <div style={{ fontSize: '1.2em', color: factura.saldoPendiente > 0 ? '#dc2626' : '#059669' }}>
                        <strong>{formatCurrency(factura.saldoPendiente || 0)}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleFacturaDetails(factura.id, factura.pedidoId, factura.cuentaId)}
                      className="btn-secondary btn-small"
                    >
                      {isExpanded ? 'Ocultar Detalle' : 'Ver Detalle'}
                    </button>

                    {factura.estado === 'PENDIENTE' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
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
                          <button
                            onClick={() => registrarPago(factura.id)}
                            className="btn-success btn-small"
                            disabled={
                              !pagoForm.monto ||
                              parseFloat(pagoForm.monto) <= 0 ||
                              parseFloat(pagoForm.monto) > (factura.saldoPendiente || 0) ||
                              !pagoForm.metodo
                            }
                          >
                            Registrar Pago
                          </button>
                        </div>
                        {/* Warning for invalid amounts */}
                        {pagoForm.monto && parseFloat(pagoForm.monto) > (factura.saldoPendiente || 0) && (
                          <div style={{ fontSize: '0.85em', color: '#dc2626', fontWeight: 'bold' }}>
                            ⚠️ El monto excede el saldo pendiente. No se permiten sobrepagos.
                          </div>
                        )}
                        {pagoForm.monto && parseFloat(pagoForm.monto) <= 0 && (
                          <div style={{ fontSize: '0.85em', color: '#dc2626', fontWeight: 'bold' }}>
                            ⚠️ El monto debe ser mayor a 0.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                      {factura.cuentaId ? (
                        // Factura generada desde cuenta - mostrar todos los pedidos
                        <>
                          {cuentaDetails[factura.cuentaId] ? (
                            <>
                              <strong>Pedidos de la cuenta (Mesa: {cuentaDetails[factura.cuentaId].mesaCodigo}):</strong>
                              {cuentaDetails[factura.cuentaId].pedidos && cuentaDetails[factura.cuentaId].pedidos.length > 0 ? (
                                cuentaDetails[factura.cuentaId].pedidos.map((pedido, pedidoIdx) => (
                                  <div key={pedido.id} style={{ marginTop: '15px', paddingLeft: '10px', borderLeft: '2px solid #e5e7eb' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                      Pedido #{pedido.id} - {new Date(pedido.fechaHora).toLocaleString()}
                                    </div>
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
                                ))
                              ) : (
                                <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>No hay pedidos en esta cuenta.</p>
                              )}
                            </>
                          ) : (
                            <div style={{ padding: '10px', textAlign: 'center' }}>
                              <span className="loading" style={{ display: 'inline-block' }}>Cargando detalles de la cuenta...</span>
                            </div>
                          )}
                        </>
                      ) : factura.pedidoId ? (
                        // Factura generada desde pedido individual - mostrar detalle del pedido
                        <>
                          {pedido ? (
                            <>
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
                            </>
                          ) : (
                            <div style={{ padding: '10px', textAlign: 'center' }}>
                              <span className="loading" style={{ display: 'inline-block' }}>Cargando detalles del pedido...</span>
                            </div>
                          )}
                        </>
                      ) : (
                        // Factura sin pedido ni cuenta (caso edge - no debería ocurrir)
                        <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                          <p>No hay detalles de pedidos disponibles para esta factura.</p>
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
                            {pago.registradoPor && (
                              <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#666' }}>
                                - Registrado por: <strong>{pago.registradoPor}</strong>
                              </span>
                            )}
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
