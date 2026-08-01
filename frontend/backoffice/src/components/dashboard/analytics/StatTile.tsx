import { Card } from 'react-bootstrap'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'

/**
 * Tuile de synthèse : valeur + tendance + sparkline.
 * Design mis à jour : accent coloré à gauche, pastille d'icône teintée,
 * puce de tendance colorée, effet de survol (voir .kpi-tile dans PRINT_CSS).
 */

interface StatTileProps {
  label: string
  value: string
  icon: string
  color: string          // couleur hex (accent + sparkline)
  serie: number[]        // 6 derniers mois
  suffix?: string
}

/** Convertit un hex en rgba (fond teinté de la pastille d'icône). */
const tint = (hex: string, a: number) => {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
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
    <Card className="border-0 shadow-sm h-100 kpi-tile overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
      <Card.Body className="pb-2">
        <div className="d-flex justify-content-between align-items-start">
          <div className="me-2">
            <p className="text-muted text-uppercase fw-bold fs-12 mb-1">{label}</p>
            <h3 className="fw-bold mb-1">{value}</h3>
            <p className="fs-12 mb-0 d-flex align-items-center gap-1">
              {delta !== null && (
                <span className="badge rounded-pill d-inline-flex align-items-center"
                  style={{ background: tint(delta >= 0 ? '#0ab39c' : '#f06548', 0.12), color: delta >= 0 ? '#0ab39c' : '#f06548' }}>
                  <i className={`ri-arrow-${delta >= 0 ? 'up' : 'down'}-line`} />
                  {Math.abs(delta).toFixed(0)}%
                </span>
              )}
              <span className="text-muted">{suffix ?? 'vs mois précédent'}</span>
            </p>
          </div>
          <span className="avatar-md rounded d-flex align-items-center justify-content-center fs-22 flex-shrink-0"
            style={{ background: tint(color, 0.12), color }}>
            <i className={icon} />
          </span>
        </div>
        <ReactApexChart options={options} series={[{ name: label, data: serie }]} type="area" height={48} />
      </Card.Body>
    </Card>
  )
}
