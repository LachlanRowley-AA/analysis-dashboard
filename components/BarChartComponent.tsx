import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BarChartComponentProps {
  data: Array<{ [key: string]: string | number }>;
  dataKey: string;
  xAxisKey: string;
  color: string;
  label?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  dataKey, 
  xAxisKey, 
  color,
  label 
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill={color} name={label || dataKey} />
      </BarChart>
    </ResponsiveContainer>
  );
};