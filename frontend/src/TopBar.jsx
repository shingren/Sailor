import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

function TopBar() {
  const { isAuthenticated, getAuthHeader } = useAuth()
  const [kpis, setKpis] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchKpis = async () => {
      try {
        const response = await fetch('/api/dashboard/resumen-hoy', {
          headers: { 'Authorization': getAuthHeader() }
        })

        if (response.ok) {
          const data = await response.json()
          setKpis(data)
        }
      } catch (err) {
        console.error('Error fetching KPIs:', err)
      }
    }

    fetchKpis()

    // Refresh KPIs every 60 seconds
    const interval = setInterval(fetchKpis, 60000)

    return () => clearInterval(interval)
  }, [isAuthenticated, getAuthHeader])

  if (!isAuthenticated || !kpis) {
    return null
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  return (
    <div className="top-bar">
      <div className="top-bar-content">
        <div className="kpi-card kpi-success">
          <div className="kpi-label">Ventas de Hoy</div>
          <div className="kpi-value kpi-value-large">{formatCurrency(kpis.todayTotalSales)}</div>
        </div>

        <div className="kpi-card kpi-warning">
          <div className="kpi-label">Mesas Ocupadas</div>
          <div className="kpi-value">{kpis.openTablesCount}</div>
        </div>

        <div className="kpi-card kpi-info">
          <div className="kpi-label">Pedidos Pendientes</div>
          <div className="kpi-value">{kpis.pendingOrdersCount}</div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
