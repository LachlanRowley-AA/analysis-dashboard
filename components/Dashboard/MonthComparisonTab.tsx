import { Stack, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';

export const MonthComparisonTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const { monthlyData: rawData } = useMetaData();

  const now = new Date();
  const currentMonth = now.getMonth();
  const priorMonth = currentMonth == 1 ? 12 : currentMonth - 1 //Handle January wrap

  if (!rawData) return <p>No data available</p>;

  // Filter out organic as it is not Meta based
  let data = rawData.filter(item => item.adsetName !== 'Organic');

  let adsetNames = Array.from(
    new Set(data.map(item => item.adsetName || ''))
  );

  adsetNames.unshift('All');

  let filter =
    selectedAdset && selectedAdset !== 'All'
      ? data.filter(item => item.adsetName === selectedAdset)
      : data;


  const currentQuarterData = filter.filter(item =>
    item.date.getMonth() == currentMonth
  );

  const previousQuarterData = filter.filter(item =>
    item.date.getMonth() == priorMonth
  );

  const currentQuarterMerged = mergeAdsetData(
    currentQuarterData,
    'Current Quarter'
  );

  const previousQuarterMerged = mergeAdsetData(
    previousQuarterData,
    'Previous Quarter'
  );

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c="white">
          This Month vs Last
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
          data={currentQuarterMerged}
          comparison={previousQuarterMerged}
          dataArr={currentQuarterData}
          comparisonArr={previousQuarterData}
        />
      </div>
    </Stack>
  );
};