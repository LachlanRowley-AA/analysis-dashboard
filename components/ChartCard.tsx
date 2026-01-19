import { Paper, Title } from '@mantine/core';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <Paper shadow="sm" p="lg" radius="md" withBorder>
      <Title order={3} mb="md">
        {title}
      </Title>
      {children}
    </Paper>
  );
};