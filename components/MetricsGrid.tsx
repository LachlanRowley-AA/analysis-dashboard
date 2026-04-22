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
// import { LTVGrid } from './LTV';
import { RunRateChart } from './RunRateChart';
import { useMetaData} from '@/app/context/MetaContextProvider';
// import { LTVCost } from './LTVCtAC';
import { Fragment } from 'react';
// import { calcDeltaEfficiency } from './Delta';

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

export const MetricsGrid: React.FC<MetricsGridProps> = ({
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

  const colSpan = useMatches({ base: 12, sm: 6, md: 4, lg: 3 });

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

  // const deltaEfficiency = useMemo(
  //   () =>
  //     dataArr && dataArr.length > 0
  //       ? calcDeltaEfficiency(
  //           sameDayValues.currentLead,
  //           sameDayValues.currentSpend,
  //           sameDayValues.comparisonLead,
  //           sameDayValues.comparisonSpend
  //         )
  //       : null,
  //   [sameDayValues, dataArr]
  // );

  // Projected ROAS logic extracted and clarified
  // const projectedRoas = useMemo((): string => {
  //   if (!comparison || !dataArr || dataArr.length === 0) return 'N/A';

  //   const spendDiff = Math.abs(sameDayValues.currentSpend - sameDayValues.comparisonSpend);
  //   const spendChangePct =
  //     sameDayValues.comparisonSpend > 0
  //       ? (spendDiff / sameDayValues.comparisonSpend) * 100
  //       : 0;

  //   // If spend changed by more than 5%, use current ROAS as-is
  //   if (spendChangePct > 5) {
  //     return roas.toFixed(2);
  //   }

  //   // Otherwise, scale ROAS by delta efficiency
  //   const scaled = deltaEfficiency != null ? roas * (deltaEfficiency / 100) : 0;
  //   return Math.max(scaled, 0).toFixed(2);
  // }, [comparison, dataArr, sameDayValues, roas, deltaEfficiency]);

  const spendChangePerDay =
    currentDayOfMonth > 0
      ? ((sameDayChanges.amountSpent.absolute ?? 0) / currentDayOfMonth).toFixed(2)
      : '0.00';

  const StatCards = [
    <StatCard
      key="cpl"
      icon={<IconMessage size={28} />}
      title="Cost Per Lead"
      value={cpl != null ? `$${numberFormatter.format(cpl)}` : 'No leads'}
      change={cpl != null ? calculateChange(cpl, comparisonCpl, true) : undefined}
      priorValue={comparisonCpl != null ? `$${numberFormatter.format(comparisonCpl)}` : undefined}
      color="#20c997"
      lowerBetter
      format="currency"
    />,
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
      key="cta"
      icon={<IconTrendingUp size={28} />}
      title="Cost Per Acquisition"
      value={cpa != null ? `$${numberFormatter.format(cpa)}` : 'No conversions'}
      change={cpa != null ? calculateChange(cpa, comparisonCpa, true) : undefined}
      lowerBetter
      color="#20c997"
      priorValue={
        comparisonCpa != null
          ? `$${numberFormatter.format(comparisonCpa)}`
          : comparison
          ? 'No conversions'
          : undefined
      }
      format="currency"
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
    <StatCard
      key="cpm"
      icon={<IconPercentage size={28} />}
      title="Cost Per Mille"
      value={`$${numberFormatter.format(data.cpm)}`}
      change={calculateChange(data.cpm, comparison?.cpm, true)}
      priorValue={comparison ? `$${numberFormatter.format(comparison.cpm)}` : undefined}
      color="#20c997"
      lowerBetter
      format="currency"
    />,
    <StatCard
      key="amountSpent"
      icon={<IconChartLine size={28} />}
      title="Amount Spent"
      value={`$${numberFormatter.format(data.amountSpent)}`}
      change={calculateChange(data.amountSpent, comparison?.amountSpent, true)}
      color="#20c997"
      priorValue={
        comparison ? `$${numberFormatter.format(comparison.amountSpent)}` : undefined
      }
      neutral
      onClick={() => setShowMetric('amountSpent')}
      active={showMetric === 'amountSpent'}
      sameDayChange={sameDayChanges.amountSpent}
      format="currency"
    />,
    <StatCard
      key="ctr"
      icon={<IconCoin size={28} />}
      title="Click Through Rate"
      value={`${numberFormatter.format(data.ctr)}%`}
      change={calculateChange(data.ctr, comparison?.ctr)}
      color="#20c997"
      priorValue={comparison ? `${numberFormatter.format(comparison.ctr)}%` : undefined}
      format="percent"
    />,
    <StatCard
      key="frequency"
      icon={<IconUsers size={28} />}
      title="Frequency"
      value={data.frequency.toLocaleString()}
      change={calculateChange(data.frequency, comparison?.frequency)}
      priorValue={comparison?.frequency.toLocaleString()}
      color="#20c997"
      lowerBetter
      format="number"
    />,
    <StatCard
      key="roas"
      icon={<IconUsers size={28} />}
      title="Return on Ad Spend"
      value={roas.toFixed(2)}
      change={calculateChange(roas, comparisonRoas)}
      priorValue={comparisonRoas?.toLocaleString()}
      color="#20c997"
      format="number"
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
    // <StatCard
    //   key="delta"
    //   icon={<IconUsers size={28} />}
    //   title="Adspend Change Efficiency"
    //   value={deltaEfficiency != null ? `${deltaEfficiency}%` : 'N/A'}
    //   color="#20c997"
    //   format="percent"
    //   priorTextStart="of the expected leads from"
    //   priorValue={
    //     dataArr && dataArr.length > 0
    //       ? `$${spendChangePerDay}/day change`
    //       : undefined
    //   }
    // />,
    // <StatCard
    //   key="projectedRoas"
    //   icon={<IconChartLine size={28} />}
    //   title="Adspend Change Projected ROAS"
    //   value={projectedRoas}
    //   color="#20c997"
    //   format="number"
    // />,
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