import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BarChartComponentProps {
  data: Array<{ [key: string]: string | number }>;
  dataKey: string;
  xAxisKey: string;
  color: string;
  label?: string;
}
