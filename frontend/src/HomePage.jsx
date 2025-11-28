import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(response => response.json())
      .then(data => setHealthStatus(data.status))
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!healthStatus) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Sailor is running</h1>
      <p>Health status: {healthStatus}</p>
      <nav>
        <Link to="/mesas">Mesas</Link>
      </nav>
    </div>
  )
}

export default HomePage
