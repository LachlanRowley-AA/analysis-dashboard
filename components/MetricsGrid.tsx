import { useState } from 'react';
import { Grid, Switch, Group, Text, useMatches } from '@mantine/core';
import { StatCard } from './StatCard';
import { MetaAdsetData } from '../types/analytics';
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
import { numberFormatter } from '@/lib/formatter';
import { LTVGrid } from './LTV';
import { RunRateChart } from './RunRateChart';
import { useAnalytics } from './DataStorageContext';
import { LTVCost } from './LTVCtAC';
import { Fragment } from 'react';
import { calcDeltaEfficiency } from './Delta';
import { getSydneyDateParts } from '@/lib/utils/aedt';

interface MetricsGridProps {
  data: MetaAdsetData;
  comparison?: MetaAdsetData;
  showComparison?: boolean;
  dataArr?: MetaAdsetData[];
  comparisonArr?: MetaAdsetData[];
}

type MetricKey = keyof Pick<
  MetaAdsetData,
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
  dataArr: MetaAdsetData[] | undefined,
  metric: MetricKey,
  dayOfMonth: number
): number | undefined {
  if (!dataArr || dataArr.length === 0) return;

  console.log("Getting same day value for metric: ", metric, " on day: ", dayOfMonth);

  const cumulative = dataArr
    .filter(d => getSydneyDateParts(d.date).date <= dayOfMonth)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .reduce((sum, d) => sum + Number(d[metric] ?? 0), 0);

  return cumulative;
}


function getSameDayChange(
  currentArr: MetaAdsetData[] | undefined,
  comparisonArr: MetaAdsetData[] | undefined,
  metric: MetricKey
): { absolute?: number; percent?: number } {
  if (!currentArr || !comparisonArr) return {};

  let dayInArr = currentArr[currentArr.length - 1]
  console.log("Current array last day: ", dayInArr?.date);
  console.log("Array: ", currentArr);
  if (!dayInArr) return {};
  let dayOfMonth = getSydneyDateParts(dayInArr.date).date;


  const currentValue = getSameDayValue(currentArr, metric, dayOfMonth) ?? 0;
  const comparisonValue = getSameDayValue(comparisonArr, metric, dayOfMonth) ?? 0;

  if (metric === 'amountSpent') {
    console.log("Current value for metric ", metric, ": ", currentValue, "Comparison value: ", comparisonValue, " on day: ", dayOfMonth);
  }
  if (!comparisonValue) return {};

  return {
    absolute: currentValue - comparisonValue,
    percent: ((currentValue - comparisonValue) / comparisonValue) * 100,
  };
}


