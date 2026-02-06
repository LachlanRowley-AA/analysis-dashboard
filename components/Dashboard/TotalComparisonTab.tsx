import { Stack, Grid, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useAnalytics } from '../DataStorageContext';
import { mergeAdsetData } from '@/lib/utils/calculateUtils';
import { EVGrid } from '../EVGrid';
import { useState } from 'react';


export const TotalTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');

  const { fullData } = useAnalytics();

  const adsetNames = [
    'All',
    ...Array.from(
      new Set(
        fullData
          .map(item => item.adsetName)
          .filter((name): name is string => Boolean(name))
      )
    ),
  ];
  let filter = selectedAdset && selectedAdset != 'All' ?
    fullData.filter(item => item.adsetName === selectedAdset) : fullData;
  if (selectedAdset == 'All') {
    filter = fullData.filter(item => item.adsetName !== 'Organic')
  }
  const merge = mergeAdsetData(filter, 'Total');

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c='white'>All Data</Title>
        <Select
          data={adsetNames.map(name => ({ value: name, label: name }))}
          value={selectedAdset}
          onChange={setSelectedAdset}
          py='md'
          styles={{
            input: {
              color: 'white',
              backgroundColor: 'gray',
              borderColor: 'gray'
            }
          }}

        />
        <MetricsGrid data={merge} />
        <EVGrid data={merge} />
      </div>
    </Stack>
  );
};