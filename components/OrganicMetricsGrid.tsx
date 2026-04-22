import { useState, useMemo } from 'react';
import { Grid, Switch, Group, Text, useMatches } from '@mantine/core';
import { StatCard } from './StatCard';
import { AdSetMetric } from '@/app/lib/types';
import {
  IconUsers,
  IconTrendingUp,
  IconMessage,
  IconCurrencyDollar,
  IconUserPlus,
  IconPercentage,
  IconChartLine,
  IconCoin,
} from '@tabler/icons-react';
import { numberFormatter } from '@/utils/formatter';
import { LTVGrid } from './LTV';
import { RunRateChart } from './RunRateChart';
import { useMetaData} from '@/app/context/MetaContextProvider';
import { LTVCost } from './LTVCtAC';
import { Fragment } from 'react';
import { calcDeltaEfficiency } from './Delta';

interface MetricsGridProps {
  data: AdSetMetric;
  comparison?: AdSetMetric;
  showComparison?: boolean;
  dataArr?: AdSetMetric[];
  comparisonArr?: AdSetMetric[];
}

type MetricKey = keyof Pick<
  AdSetMetric,
  | 'lead'
  | 'amountSpent'
  | 'reach'
  | 'linkClicks'
  | 'landingPageView'
  | 'impressions'
  | 'ctr'
  | 'conversions'
  | 'conversionValue'
  | 'cpm'
>;

function getSameDayValue(
  dataArr: AdSetMetric[] | undefined,
  metric: MetricKey,
  dayOfMonth: number
): number | undefined {
  if (!dataArr || dataArr.length === 0) return undefined;

  return dataArr
    .filter(d => d.date.getDate() <= dayOfMonth)
    .reduce((sum, d) => sum + Number(d[metric] ?? 0), 0);
}

function getSameDayChange(
  currentArr: AdSetMetric[] | undefined,
  comparisonArr: AdSetMetric[] | undefined,
  metric: MetricKey,
  currentDayOfMonth: number
): { absolute?: number; percent?: number } {
  if (!currentArr || !comparisonArr || currentArr.length === 0) return {};

  const currentValue = getSameDayValue(currentArr, metric, currentDayOfMonth) ?? 0;
  const comparisonValue = getSameDayValue(comparisonArr, metric, currentDayOfMonth) ?? 0;

  if (!comparisonValue) return {};

  return {
    absolute: currentValue - comparisonValue,
    percent: ((currentValue - comparisonValue) / comparisonValue) * 100,
  };
}

