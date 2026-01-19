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
import { LTVGrid } from '../LTV';
import { metaAdsetGrouping } from '@/lib/constants/analytics';

export const CategoryComparisonTab = () => {
  const data = useAnalytics();
  let adsetNames = Array.from(new Set(data.metaData.map(item => item.adsetName)));
  adsetNames.unshift("All");

  let copy = [...data.metaData];
  let atoData :MetaAdsetData[] = [];
  let machineryData :MetaAdsetData[] = [];
  copy.forEach(item => {
    const category = metaAdsetGrouping[item.adsetName];
    if (category === "ATO") {
      atoData.push(item);
    } else if (category === "Machinery") {
      machineryData.push(item);
    }
  });

  let previousMonth = new Date().getMonth() - 1;
  if (previousMonth < 0) {
    previousMonth = 11;
  }
  const ATOPreviousMonthData = atoData.filter(item => item.date.getMonth() === previousMonth);
  const machineryPreviousMonthData = machineryData.filter(item => item.date.getMonth() === previousMonth);
  const ATOLastMonthData = mergeAdsetData(ATOPreviousMonthData, 'Last Month');
  const machineryLastMonthData = mergeAdsetData(machineryPreviousMonthData, 'Last Month');

  const ATOCurrentMonthData = atoData.filter(item => item.date.getMonth() === new Date().getMonth());
  const machineryCurrentMonthData = machineryData.filter(item => item.date.getMonth() === new Date().getMonth());
  const ATOMonthData = mergeAdsetData(ATOCurrentMonthData, 'Current Month');
  const machineryMonthData = mergeAdsetData(machineryCurrentMonthData, 'Current Month');

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md">ATO</Title>
        <MetricsGrid data={ATOMonthData} comparison={ATOLastMonthData} />
        <LTVGrid data={ATOCurrentMonthData} comparison={ATOPreviousMonthData} showComparison={true} />
        <Title order={2} mb="md">Machinery</Title>
        <MetricsGrid data={machineryMonthData} comparison={machineryLastMonthData} />
        <LTVGrid data={machineryCurrentMonthData} comparison={machineryPreviousMonthData} showComparison={true} />
      </div>
    </Stack>
  );
};