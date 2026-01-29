import { Stack, Grid, Title, Select, NumberInput, Group, Switch } from '@mantine/core';
import { MetricsGrid } from '../MetricsGrid';
import { useAnalytics } from '../DataStorageContext';
import { useState } from 'react';
import { mergeAdsetData } from '@/lib/utils/calculateUtils';
import { createBlankMetaAdsetData, MetaAdsetData } from '@/types/analytics';

export const ProjectionTab = () => {
  const [selectedAdset, setSelectedAdset] = useState<string | null>('All');
  const [changeInAdSpent, setChangeInAdSpend] = useState<number | string>(0);
  const [performanceDegradation, setPerformanceDegradation] = useState<number | string>(0);
  const [lookingAt, setLookingAt] = useState(true);
  const data = useAnalytics();

  // --- Adset filter setup ---
  let adsetNames = Array.from(new Set(data.metaData.map(item => item.adsetName || "")));
  adsetNames.unshift("All");

  const filter = selectedAdset && selectedAdset !== 'All'
    ? data.metaData.filter(item => item.adsetName === selectedAdset)
    : data.metaData;

  // Previous month for comparison
  let previousMonth = new Date().getMonth() - 1;
  if (previousMonth < 0) previousMonth = 11;

  const previousMonthData = filter
    .filter(item => item.date.getMonth() === previousMonth)
    .sort((a: MetaAdsetData, b: MetaAdsetData) => a.date.getTime() - b.date.getTime());
  const lastMonthData = mergeAdsetData(previousMonthData, 'Last Month');

  // Current month
  const currentMonthData = filter
    .filter(item => item.date.getMonth() === new Date().getMonth())
    .sort((a: MetaAdsetData, b: MetaAdsetData) => a.date.getTime() - b.date.getTime());
  const monthData = mergeAdsetData(currentMonthData, 'Current Month');

  // Use to switch between projecting currnet month data and prior month's
  const lookedAtMonth = lookingAt ? monthData : lastMonthData;
  const lookedAtMonthDaily = lookingAt ? currentMonthData : previousMonthData;
  const DAYS_MONTH = lookedAtMonth.date.getDate();


  // Projection
  const projectedMonth = { ...lookedAtMonth };
  projectedMonth.amountSpent += Number(changeInAdSpent ? Number(changeInAdSpent) * DAYS_MONTH : 0);

  const baseSpend = lookedAtMonth.amountSpent;
  const newSpend = projectedMonth.amountSpent;
  const deltaSpend = Math.max(newSpend - baseSpend, 0);

  const deltaRatio = baseSpend > 0 ? deltaSpend / baseSpend : 0;
  const efficiency = 1 - (Number(performanceDegradation ?? 0) / 100);

  // helper to scale only incremental with degradation
  const scaleWithDegradation = (base: number) =>
    Math.floor(base + base * deltaRatio * efficiency);

  // --- Volume metrics ---
  projectedMonth.reach = scaleWithDegradation(lookedAtMonth.reach);
  projectedMonth.impressions = scaleWithDegradation(lookedAtMonth.impressions);
  projectedMonth.linkClicks = scaleWithDegradation(lookedAtMonth.linkClicks);
  projectedMonth.landingPageView = scaleWithDegradation(lookedAtMonth.landingPageView);
  projectedMonth.lead = scaleWithDegradation(lookedAtMonth.lead);
  projectedMonth.conversions = scaleWithDegradation(lookedAtMonth.conversions);

  // conversion value preserves value per conversion
  const valuePerConversion =
    lookedAtMonth.conversions > 0 ? lookedAtMonth.conversionValue / lookedAtMonth.conversions : 0;
  projectedMonth.conversionValue = Math.floor(valuePerConversion * projectedMonth.conversions);

  projectedMonth.costPerLead =
    projectedMonth.lead > 0 ? projectedMonth.amountSpent / projectedMonth.lead : 0;

  const projectDays: MetaAdsetData[] = [];

  // helper to distribute a monthly total across days exactly
  function distributeMonthly(total: number, days: number): number[] {
    const daily: number[] = Array(days).fill(0);
    const exact = total / days;
    let remainder = 0;

    for (let i = 0; i < days; i++) {
      const value = exact + remainder;      // add leftover fraction from previous days
      daily[i] = Math.floor(value);
      remainder = value - daily[i];         // update remainder
    }

    // final adjustment: add any leftover to the last day
    const sum = daily.reduce((a, b) => a + b, 0);
    const diff = total - sum;
    if (diff > 0) {
      daily[daily.length - 1] += diff;
    }

    return daily;
  }

  // compute per-day metrics
  const reachDays = distributeMonthly(projectedMonth.reach, DAYS_MONTH);
  const impressionsDays = distributeMonthly(projectedMonth.impressions, DAYS_MONTH);
  const linkClicksDays = distributeMonthly(projectedMonth.linkClicks, DAYS_MONTH);
  const landingPageDays = distributeMonthly(projectedMonth.landingPageView, DAYS_MONTH);
  const leadDays = distributeMonthly(projectedMonth.lead, DAYS_MONTH);
  const conversionsDays = distributeMonthly(projectedMonth.conversions, DAYS_MONTH);
  const conversionValueDays = distributeMonthly(projectedMonth.conversionValue, DAYS_MONTH);
  const amountSpentDays = distributeMonthly(projectedMonth.amountSpent, DAYS_MONTH);

  // create daily projections
  for (let i = 1; i <= DAYS_MONTH; i++) {
    const dayData: MetaAdsetData = createBlankMetaAdsetData("");

    dayData.date = new Date(new Date().getFullYear(), new Date().getMonth(), i);
    dayData.reach = reachDays[i - 1];
    dayData.impressions = impressionsDays[i - 1];
    dayData.linkClicks = linkClicksDays[i - 1];
    dayData.landingPageView = landingPageDays[i - 1];
    dayData.lead = leadDays[i - 1];
    dayData.conversions = conversionsDays[i - 1];
    dayData.conversionValue = conversionValueDays[i - 1];
    dayData.amountSpent = amountSpentDays[i - 1];

    // derived metrics per day
    dayData.ctr = dayData.impressions > 0 ? dayData.linkClicks / dayData.impressions : 0;
    dayData.frequency = dayData.reach > 0 ? dayData.impressions / dayData.reach : 0;
    dayData.cpm = dayData.impressions > 0 ? (dayData.amountSpent / dayData.impressions) * 1000 : 0;
    dayData.costPerLead = dayData.lead > 0 ? dayData.amountSpent / dayData.lead : 0;

    projectDays.push(dayData);
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} mb="md">This Month</Title>

        <Select
          data={adsetNames.map(name => ({ value: name, label: name })) || []}
          value={selectedAdset}
          onChange={setSelectedAdset}
          py="md"
        />

        <Group>
          <NumberInput
            label="Change in adspend (daily)"
            leftSection="$"
            placeholder="0"
            value={changeInAdSpent}
            onChange={setChangeInAdSpend}
          />
          <NumberInput
            label="Performance degradation"
            rightSection="%"
            placeholder="0"
            value={performanceDegradation}
            onChange={setPerformanceDegradation}
          />
          <Switch label="Compare current month" checked={lookingAt} onChange={(event) => setLookingAt(event.currentTarget.checked)} />
        </Group>

        <MetricsGrid
          data={projectedMonth}
          dataArr={projectDays}
          comparison={lookedAtMonth}
          comparisonArr={lookedAtMonthDaily}
        />
      </div>
    </Stack>
  );
};
