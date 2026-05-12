import { Stack, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';
import { OrganicMetricsGrid } from '../OrganicMetricsGrid';

export const TotalOrganicTab = () => {
  const { allData } = useMetaData();

  if (!allData) return <p>No data available</p>;

  // Filter out organic as it is not Meta based
  let data = allData.filter(item => item.adsetName == 'Organic');

  let adsetNames = Array.from(
    new Set(data.map(item => item.adsetName || ''))
  );

  adsetNames.unshift('All');

  const merged = mergeAdsetData(
    data,
    'Total'
  );

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c="white">
          Total Organic
        </Title>
        <OrganicMetricsGrid data={merged} dataArr={data}/>
      </div>
    </Stack>
  );
};