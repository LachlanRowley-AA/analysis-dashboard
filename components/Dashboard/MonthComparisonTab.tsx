import { Stack, Grid, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useAnalytics } from '../DataStorageContext';
import { useState } from 'react';
import { mergeAdsetData } from '@/lib/utils/calculateUtils';

export const MonthComparisonTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const data = useAnalytics();
  let adsetNames = Array.from(new Set(data.metaData.map(item => item.adsetName || "")));
  adsetNames.unshift("All");


  let filter = selectedAdset && selectedAdset != 'All' ?
    data.metaData.filter(item => item.adsetName === selectedAdset) : data.metaData;

  let previousMonth = new Date().getMonth() - 1;
  if (previousMonth < 0) {
    previousMonth = 11;
  }
  const previousMonthData = filter.filter(item => item.date.getMonth() === previousMonth);
  const lastMonthData = mergeAdsetData(previousMonthData, 'Last Month');

  const currentMonthData = filter.filter(item => item.date.getMonth() === new Date().getMonth());
  const monthData = mergeAdsetData(currentMonthData, 'Current Month');

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md">This Month</Title>
        <Select
          data={adsetNames.map(name => ({ value: name, label: name })) || ""}
          value={selectedAdset}
          onChange={setSelectedAdset}
          py='md'
        />
        <MetricsGrid data={monthData} comparison={lastMonthData} dataArr={currentMonthData} comparisonArr={previousMonthData} />
        {/* <LTVGrid data={currentMonthData} comparison={previousMonthData} showComparison={true} /> */}
      </div>
    </Stack>
  );
};