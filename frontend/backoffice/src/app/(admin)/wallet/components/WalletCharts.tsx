import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col, Row } from 'react-bootstrap'
import type { WalletData, WalletStats } from '@/services/walletService'

/** Flux de trésorerie mensuel (barres) + répartition des dépenses (donut). */
const WalletCharts = ({ data, stats }: { data: WalletData; stats: WalletStats }) => {
  const cashflowOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false },
    plotOptions: { bar: { columnWidth: '45%', borderRadius: 4 } },
    colors: ['#0acf97', '#fa5c7c'],
    dataLabels: { enabled: false },
    xaxis: { categories: data.monthly.map(m => m.mois), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v: number) => (v / 1000).toFixed(0) + 'k' } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#f1f3fa' },
    tooltip: { theme: 'light', y: { formatter: (v: number) => v.toLocaleString('fr-FR') + ' TND' } },
  }
  const cashflowSeries = [
    { name: 'Entrées', data: data.monthly.map(m => m.entrees) },
    { name: 'Sorties', data: data.monthly.map(m => m.sorties) },
  ]

  const catOptions: any = {
    chart: { type: 'donut' },
    labels: stats.byCategory.map(c => c.category),
    colors: ['#ffbc00', '#39afd1', '#727cf5', '#6c757d', '#313a46'],
    legend: { position: 'bottom', fontSize: '12px', markers: { radius: 12 } },
    plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Dépenses', formatter: () => stats.totalOut.toLocaleString('fr-FR') + ' TND', fontSize: '13px' } } } } },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ['#fff'] },
    tooltip: { theme: 'light', y: { formatter: (v: number) => v.toLocaleString('fr-FR') + ' TND' } },
  }
  const catSeries = stats.byCategory.map(c => c.total)

  return (
    <Row className="g-3">
      <Col lg={8}>
        <Card className="border-0 shadow-sm h-100">
          <CardHeader className="bg-transparent border-0 py-3">
            <h5 className="mb-0 fw-bold text-dark">Flux de trésorerie</h5>
            <p className="text-muted fs-12 mb-0">Entrées et sorties par mois</p>
          </CardHeader>
          <CardBody>
            <ReactApexChart options={cashflowOptions} series={cashflowSeries} type="bar" height={300} />
          </CardBody>
        </Card>
      </Col>
      <Col lg={4}>
        <Card className="border-0 shadow-sm h-100">
          <CardHeader className="bg-transparent border-0 py-3">
            <h5 className="mb-0 fw-bold text-dark">Dépenses par catégorie</h5>
            <p className="text-muted fs-12 mb-0">Répartition des sorties</p>
          </CardHeader>
          <CardBody>
            {catSeries.length ? (
              <ReactApexChart options={catOptions} series={catSeries} type="donut" height={300} />
            ) : <p className="text-muted text-center py-5">Aucune dépense</p>}
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default WalletCharts
