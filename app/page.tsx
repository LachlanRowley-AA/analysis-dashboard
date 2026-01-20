'use client';

import { useState } from 'react';
import { Container, Group, Title, Button, Tabs, Loader } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { ComparisonData } from '../types/analytics';
import { ConfigurationCard } from '../components/ConfigurationCard';
import { MonthComparisonTab } from '../components/Dashboard/MonthComparisonTab';
import { CategoryComparisonTab } from '../components/Dashboard/CategoryComparisonTab';
import { TotalTab } from '../components/Dashboard/TotalComparisonTab';
import Test from '../components/Test';
import { RunRateChart } from '../components/RunRateChart';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>('monthComparison');
  const [fbToken, setFbToken] = useState<string>('');
  const [ghlToken, setGhlToken] = useState<string>('');
  const [configured, setConfigured] = useState<boolean>(false);
  const [selectedAdset, setSelectedAdset] = useState<ComparisonData | null>(null);


  const handleConfigure = (): void => {
    if (fbToken && ghlToken) {
      setConfigured(true);
    }
  };

  // if (!configured) {
  //   return (
  //     <Container size="xs" py={80}>
  //       <ConfigurationCard
  //         fbToken={fbToken}
  //         ghlToken={ghlToken}
  //         onFbTokenChange={setFbToken}
  //         onGhlTokenChange={setGhlToken}
  //         onSubmit={handleConfigure}
  //       />
  //     </Container>
  //   );
  // }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Analytics Dashboard</Title>
        <Button
          onClick={async () => {
            console.log(await fetch('/api/GetMetaMonthDailyData?startDateParam=2025-12-01&endDateParam=2026-01-20'));
          }}
        >
          Refresh
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="monthComparison">This Month vs Last Month</Tabs.Tab>
          <Tabs.Tab value="categoryComparison">ATO vs Machinery</Tabs.Tab>
          <Tabs.Tab value="total">Total</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="monthComparison">
          {(
            <MonthComparisonTab
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="categoryComparison">
          {<CategoryComparisonTab />}
        </Tabs.Panel>

        <Tabs.Panel value="total">
          {<TotalTab />}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}