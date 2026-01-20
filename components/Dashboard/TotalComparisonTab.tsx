import { Stack, Grid, Title, Select } from '@mantine/core';
import { ComparisonData } from '../../types/analytics';
import { MetricsGrid } from '../MetricsGrid';
import { ChartCard } from '../ChartCard';
import { PerformanceChart } from '../PerformanceChart';
import { ComparisonBarChart } from '../ComparisonBarChart';
import { useAnalytics } from '../DataStorageContext';
import { useState } from 'react';
import { MetaAdsetData } from '../../types/analytics';
import { mergeAdsetData } from '@/lib/utils/calculateUtils';


export const TotalTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const {fullData} = useAnalytics();
  let adsetNames = Array.from(new Set(fullData.map(item => item.adsetName)));
  adsetNames.unshift("All");
  const merge = mergeAdsetData(fullData, 'Total');
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md">All Data</Title>
        <MetricsGrid data={merge} />
      </div>
    </Stack>
  );
};