import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TimeSeriesData } from '../types/analytics';

interface PerformanceChartProps {
  data: TimeSeriesData[];
  metrics: Array<{ key: keyof TimeSeriesData; color: string; label: string }>;
}



export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, metrics }) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {metrics.map((metric) => (
          <Line
            key={metric.key}
            type="monotone"
            dataKey={metric.key}
            stroke={metric.color}
            strokeWidth={2}
            name={metric.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};
