import { Card } from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartWidgetProps {
  titre: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'radialBar';
  series: any[];
  options?: ApexOptions;
  height?: number;
}

export default function ChartWidget({
  titre,
  type,
  series,
  options = {},
  height = 350,
}: ChartWidgetProps) {
  const defaultOptions: ApexOptions = {
    chart: {
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: '#f1f1f1'
    },
    xaxis: {
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    }
  };

  const mergeOptions = { ...defaultOptions, ...options };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-transparent border-0 py-3">
        <h5 className="card-title mb-0">{titre}</h5>
      </Card.Header>
      <Card.Body>
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
