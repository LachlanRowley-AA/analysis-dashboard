'use client';

import { useState } from 'react';
import { Container, Group, Title, Button, Tabs, Loader, Text, Stack, Center, Popover } from '@mantine/core';
import { MonthComparisonTab } from '../components/Dashboard/MonthComparisonTab';
import { CategoryComparisonTab } from '../components/Dashboard/CategoryComparisonTab';
import { TotalTab } from '../components/Dashboard/TotalComparisonTab';
import { useAnalytics } from "@/components/DataStorageContext";
import { GHLTab } from '@/components/Dashboard/GHLTab';
import { ProjectionTab } from '@/components/Dashboard/ProjectionTab';
import { useDisclosure } from '@mantine/hooks';
import { OrganicTab } from '../components/Dashboard/OrganicTab'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>('monthComparison');
  const { refreshMetaData, ready, cachedDate, updateMetaData } = useAnalytics();
  const [buttonClicked, setButtonClicked] = useState(false);
  const [opened, { close, open }] = useDisclosure(false);
  let text = ""
  if (cachedDate) {
    const date = new Date(cachedDate);
    text = date.toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  }

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
          <Popover opened={opened}>
            <Popover.Target>
              <Button
                onClick={async () => {
                  // setButtonClicked(true);
                  // console.log((await fetch('/api/GetMetaMonthDailyData?startDateParam=2025-12-01&endDateParam=2026-01-20')).body);
                  // await refreshMetaData(true);
                  await updateMetaData();
                  // await fetch('/api/UpdateCache')
                }}
                onMouseEnter={open}
                onMouseLeave={close}
                loading={buttonClicked && !ready}
              >
                Update Data (?)
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Text fz='sm'>Updates for today may not show up until 11am</Text>
            </Popover.Dropdown>
          </Popover>
          <Text>Last updated {text}</Text>
        </Stack>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="xl">
          <Tabs.Tab value="monthComparison">This Month vs Last Month</Tabs.Tab>
          <Tabs.Tab value="categoryComparison">ATO vs Machinery</Tabs.Tab>
          <Tabs.Tab value="total">Total</Tabs.Tab>
          <Tabs.Tab value="organic">Organic</Tabs.Tab>
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

        <Tabs.Panel value="organic">
          {<OrganicTab/>}
        </Tabs.Panel>

      </Tabs>
    </Container>
  );
}