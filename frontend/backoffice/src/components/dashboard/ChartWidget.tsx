import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartWidgetProps {
  titre: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'radialBar' | 'heatmap' | 'treemap';
  series: any[];
  options?: ApexOptions;
  height?: number;
  /** Icône optionnelle (remixicon) affichée dans l'en-tête. */
  icon?: string;
}

export default function ChartWidget({
  titre,
  type,
  series,
  options = {},
  height = 350,
  icon,
}: ChartWidgetProps) {
  const defaultOptions: ApexOptions = {
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    grid: { borderColor: '#f1f1f1' },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
  };

  const mergeOptions = { ...defaultOptions, ...options };

  return (
    <Card className="border-0 shadow-sm h-100 chart-card">
      <Card.Header className="bg-transparent border-0 py-3 d-flex align-items-center gap-2">
        {icon && (
          <span className="avatar-xs rounded-circle bg-light text-primary d-flex align-items-center justify-content-center flex-shrink-0">
            <i className={icon} />
          </span>
        )}
        <h5 className="card-title mb-0 fw-semibold">{titre}</h5>
      </Card.Header>
      <Card.Body className="pt-0">
        <ReactApexChart
          options={mergeOptions}
          series={series}
          type={type}
          height={height}
        />
      </Card.Body>
    </Card>
  );
}
