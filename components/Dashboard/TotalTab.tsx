import { Stack, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';

export const TotalTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const { allData } = useMetaData();

  if (!allData) return <p>No data available</p>;

  // Filter out organic as it is not Meta based
  let data = allData.filter(item => item.adsetName !== 'Organic');

  let adsetNames = Array.from(
    new Set(data.map(item => item.adsetName || ''))
  );

  adsetNames.unshift('All');

  let filter =
    selectedAdset && selectedAdset !== 'All'
      ? data.filter(item => item.adsetName === selectedAdset)
      : data;

  const merged = mergeAdsetData(
    filter,
    'Total'
  );

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c="white">
          Total
        </Title>

        <Select
          data={adsetNames.map(name => ({
            value: name,
            label: name,
          }))}
          value={selectedAdset}
          onChange={setSelectedAdset}
          py="md"
          styles={{
            input: {
              color: 'white',
              backgroundColor: '#080b0e',
              borderColor: '#6FC3DF',
            },
          }}
        />

        <MetricsGrid
          data={merged}
          dataArr={filter}
        />
      </div>
    </Stack>
  );
};