import { useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate, Link } from 'react-router-dom'

function FloorplanPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const navigate = useNavigate()
  const canvasRef = useRef(null)

  const [mesas, setMesas] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedZone, setSelectedZone] = useState('INSIDE')
  const [selectedMesas, setSelectedMesas] = useState([])
  const [draggedMesa, setDraggedMesa] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Canvas transform state
  const [scale, setScale] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  const TABLE_RADIUS = 30
  const CANVAS_WIDTH = 1200
  const CANVAS_HEIGHT = 700

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!loading && mesas.length > 0) {
      drawCanvas()
    }
  }, [mesas, pedidos, selectedZone, scale, panOffset, selectedMesas])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [mesasRes, pedidosRes] = await Promise.all([
        fetch('/api/mesas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('/api/pedidos', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (mesasRes.ok) {
        const mesasData = await mesasRes.json()
        // Initialize positions for mesas that don't have them
        const initializedMesas = mesasData.map((mesa, index) => {
          if (mesa.positionX === null || mesa.positionY === null) {
            const zone = mesa.zona || 'INSIDE'
            return {
              ...mesa,
              positionX: 100 + (index % 10) * 100,
              positionY: 100 + Math.floor(index / 10) * 100,
              zona: zone
            }
          }
          return mesa
        })
        setMesas(initializedMesas)
      }

      if (pedidosRes.ok) {
        const pedidosData = await pedidosRes.json()
        setPedidos(pedidosData)
      }
    } catch (err) {
      setError('Error loading data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getMesaStatus = (mesa) => {
    const activePedidos = pedidos.filter(p =>
      p.mesaId === mesa.id &&
      (p.estado === 'PENDIENTE' || p.estado === 'EN_PREPARACION' || p.estado === 'LISTO')
    )

    if (activePedidos.length === 0) {
      return 'FREE' // disponible
    }

    const hasPending = activePedidos.some(p => p.estado === 'PENDIENTE')
    const hasReady = activePedidos.some(p => p.estado === 'LISTO')

    if (hasReady) {
      return 'WAITING_PAYMENT' // Ready to be served/paid
    }

    if (hasPending) {
      return 'WAITING_ORDER' // Order placed but not ready
    }

    return 'OCCUPIED'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'FREE':
        return '#10b981' // green
      case 'OCCUPIED':
        return '#ef4444' // red
      case 'WAITING_ORDER':
        return '#f59e0b' // amber
      case 'WAITING_PAYMENT':
        return '#8b5cf6' // purple
      case 'LONG_SITTING':
        return '#dc2626' // dark red
      default:
        return '#6b7280' // gray
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Apply transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(scale, scale)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1 / scale
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    // Filter mesas by selected zone
    const zoneMesas = mesas.filter(m => (m.zona || 'INSIDE') === selectedZone)

    // Draw tables
    zoneMesas.forEach(mesa => {
      const status = getMesaStatus(mesa)
      const color = getStatusColor(status)
      const x = mesa.positionX || 100
      const y = mesa.positionY || 100

      // Draw table circle
      ctx.beginPath()
      ctx.arc(x, y, TABLE_RADIUS, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Highlight if selected
      if (selectedMesas.includes(mesa.id)) {
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 4 / scale
        ctx.stroke()
      } else {
        ctx.strokeStyle = '#1f2937'
        ctx.lineWidth = 2 / scale
        ctx.stroke()
      }

      // Draw group indicator if joined
      if (mesa.groupId) {
        ctx.fillStyle = '#3b82f6'
        ctx.beginPath()
        ctx.arc(x + TABLE_RADIUS - 10, y - TABLE_RADIUS + 10, 6, 0, 2 * Math.PI)
        ctx.fill()
      }

      // Draw table code
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${14 / scale}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(mesa.codigo, x, y)
    })

    ctx.restore()
  }

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / scale
    const y = (e.clientY - rect.top - panOffset.y) / scale
    return { x, y }
  }

  const findMesaAtPosition = (x, y) => {
    const zoneMesas = mesas.filter(m => (m.zona || 'INSIDE') === selectedZone)
    return zoneMesas.find(mesa => {
      const mx = mesa.positionX || 100
      const my = mesa.positionY || 100
      const distance = Math.sqrt((x - mx) ** 2 + (y - my) ** 2)
      return distance <= TABLE_RADIUS
    })
  }

  const handleCanvasMouseDown = (e) => {
    const { x, y } = getCanvasCoordinates(e)
    const mesa = findMesaAtPosition(x, y)

    if (e.shiftKey && mesa) {
      // Shift+click for multi-select
      if (selectedMesas.includes(mesa.id)) {
        setSelectedMesas(selectedMesas.filter(id => id !== mesa.id))
      } else {
        setSelectedMesas([...selectedMesas, mesa.id])
      }
    } else if (mesa) {
      // Start dragging
      setDraggedMesa(mesa)
      setDragOffset({
        x: x - (mesa.positionX || 100),
        y: y - (mesa.positionY || 100)
      })
      setSelectedMesas([mesa.id])
    } else {
      // Start panning
      setIsPanning(true)
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      setSelectedMesas([])
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (draggedMesa) {
      const { x, y } = getCanvasCoordinates(e)
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      setMesas(mesas.map(m =>
        m.id === draggedMesa.id
          ? { ...m, positionX: newX, positionY: newY }
          : m
      ))
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handleCanvasMouseUp = async () => {
    if (draggedMesa) {
      // Save position to backend
      try {
        await fetch(`/api/mesas/${draggedMesa.id}/position`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': getAuthHeader()
          },
          body: JSON.stringify({
            positionX: draggedMesa.positionX,
            positionY: draggedMesa.positionY,
            zona: selectedZone
          })
        })
      } catch (err) {
        console.error('Error saving position:', err)
      }
      setDraggedMesa(null)
    }
    setIsPanning(false)
  }

  const handleJoinTables = async () => {
    if (selectedMesas.length < 2) {
      alert('Select at least 2 tables to join (use Shift+Click)')
      return
    }

    try {
      const response = await fetch('/api/mesas/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({ mesaIds: selectedMesas })
      })

      if (response.ok) {
        fetchData()
        setSelectedMesas([])
      }
    } catch (err) {
      setError('Error joining tables: ' + err.message)
    }
  }

  const handleSplitTable = async () => {
    if (selectedMesas.length !== 1) {
      alert('Select exactly one table to split')
      return
    }

    try {
      const response = await fetch(`/api/mesas/${selectedMesas[0]}/split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        }
      })

      if (response.ok) {
        fetchData()
        setSelectedMesas([])
      }
    } catch (err) {
      setError('Error splitting table: ' + err.message)
    }
  }

  const handleOpenOrder = () => {
    if (selectedMesas.length !== 1) {
      alert('Select exactly one table to open order')
      return
    }
    navigate('/pedidos')
  }

  const handleZoomPreset = (preset) => {
    switch (preset) {
      case 'BAR':
        setSelectedZone('BAR')
        setScale(1.2)
        setPanOffset({ x: 0, y: 0 })
        break
      case 'TERRACE':
        setSelectedZone('TERRACE')
        setScale(1.2)
        setPanOffset({ x: 0, y: 0 })
        break
      case 'RESET':
        setScale(1)
        setPanOffset({ x: 0, y: 0 })
        break
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="centered-container">
        <div className="card">
          <h2>Floorplan</h2>
          <p>You must log in to view this page</p>
          <Link to="/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Interactive Floorplan</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Controls */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Zone Selection */}
          <div>
            <label htmlFor="zone-select" style={{ marginRight: '10px' }}>Zone:</label>
            <select
              id="zone-select"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{ padding: '8px' }}
            >
              <option value="INSIDE">Inside</option>
              <option value="TERRACE">Terrace</option>
              <option value="BAR">Bar</option>
            </select>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="btn-secondary btn-small">
              Zoom In
            </button>
            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="btn-secondary btn-small">
              Zoom Out
            </button>
            <button onClick={() => handleZoomPreset('RESET')} className="btn-secondary btn-small">
              Reset View
            </button>
          </div>

          {/* Quick Zoom Presets */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => handleZoomPreset('BAR')} className="btn-secondary btn-small">
              Zoom to Bar
            </button>
            <button onClick={() => handleZoomPreset('TERRACE')} className="btn-secondary btn-small">
              Zoom to Terrace
            </button>
          </div>

          {/* Table Actions */}
          <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
            <button onClick={handleJoinTables} className="btn-primary btn-small" disabled={selectedMesas.length < 2}>
              Join Tables ({selectedMesas.length})
            </button>
            <button onClick={handleSplitTable} className="btn-secondary btn-small" disabled={selectedMesas.length !== 1}>
              Split Table
            </button>
            <button onClick={handleOpenOrder} className="btn-success btn-small" disabled={selectedMesas.length !== 1}>
              Open Order
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <strong>Status Legend:</strong>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
            <span>Free</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
            <span>Waiting Order</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
            <span>Occupied</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
            <span>Waiting Payment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #3b82f6', backgroundColor: '#fff' }}></div>
            <span>Joined Tables (blue dot)</span>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', color: '#6b7280' }}>
          <strong>Tip:</strong> Click and drag to move tables. Shift+Click to select multiple tables. Click empty space and drag to pan.
        </p>
      </div>

      {/* Canvas */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading floorplan...</div>
        ) : (
          <div style={{ overflow: 'hidden', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              style={{ cursor: draggedMesa ? 'grabbing' : isPanning ? 'grabbing' : 'grab', display: 'block' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FloorplanPage
