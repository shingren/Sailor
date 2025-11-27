import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Link } from 'react-router-dom'

function ReservasPage() {
  const { isAuthenticated, getAuthHeader } = useAuth()

  const [reservas, setReservas] = useState([])
  const [mesas, setMesas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [newReserva, setNewReserva] = useState({
    mesaId: '',
    clienteNombre: '',
    clienteTelefono: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    cantidadPersonas: 1
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [reservasRes, mesasRes] = await Promise.all([
        fetch('http://localhost:8080/reservas', { headers: { 'Authorization': getAuthHeader() } }),
        fetch('http://localhost:8080/mesas', { headers: { 'Authorization': getAuthHeader() } })
      ])

      if (!reservasRes.ok || !mesasRes.ok) {
        setError('Failed to fetch data')
        setLoading(false)
        return
      }

      const [reservasData, mesasData] = await Promise.all([
        reservasRes.json(),
        mesasRes.json()
      ])

      setReservas(reservasData)
      setMesas(mesasData)
    } catch (err) {
      setError('Error fetching data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReserva = async (e) => {
    e.preventDefault()
    setError('')

    if (!newReserva.mesaId) {
      setError('Please select a mesa')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          mesaId: parseInt(newReserva.mesaId),
          clienteNombre: newReserva.clienteNombre,
          clienteTelefono: newReserva.clienteTelefono,
          fecha: newReserva.fecha,
          horaInicio: newReserva.horaInicio,
          horaFin: newReserva.horaFin,
          cantidadPersonas: parseInt(newReserva.cantidadPersonas)
        })
      })

      if (response.status === 400) {
        setError('Mesa ya reservada en ese horario')
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to create reserva: ' + errorText)
        return
      }

      setNewReserva({
        mesaId: '',
        clienteNombre: '',
        clienteTelefono: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        cantidadPersonas: 1
      })
      fetchData()
    } catch (err) {
      setError('Error creating reserva: ' + err.message)
    }
  }

  const handleCancelar = async (id) => {
    setError('')
    try {
      const response = await fetch(`http://localhost:8080/reservas/${id}/cancelar`, {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader()
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError('Failed to cancel reserva: ' + errorText)
        return
      }

      fetchData()
    } catch (err) {
      setError('Error canceling reserva: ' + err.message)
    }
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h2>Reservas</h2>
        <p>You must log in to view this page</p>
        <Link to="/login">Go to Login</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Reservas - Reservations</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <hr />
      <h3>A) CREATE RESERVATION</h3>

      <form onSubmit={handleCreateReserva}>
        <label>
          Mesa:
          <select
            value={newReserva.mesaId}
            onChange={(e) => setNewReserva({ ...newReserva, mesaId: e.target.value })}
            required
          >
            <option value="">-- Select Mesa --</option>
            {mesas.map(mesa => (
              <option key={mesa.id} value={mesa.id}>
                {mesa.codigo} (Capacidad: {mesa.capacidad})
              </option>
            ))}
          </select>
        </label>
        {' '}
        <label>
          Cliente Nombre:
          <input
            type="text"
            value={newReserva.clienteNombre}
            onChange={(e) => setNewReserva({ ...newReserva, clienteNombre: e.target.value })}
            required
          />
        </label>
        {' '}
        <label>
          Teléfono:
          <input
            type="text"
            value={newReserva.clienteTelefono}
            onChange={(e) => setNewReserva({ ...newReserva, clienteTelefono: e.target.value })}
          />
        </label>
        {' '}
        <label>
          Fecha:
          <input
            type="date"
            value={newReserva.fecha}
            onChange={(e) => setNewReserva({ ...newReserva, fecha: e.target.value })}
            required
          />
        </label>
        {' '}
        <label>
          Hora Inicio:
          <input
            type="time"
            value={newReserva.horaInicio}
            onChange={(e) => setNewReserva({ ...newReserva, horaInicio: e.target.value })}
            required
          />
        </label>
        {' '}
        <label>
          Hora Fin:
          <input
            type="time"
            value={newReserva.horaFin}
            onChange={(e) => setNewReserva({ ...newReserva, horaFin: e.target.value })}
            required
          />
        </label>
        {' '}
        <label>
          Personas:
          <input
            type="number"
            min="1"
            value={newReserva.cantidadPersonas}
            onChange={(e) => setNewReserva({ ...newReserva, cantidadPersonas: parseInt(e.target.value) })}
            required
          />
        </label>
        {' '}
        <button type="submit">Create Reservation</button>
      </form>

      <hr />
      <h3>B) LIST RESERVATIONS</h3>

      {loading ? (
        <p>Loading reservas...</p>
      ) : (
        <table border="1" cellPadding="5">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mesa</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Fecha</th>
              <th>Hora Inicio - Fin</th>
              <th>Personas</th>
              <th>Estado</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservas.length === 0 ? (
              <tr>
                <td colSpan="9">No reservas found</td>
              </tr>
            ) : (
              reservas.map(reserva => (
                <tr key={reserva.id}>
                  <td>{reserva.id}</td>
                  <td>{reserva.mesaCodigo}</td>
                  <td>{reserva.clienteNombre}</td>
                  <td>{reserva.clienteTelefono || '-'}</td>
                  <td>{reserva.fecha}</td>
                  <td>{reserva.horaInicio} - {reserva.horaFin}</td>
                  <td>{reserva.cantidadPersonas}</td>
                  <td><strong>{reserva.estado}</strong></td>
                  <td>
                    {reserva.estado === 'RESERVADO' ? (
                      <button onClick={() => handleCancelar(reserva.id)}>Cancelar</button>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ReservasPage
