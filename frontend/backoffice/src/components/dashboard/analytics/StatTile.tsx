import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'

/**
 * Tuile de synthèse compacte : valeur + tendance + sparkline (style « sparklines »
 * des pages /charts — chart.sparkline.enabled). Utilisée en tête de la page Analyses.
 */

interface StatTileProps {
  label: string
  value: string
  icon: string
  color: string          // couleur hex du sparkline
  serie: number[]        // 6 derniers mois
  suffix?: string        // ex. "vs mois dernier"
}

export default function StatTile({ label, value, icon, color, serie, suffix }: StatTileProps) {
  const prev = serie.length > 1 ? serie[serie.length - 2] : 0
  const curr = serie.length ? serie[serie.length - 1] : 0
  const delta = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null

  const options: ApexOptions = {
    chart: { type: 'area', sparkline: { enabled: true } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    colors: [color],
    tooltip: { enabled: false },
  }

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="pb-2">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted text-uppercase fw-bold fs-12 mb-1">{label}</p>
            <h3 className="fw-bold mb-0">{value}</h3>
            <p className="text-muted fs-12 mb-0 mt-1">
              {delta !== null && (
                <span className={`fw-bold me-1 ${delta >= 0 ? 'text-success' : 'text-danger'}`}>
                  <i className={`ri-arrow-${delta >= 0 ? 'up' : 'down'}-line`} />
                  {Math.abs(delta).toFixed(0)}%
                </span>
              )}
              {suffix ?? 'vs mois précédent'}
            </p>
          </div>
          <span className="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center fs-20">
            <i className={icon} style={{ color }} />
          </span>
        </div>
        <ReactApexChart options={options} series={[{ name: label, data: serie }]} type="area" height={52} />
      </Card.Body>
    </Card>
  )
}
