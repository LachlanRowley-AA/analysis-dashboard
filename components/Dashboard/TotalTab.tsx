import { Stack, Title, Select } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useState } from 'react';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { mergeAdsetData } from '@/utils/calculateUtils';
import { StatCard } from '../StatCard';
import QualityCard from '../QualityCard';
import { GHLData } from '@/app/lib/types';
import { numberFormatter } from '@/utils/formatter';
// import { LTVCost } from '../LTVCtAC';
import { LTVGrid } from '../LTV';


function getAverage(data: GHLData[]): number {
  const totalPerCustomer = data.reduce<Record<string, number>>((customer, { name, value}) => {
    if(value > 0) {
      customer[name] = (customer[name] ?? 0) + value      
    }
    return customer;
  }, {});
  console.log("totals are: ", totalPerCustomer);

  const totals = Object.values(totalPerCustomer)
    console.log('Length is ', totals.length)
  return (totals.reduce((sum, v) => sum + v, 0) / totals.length);
}

export const TotalTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const { allData, ghlData } = useMetaData();

  console.log('GHL Data in TotalTab:', ghlData);

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

  const avgAmount = getAverage(ghlData?.filter(item => item.adset !== 'Organic') ?? []);

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md" c="white">
          Total
        </Title>
        <Title order={4} mb="md" c="white">
          Excluding Organic
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
          extraCards={[
            {
              key: 'quality',
              node: (<QualityCard/>)
            },
            {
              key: 'average',
              node: (<StatCard
                value={`$${numberFormatter.format(avgAmount)}`}
                icon=''
                title='Average Revenue per Customer'
                color=''/>)
            },
            {
              key: 'ltv',
              node: (<LTVGrid data={filter}/>)  
            }
          ]}
        />
      </div>
    </Stack>
  );
};