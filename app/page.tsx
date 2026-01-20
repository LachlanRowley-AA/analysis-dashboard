'use client';

import { useState } from 'react';
import { Container, Group, Title, Button, Tabs, Loader } from '@mantine/core';
import { MonthComparisonTab } from '../components/Dashboard/MonthComparisonTab';
import { CategoryComparisonTab } from '../components/Dashboard/CategoryComparisonTab';
import { TotalTab } from '../components/Dashboard/TotalComparisonTab';
import { useAnalytics } from "@/components/DataStorageContext";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>('monthComparison');
  const { refreshMetaData, ready } = useAnalytics();
  const [buttonClicked, setButtonClicked] = useState(false);

  // if (!ready) {
  //   return (
  //     <Container size="xs" py={80}>
  //       <Loader size="lg" variant="dots" />
  //     </Container>
  //   );
  // }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Analytics Dashboard</Title>
        <Button
          onClick={async () => {
            setButtonClicked(true);
            console.log((await fetch('/api/GetMetaMonthDailyData?startDateParam=2025-12-01&endDateParam=2026-01-20')).body);
            await refreshMetaData();
          }}
          loading={buttonClicked && !ready}
        >
          Load Data
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