export const MetricsGrid: React.FC<MetricsGridProps> = ({ data, comparison, showComparison = false, dataArr, comparisonArr }) => {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [showMetric, setShowMetricState] = useState<MetricKey | ''>('');
  const [graphIndex, setGraphIndex] = useState<number>(-1);
  const fullData: MetaAdsetData[] = useAnalytics().metaData;
  if (!dataArr || dataArr.length === 0) {
    return <div>Loading...</div>;
  }

  function setShowMetric(val: MetricKey) {
    if (showMetric === val) {
      setGraphIndex(-1);
    }
    setShowMetricState(val);
  }

  const calculateChange = (current: number, previous?: number, isCurrency: boolean = false): string | undefined => {
    // console.log("previous = ", previous);
    if (!previous || !current || previous == undefined) return;
    if (showAbsolute) {
      const absoluteChange = current - previous;
      const prefix = absoluteChange >= 0 ? '+' : '';
      if (isCurrency) {
        return `${prefix}$${numberFormatter.format(Math.abs(absoluteChange))}`;
      }
      return `${prefix}${numberFormatter.format(absoluteChange)}`;
    } else {
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
  };
  const graph = (
    dataArr && showMetric !== '' ?
      <Grid.Col span={12}><RunRateChart analytics={dataArr} comparisonData={comparisonArr} metric={showMetric} /></Grid.Col>
      : null
  );
  const colSpan = useMatches({
    base: 12,
    sm: 6,
    md: 4,
    lg: 3,
  })


  const StatCards = [
    <StatCard
      key={'cpl'}
      icon={<IconMessage size={28} />}
      title="Cost Per Lead"
      value={data.lead > 0 ? `$${numberFormatter.format(data.amountSpent / data.lead)}` : "No leads"}
      change={calculateChange(data.amountSpent / data.lead, comparison ? comparison.amountSpent / comparison.lead : undefined, true)}
      priorValue={comparison ? `$${numberFormatter.format(comparison.amountSpent / comparison.lead)}` : undefined}
      color="#20c997"
      lowerBetter
      format='currency'
    />,
    <StatCard
      key={'leads'}
      icon={<IconUserPlus size={28} />}
      title="Total Leads"
      value={data.lead.toLocaleString()}
      change={calculateChange(data.lead, comparison?.lead)}
      priorValue={comparison ? comparison.lead.toLocaleString() : undefined}
      color="#20c997"
      onClick={() => setShowMetric("lead")}
      active={showMetric === 'lead'}
      sameDayChange={getSameDayChange(dataArr, comparisonArr, 'lead')}
      format='number'
    />,
    <StatCard
      key={'cta'}
      icon={<IconTrendingUp size={28} />}
      title="Cost Per Acquisition"
      value={data.conversions > 0 ? `$${numberFormatter.format(data.amountSpent / data.conversions)}` : "No conversions"}
      change={calculateChange(data.amountSpent / data.conversions, comparison ? comparison?.amountSpent / comparison?.conversions : 0, true)}
      lowerBetter
      color="#20c997"
      priorValue={comparison ?
        comparison.conversions > 0 ? `$${numberFormatter.format(comparison.amountSpent / comparison.conversions)}` : "No conversions"
        : undefined}
      format='currency'
    />,
    <StatCard
      key={'conversionValue'}
      icon={<IconCurrencyDollar size={28} />}
      title="Conversion Value"
      value={`$${numberFormatter.format(data.conversionValue)}`}
      change={calculateChange(data.conversionValue, comparison?.conversionValue, true)}
      priorValue={comparison ? `$${numberFormatter.format(comparison.conversionValue)}` : undefined}
      color="#20c997"
      lowerBetter={false}
      onClick={() => setShowMetric("conversionValue")}
      active={showMetric === 'conversionValue'}
      sameDayChange={getSameDayChange(dataArr, comparisonArr, 'conversionValue')}
      format='currency'
    />,
    <StatCard
      key={'cpm'}
      icon={<IconPercentage size={28} />}
      title="Cost Per Mille"
      value={`$${numberFormatter.format(data.cpm)}`}
      change={calculateChange(data.cpm, comparison?.cpm, true)}
      priorValue={comparison ? `$${numberFormatter.format(comparison.cpm)}` : undefined}
      color="#20c997"
      lowerBetter
      format='currency'
    />,
    <StatCard
      key={'amountSpent'}
      icon={<IconChartLine size={28} />}
      title="Amount Spent"
      value={`$${numberFormatter.format(data.amountSpent)}`}
      change={calculateChange(data.amountSpent, comparison?.amountSpent, true)}
      color="#20c997"
      priorValue={comparison ? `$${numberFormatter.format(comparison.amountSpent)}` : undefined}
      neutral
      onClick={() => setShowMetric("amountSpent")}
      active={showMetric === 'amountSpent'}
      sameDayChange={getSameDayChange(dataArr, comparisonArr, 'amountSpent')}
      format='currency'
    />,
    <StatCard
      key={'ctr'}
      icon={<IconCoin size={28} />}
      title="Click Through Rate"
      value={`${numberFormatter.format(data.ctr)}%`}
      change={calculateChange(data.ctr, comparison?.ctr)}
      color="#20c997"
      priorValue={comparison ? `${numberFormatter.format(comparison.ctr)}%` : undefined}
      format='percent'
    />,
    <StatCard
      key={'frequency'}
      icon={<IconUsers size={28} />}
      title="Frequency"
      value={data.frequency.toLocaleString()}
      change={calculateChange(data.frequency, comparison?.frequency)}
      priorValue={comparison ? comparison.frequency.toLocaleString() : undefined}
      color="#20c997"
      lowerBetter
      format='number'
    />,
    <StatCard
      key={'roas'}
      icon={<IconUsers size={28} />}
      title="Return on Ad Spend"
      value={(data.conversionValue / data.amountSpent).toFixed(2)}
      change={calculateChange((data.conversionValue / data.amountSpent), (comparison?.conversionValue ? comparison?.conversionValue / comparison?.amountSpent : 0))}
      priorValue={comparison ? (comparison.conversionValue / comparison.amountSpent).toLocaleString() : undefined}
      color="#20c997"
      format='number'
    />,
    <LTVGrid
      key={'ltv'}
      data={dataArr ? dataArr : fullData}
      comparison={comparisonArr ?? undefined}
      showComparison={true}
    />,
    <LTVCost
      key={'ltvCta'}
      data={dataArr ? dataArr : fullData}
      comparison={comparisonArr ?? fullData}
      showComparison={true}
      currentCost={data.amountSpent}
      priorCost={comparison ? comparison.amountSpent : 0}
    />,
    <StatCard
      key={'Conversions'}
      icon={<IconUsers size={28} />}
      title="Num Conversions"
      value={(data.conversions.toString())}
      change={calculateChange((data.conversions), (comparison?.conversions ? comparison?.conversions : 0))}
      priorValue={comparison ? comparison.conversions.toString() : undefined}
      onClick={() => setShowMetric("conversions")}
      active={showMetric === 'conversions'}
      color="#20c997"
      sameDayChange={getSameDayChange(dataArr, comparisonArr, 'conversions')}
      format='number'
    />,
    <StatCard
      key={'delta'}
      icon={<IconUsers size={28} />}
      title="Adspend Change Efficiency"
      value={
          `${calcDeltaEfficiency(
            getSameDayValue(dataArr, 'lead', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
            getSameDayValue(dataArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
            getSameDayValue(comparisonArr, 'lead', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
            getSameDayValue(comparisonArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0)}%`
        }
      color="#20c997"
      format='percent'
      priorTextStart='of the expected leads from'
      priorValue={`$${((getSameDayChange(dataArr, comparisonArr, 'amountSpent').absolute ?? 0) / (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date : 1)).toFixed(2)}/day change
        `}
    />,
    <StatCard
      key={'projectedRoas'}
      icon={<IconChartLine size={28} />}
      title="Adspend Change Projected ROAS"
      value={comparison ?
        (
          Math.abs((getSameDayValue(dataArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0)
            - (getSameDayValue(comparisonArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0))
            / ((getSameDayValue(comparisonArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0) || 1)
            > 0.05 * 100 ?
            Math.max(data.conversionValue / data.amountSpent)
            :
            Math.max((data.conversionValue / data.amountSpent) *
              (calcDeltaEfficiency(
                getSameDayValue(dataArr, 'lead', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
                getSameDayValue(dataArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
                getSameDayValue(comparisonArr, 'lead', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0,
                getSameDayValue(comparisonArr, 'amountSpent', (dataArr ? getSydneyDateParts(dataArr[dataArr.length - 1].date).date - 1 : 0)) ?? 0
              ) / 100), 0)
        ).toFixed(2) : "N/A"
      }
      color="#20c997"
      format='number'
    />
  ];
  const CARDS_PER_ROW = 12 / colSpan;

  const cards = StatCards.map((card, index) => {
    const rowIndex = Math.floor(index / CARDS_PER_ROW);
    const isRowEnd =
      (index + 1) % CARDS_PER_ROW === 0 || index === StatCards.length - 1;

    return (
      <Fragment key={`frag-card-${index}`}>
        <Grid.Col
          key={`card-${index}`}
          span={colSpan}
          onClick={() => setGraphIndex(rowIndex)}
        >
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
              onChange={(event) => setShowAbsolute(event.currentTarget.checked)}
              size="md"
            />
            <Text size="sm" c="dimmed">Numeric</Text>
          </Group>
        </Group>
      )
      }
      <Grid>
        {cards}
      </Grid>
    </>
  );
};