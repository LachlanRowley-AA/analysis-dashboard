import { Stack, Grid, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useAnalytics } from '../DataStorageContext';
import { mergeAdsetData } from '../../lib/utils/calculateUtils';


export const OrganicTab = () => {
  const data = useAnalytics().metaData;
  const workingData = data.filter(item => item.adsetName === 'Organic');
  const merge = mergeAdsetData(workingData, 'Organic');
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c='white'>Organic Data</Title>
        <MetricsGrid data={merge} />
      </div>
    </Stack>
  );
};