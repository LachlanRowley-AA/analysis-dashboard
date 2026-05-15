'use client';
import { useMetaData } from "@/app/context/MetaContextProvider";
import { useState } from 'react';
import { Container, Group, Title, Button, Tabs, Loader, Text, Stack, Center, Popover } from '@mantine/core';
import { MonthComparisonTab } from '../components/Dashboard/MonthComparisonTab';
import { useDisclosure } from '@mantine/hooks';
import { OrganicTab } from "@/components/Dashboard/OrganicTab";
import { PriorMonthComparisonTab } from "@/components/Dashboard/PriorMonthComparisonTab";
import { PriorOrganicTab } from "@/components/Dashboard/PriorOrganicTab";
import { TotalTab } from "@/components/Dashboard/TotalTab";
import { clearAllCache } from "./lib/cache/redisActions";
import { TotalOrganicTab } from "@/components/Dashboard/TotalOrganicTab";
import { QuarterComparisonTab } from "@/components/Dashboard/QuarterComparisonTab";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string | null>('monthComparison');

  const { loading, error, refetch, statusMessage } = useMetaData();

  if (error)   return <p>Error: {error}</p>;

    let text = ""
  // if (cachedDate) {
  //   const date = new Date(cachedDate);
  //   text = date.toLocaleString("en-AU", { timeZone: "Australia/Sydney" })
  // }


  if (loading) {
    return (
      <Container size="xl" h='100vh'>
        <Center h='100%'>
          <Group>
            <Loader size="lg" variant="dots" />
            <Text c='white'>{statusMessage ?? "Loading Data"}</Text>
          </Group>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1} c='white'>Analytics Dashboard</Title>
        <Stack>
            <Button
              onClick={async () => {
                await clearAllCache();
                await refetch();
              }}
            >
              Clear Data
            </Button>

          {/* <Popover opened={opened}>
            <Popover.Target>
            </Popover.Target>
            <Popover.Dropdown>
              <Text fz='sm'>Updates for today may not show up until 11am</Text>
            </Popover.Dropdown>
          </Popover> */}
        </Stack>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} c='#cf0072'>
        <Tabs.List mb="xl" c='#01E194'>
          <Tabs.Tab value="monthComparison">This Month vs Last</Tabs.Tab>
          <Tabs.Tab value="quarterComparison">This Quarter vs Last</Tabs.Tab>
          {/* <Tabs.Tab value="priorMonthComparison">Last Quarter vs Prior</Tabs.Tab> */}
          {/* <Tabs.Tab value="categoryComparison">ATO vs Machinery</Tabs.Tab> */}
          <Tabs.Tab value="total">Total</Tabs.Tab>
          <Tabs.Tab value="organic">Organic</Tabs.Tab>
          <Tabs.Tab value="totalOrganic">Total Organic</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="monthComparison">
          {(
            <MonthComparisonTab
            />
          )}
        </Tabs.Panel>
        <Tabs.Panel value="quarterComparison">
          {<QuarterComparisonTab/>}
        </Tabs.Panel>
        <Tabs.Panel value="priorMonthComparison">
          {<PriorMonthComparisonTab />}
        </Tabs.Panel>
        <Tabs.Panel value="priorOrganic">
          {<PriorOrganicTab />}
        </Tabs.Panel>
        <Tabs.Panel value="total">
          {<TotalTab />}
        </Tabs.Panel>
        <Tabs.Panel value="totalOrganic">
          {<TotalOrganicTab />}
        </Tabs.Panel>

        {/* <Tabs.Panel value="categoryComparison">
          {<CategoryComparisonTab />}
        </Tabs.Panel>


        <Tabs.Panel value="ghl">
          {<GHLTab />}
        </Tabs.Panel>

        <Tabs.Panel value="projection">
          {<ProjectionTab />}
        </Tabs.Panel>
*/
        <Tabs.Panel value="organic">
          {<OrganicTab/>}
        </Tabs.Panel> }
      </Tabs>
    </Container>
  );
}