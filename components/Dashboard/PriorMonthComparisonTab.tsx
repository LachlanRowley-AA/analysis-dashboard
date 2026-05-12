import { Stack, Grid, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';
  
export const PriorMonthComparisonTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const { data: rawData, loading } = useMetaData();
  const date = new Date();
  const month = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
  const previousMonth = month === 0 ? 10 : month - 1;

  if(!rawData) return <p>No data available</p>;
  let data = rawData.filter(item => item.adsetName !== "Organic");
  let adsetNames = Array.from(new Set(data.map(item => item.adsetName || "")));
  adsetNames.unshift("All");

  let filter = selectedAdset && selectedAdset !== 'All'
    ? data.filter(item => item.adsetName === selectedAdset)
    : data;

  const previousMonthData = filter.filter(item => (item.date.getMonth()) === previousMonth);
  const currentMonthData = filter.filter(item => (item.date.getMonth()) === month);

  const previousMonthMerged = mergeAdsetData(previousMonthData, "Previous Month");
  const currentMonthMerged = mergeAdsetData(currentMonthData, "Current Month")
  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c='white'>This Month</Title>
        <Select
          data={adsetNames.map(name => ({ value: name, label: name }))}
          value={selectedAdset}
          onChange={setSelectedAdset}
          py='md'
          styles={{
            input: {
              color: 'white',
              backgroundColor: '#080b0e',
              borderColor: '#6FC3DF'
            },
          }}
        />
        <MetricsGrid
          data={currentMonthMerged}
          comparison={previousMonthMerged}
          dataArr={currentMonthData}
          comparisonArr={previousMonthData}
        />
      </div>
    </Stack>
  );
};