export const OrganicMetricsGrid: React.FC<MetricsGridProps> = ({
  data,
  comparison,
  showComparison = false,
  dataArr,
  comparisonArr,
}) => {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [showMetric, setShowMetricState] = useState<MetricKey | ''>('');
  const [graphIndex, setGraphIndex] = useState<number>(-1);
  const { data : fullData } = useMetaData();

  // Derived values computed once per render
  const currentDayOfMonth = useMemo(() => {
    if (!dataArr || dataArr.length === 0) return 0;
    return dataArr[dataArr.length - 1].date.getDate();
  }, [dataArr]);

  const prevDayOfMonth = Math.max(0, currentDayOfMonth - 1);

  // Pre-compute same-day values used in multiple cards
  const sameDayValues = useMemo(() => ({
    currentLead: getSameDayValue(dataArr, 'lead', prevDayOfMonth) ?? 0,
    currentSpend: getSameDayValue(dataArr, 'amountSpent', prevDayOfMonth) ?? 0,
    comparisonLead: getSameDayValue(comparisonArr, 'lead', prevDayOfMonth) ?? 0,
    comparisonSpend: getSameDayValue(comparisonArr, 'amountSpent', prevDayOfMonth) ?? 0,
  }), [dataArr, comparisonArr, prevDayOfMonth]);

  // Pre-compute same-day changes for cards that need them
  const sameDayChanges = useMemo(() => ({
    lead: getSameDayChange(dataArr, comparisonArr, 'lead', currentDayOfMonth),
    conversionValue: getSameDayChange(dataArr, comparisonArr, 'conversionValue', currentDayOfMonth),
    amountSpent: getSameDayChange(dataArr, comparisonArr, 'amountSpent', currentDayOfMonth),
    conversions: getSameDayChange(dataArr, comparisonArr, 'conversions', currentDayOfMonth),
  }), [dataArr, comparisonArr, currentDayOfMonth]);

  function setShowMetric(val: MetricKey) {
    if (showMetric === val) {
      setShowMetricState('');
      setGraphIndex(-1);
    } else {
      setShowMetricState(val);
    }
  }

  const calculateChange = (
    current: number,
    previous?: number,
    isCurrency: boolean = false
  ): string | undefined => {
    if (!previous || !current) return undefined;
    if (showAbsolute) {
      const absoluteChange = current - previous;
      const prefix = absoluteChange >= 0 ? '+' : '';
      return isCurrency
        ? `${prefix}$${numberFormatter.format(Math.abs(absoluteChange))}`
        : `${prefix}${numberFormatter.format(absoluteChange)}`;
    }
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const colSpan = useMatches({ base: 12, sm: 6, md: 4, lg: 4 });

  const graph =
    dataArr && showMetric !== '' ? (
      <Grid.Col span={12}>
        <RunRateChart analytics={dataArr} comparisonData={comparisonArr} metric={showMetric} />
      </Grid.Col>
    ) : null;

  // Derived metrics computed once
  const cpl = data.lead > 0 ? data.amountSpent / data.lead : null;
  const cpa = data.conversions > 0 ? data.amountSpent / data.conversions : null;
  const roas = data.amountSpent > 0 ? data.conversionValue / data.amountSpent : 0;

  const comparisonCpl =
    comparison && comparison.lead > 0
      ? comparison.amountSpent / comparison.lead
      : undefined;
  const comparisonCpa =
    comparison && comparison.conversions > 0
      ? comparison.amountSpent / comparison.conversions
      : undefined;
  const comparisonRoas =
    comparison && comparison.amountSpent > 0
      ? comparison.conversionValue / comparison.amountSpent
      : undefined;

  // Delta efficiency (used in two cards)
  const deltaEfficiency = useMemo(
    () =>
      dataArr && dataArr.length > 0
        ? calcDeltaEfficiency(
            sameDayValues.currentLead,
            sameDayValues.currentSpend,
            sameDayValues.comparisonLead,
            sameDayValues.comparisonSpend
          )
        : null,
    [sameDayValues, dataArr]
  );

  // Projected ROAS logic extracted and clarified
  const projectedRoas = useMemo((): string => {
    if (!comparison || !dataArr || dataArr.length === 0) return 'N/A';

    const spendDiff = Math.abs(sameDayValues.currentSpend - sameDayValues.comparisonSpend);
    const spendChangePct =
      sameDayValues.comparisonSpend > 0
        ? (spendDiff / sameDayValues.comparisonSpend) * 100
        : 0;

    // If spend changed by more than 5%, use current ROAS as-is
    if (spendChangePct > 5) {
      return roas.toFixed(2);
    }

    // Otherwise, scale ROAS by delta efficiency
    const scaled = deltaEfficiency != null ? roas * (deltaEfficiency / 100) : 0;
    return Math.max(scaled, 0).toFixed(2);
  }, [comparison, dataArr, sameDayValues, roas, deltaEfficiency]);

  const StatCards = [
    <StatCard
      key="leads"
      icon={<IconUserPlus size={28} />}
      title="Total Leads"
      value={data.lead.toLocaleString()}
      change={calculateChange(data.lead, comparison?.lead)}
      priorValue={comparison?.lead.toLocaleString()}
      color="#20c997"
      onClick={() => setShowMetric('lead')}
      active={showMetric === 'lead'}
      sameDayChange={sameDayChanges.lead}
      format="number"
    />,
    <StatCard
      key="conversionValue"
      icon={<IconCurrencyDollar size={28} />}
      title="Conversion Value"
      value={`$${numberFormatter.format(data.conversionValue)}`}
      change={calculateChange(data.conversionValue, comparison?.conversionValue, true)}
      priorValue={
        comparison ? `$${numberFormatter.format(comparison.conversionValue)}` : undefined
      }
      color="#20c997"
      lowerBetter={false}
      onClick={() => setShowMetric('conversionValue')}
      active={showMetric === 'conversionValue'}
      sameDayChange={sameDayChanges.conversionValue}
      format="currency"
    />,
    // <LTVGrid
    //   key="ltv"
    //   data={dataArr ?? fullData}
    //   comparison={comparisonArr}
    //   showComparison
    // />,
    // <LTVCost
    //   key="ltvCta"
    //   data={dataArr ?? fullData}
    //   comparison={comparisonArr ?? fullData}
    //   showComparison
    //   currentCost={data.amountSpent}
    //   priorCost={comparison?.amountSpent ?? 0}
    // />,
    <StatCard
      key="Conversions"
      icon={<IconUsers size={28} />}
      title="Num Conversions"
      value={data.conversions.toString()}
      change={calculateChange(data.conversions, comparison?.conversions)}
      priorValue={comparison?.conversions.toString()}
      onClick={() => setShowMetric('conversions')}
      active={showMetric === 'conversions'}
      color="#20c997"
      sameDayChange={sameDayChanges.conversions}
      format="number"
    />,
  ];

  const CARDS_PER_ROW = 12 / colSpan;

  const cards = StatCards.map((card, index) => {
    const rowIndex = Math.floor(index / CARDS_PER_ROW);
    const isRowEnd =
      (index + 1) % CARDS_PER_ROW === 0 || index === StatCards.length - 1;

    return (
      <Fragment key={`frag-card-${index}`}>
        <Grid.Col key={`card-${index}`} span={colSpan} onClick={() => setGraphIndex(rowIndex)}>
          {card}
        </Grid.Col>
        {isRowEnd && graphIndex === rowIndex && graph}
      </Fragment>
    );
  });

  return (
    <>
      {showComparison && (
        <Group justify="flex-end" mb="md">
          <Group gap="xs">
            <Text size="sm" c="dimmed">Percentage</Text>
            <Switch
              checked={showAbsolute}
              onChange={e => setShowAbsolute(e.currentTarget.checked)}
              size="md"
            />
            <Text size="sm" c="dimmed">Numeric</Text>
          </Group>
        </Group>
      )}
      <Grid>{cards}</Grid>
    </>
  );
};