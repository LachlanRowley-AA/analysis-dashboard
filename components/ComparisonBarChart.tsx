import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ComparisonBarChartProps {
  data: Array<{ [key: string]: string | number }>;
  dataKey1: string;
  dataKey2: string;
  xAxisKey: string;
  label1: string;
  label2: string;
  color1: string;
  color2: string;
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({ 
  data, 
  dataKey1,
  dataKey2,
  xAxisKey, 
  label1,
  label2,
  color1,
  color2
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey1} fill={color1} name={label1} />
        <Bar dataKey={dataKey2} fill={color2} name={label2} />
      </BarChart>
    </ResponsiveContainer>
  );
};