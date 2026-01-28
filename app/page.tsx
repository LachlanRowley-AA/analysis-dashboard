'use client';

import { useState } from 'react';
import { Container, Group, Title, Button, Tabs, Loader, Text, Stack, Center } from '@mantine/core';
import { MonthComparisonTab } from '../components/Dashboard/MonthComparisonTab';
import { CategoryComparisonTab } from '../components/Dashboard/CategoryComparisonTab';
import { TotalTab } from '../components/Dashboard/TotalComparisonTab';
import { useAnalytics } from "@/components/DataStorageContext";
import { GHLTab } from '@/components/Dashboard/GHLTab';
import { ProjectionTab } from '@/components/Dashboard/ProjectionTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>('monthComparison');
  const { refreshMetaData, ready, cachedDate } = useAnalytics();
  const [buttonClicked, setButtonClicked] = useState(false);
  const text = cachedDate ? cachedDate.split('T')[0] : "";

  if (!ready) {
    return (
      <Container size="xl" h='100vh'>
        <Center h='100%'>
          <Group>
            <Loader size="lg" variant="dots" />
            <Text>Loading Data</Text>
          </Group>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Analytics Dashboard</Title>
        <Stack>
          <Button
            onClick={async () => {
              // setButtonClicked(true);
              // console.log((await fetch('/api/GetMetaMonthDailyData?startDateParam=2025-12-01&endDateParam=2026-01-20')).body);
              await refreshMetaData(true);
              // await fetch('/api/UpdateCache')
            }}
            loading={buttonClicked && !ready}
          >
            Load Data
          </Button>
          <Text>Last updated {text}</Text>

        </Stack>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="monthComparison">This Month vs Last Month</Tabs.Tab>
          <Tabs.Tab value="categoryComparison">ATO vs Machinery</Tabs.Tab>
          <Tabs.Tab value="total">Total</Tabs.Tab>
          <Tabs.Tab value="ghl">GHL Data</Tabs.Tab>
          <Tabs.Tab value="projection">Project</Tabs.Tab>
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

        <Tabs.Panel value="ghl">
          {<GHLTab />}
        </Tabs.Panel>

        <Tabs.Panel value="projection">
          {<ProjectionTab />}
        </Tabs.Panel>

      </Tabs>
    </Container>
  );
}