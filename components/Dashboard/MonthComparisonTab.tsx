import { Stack, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';

export const MonthComparisonTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const { data: rawData } = useMetaData();

  const now = new Date();
  const currentMonth = now.getMonth();

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

  /**
   * Rolling quarter logic
   *
   * Example:
   * Jan => Nov, Dec, Jan
   * Feb => Dec, Jan, Feb
   * Mar => Jan, Feb, Mar
   */
  const currentQuarterMonths = [
    (currentMonth - 2 + 12) % 12,
    (currentMonth - 1 + 12) % 12,
    currentMonth,
  ];

  const previousQuarterMonths = currentQuarterMonths.map(
    m => (m - 3 + 12) % 12
  );

  const currentQuarterData = filter.filter(item =>
    currentQuarterMonths.includes(item.date.getMonth())
  );

  const previousQuarterData = filter.filter(item =>
    previousQuarterMonths.includes(item.date.getMonth())
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
          Rolling Quarter
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