import { Stack, Grid, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useAnalytics } from '../DataStorageContext';
import { mergeAdsetData } from '@/lib/utils/calculateUtils';


export const TotalTab = () => {
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