import { useState, useMemo, Fragment, ReactNode } from 'react';
import { Grid, Switch, Group, Text, useMatches } from '@mantine/core';
import { StatCard } from './StatCard';
import { RunRateChart } from './RunRateChart';
import { useMetaData } from '@/app/context/MetaContextProvider';
import { AdSetMetric } from '@/app/lib/types';
import { numberFormatter } from '@/utils/formatter';
import {
  IconUsers, IconTrendingUp, IconMessage, IconCurrencyDollar,
  IconUserPlus, IconPercentage, IconChartLine, IconCoin,
} from '@tabler/icons-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type NumericAdSetMetricKey = {
  [K in keyof AdSetMetric]: AdSetMetric[K] extends number ? K : never;
}[keyof AdSetMetric];

type MetricKey = {
  [K in keyof AdSetMetric]: AdSetMetric[K] extends number ? K : never;
}[keyof AdSetMetric] & (
    | 'lead' | 'amountSpent' | 'reach' | 'linkClicks'
    | 'landingPageView' | 'impressions' | 'ctr'
    | 'conversions' | 'conversionValue' | 'cpm'
  );

/** A fully custom card slot to inject into the grid. */
export interface ExtraCard {
  /** Must be unique across all cards. */
  key: string;
  /** The <StatCard /> (or any node) to render. */
  node: ReactNode;
  /**
   * If provided the card participates in the expand-chart interaction,
   * just like the built-in cards that have a `metric`.
   */
  metric?: MetricKey;
}

interface MetricsGridProps {
  data: AdSetMetric;
  comparison?: AdSetMetric;
  showComparison?: boolean;
  dataArr?: AdSetMetric[];
  comparisonArr?: AdSetMetric[];
  /** Extra <StatCard> slots appended after the built-in cards. */
  extraCards?: ExtraCard[];
}

// ─── Helpers ───────────────

function sumUpToDay(arr: AdSetMetric[], metric: MetricKey, dayOffset: number): number {
  if (!arr.length) return 0;
  const startTime = arr[0].date.getTime();
  const MS_PER_DAY = 86_400_000;
  return arr
    .filter(d => Math.floor((d.date.getTime() - startTime) / MS_PER_DAY) <= dayOffset)
    .reduce((sum, d) => sum + Number(d[metric] ?? 0), 0);
}

function computeSameDayChange(
  current: AdSetMetric[],
  prior: AdSetMetric[],
  metric: MetricKey,
  day: number,
): { absolute?: number; percent?: number } {
  const currentVal = sumUpToDay(current, metric, day);
  const priorVal = sumUpToDay(prior, metric, day);

  console.log(`currentVal calc'd as ${currentVal} for ${metric}`)
  console.log(`priorVal as ${priorVal}`)
  console.log(`day as ${day}`)

  if (!priorVal) return {};
  return {
    absolute: currentVal - priorVal,
    percent: ((currentVal - priorVal) / priorVal) * 100,
  };
}

type ChangeFormat = 'currency' | 'plain';

function formatAbsoluteChange(delta: number, fmt: ChangeFormat): string {
  const prefix = delta >= 0 ? '+' : '-';
  const abs = Math.abs(delta);
  return fmt === 'currency'
    ? `${prefix}$${numberFormatter.format(abs)}`
    : `${prefix}${numberFormatter.format(abs)}`;
}

function formatPercentChange(current: number, previous: number): string {
  const pct = ((current - previous) / previous) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  data,
  comparison,
  showComparison = false,
  dataArr = [],
  comparisonArr = [],
  extraCards = [],
}) => {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricKey | null>(null);
  const [activeRow, setActiveRow] = useState<number>(-1);

  const colSpan = useMatches({ base: 12, sm: 6, md: 4, lg: 3 });
  const cardsPerRow = 12 / colSpan;

  // Stable today anchor
  const lastDay = useMemo(() => {
    if (dataArr.length < 2) return 0;
    const startTime = dataArr[0].date.getTime();
    const endTime = dataArr.at(-1)!.date.getTime();
    console.log(`time = ${startTime}, ${endTime}`)
    return Math.floor((endTime - startTime) / 86_400_000);
  }, [dataArr]);
  console.log(`last day calculated as ${lastDay} because of ${dataArr.at(-1)?.adsetName}-${dataArr.at(-1)?.date} \n
  first day calculated because of ${dataArr[0].adsetName}-${dataArr[0].date}`)


  // All same-day comparisons in one memo
  const sameDayChanges = useMemo(() => {
    if (!dataArr.length || !comparisonArr.length) return {} as Record<MetricKey, ReturnType<typeof computeSameDayChange>>;
    const keys: MetricKey[] = ['lead', 'conversionValue', 'amountSpent', 'conversions'];
    return Object.fromEntries(
      keys.map(k => [k, computeSameDayChange(dataArr, comparisonArr, k, lastDay)])
    ) as Record<MetricKey, ReturnType<typeof computeSameDayChange>>;
  }, [dataArr, comparisonArr, lastDay]);

  // Derived metrics
  const cpl = data.lead > 0 ? data.amountSpent / data.lead : null;
  const cpa = data.conversions > 0 ? data.amountSpent / data.conversions : null;
  const roas = data.amountSpent > 0 ? data.conversionValue / data.amountSpent : 0;
  const conversionRate = data.lead > 0 ? (data.conversions / data.lead) * 100 : 0;

  const compCpl = comparison?.lead ? comparison.amountSpent / comparison.lead : undefined;
  const compCpa = comparison?.conversions ? comparison.amountSpent / comparison.conversions : undefined;
  const compRoas = comparison?.amountSpent ? comparison.conversionValue / comparison.amountSpent : undefined;
  const compConversionRate = comparison?.lead ? (comparison.conversions / comparison.lead) * 100 : undefined;

  // Change formatter
  function change(current: number, previous: number | undefined, fmt: ChangeFormat = 'plain'): string | undefined {
    if (!previous || !current) return undefined;
    return showAbsolute
      ? formatAbsoluteChange(current - previous, fmt)
      : formatPercentChange(current, previous);
  }

  function toggleMetric(metric: MetricKey, rowIndex: number) {
    const isActive = activeMetric === metric;
    setActiveMetric(isActive ? null : metric);
    setActiveRow(isActive ? -1 : rowIndex);
  }

  // ── Built-in card definitions ──────────────────────────────────────────────
  const builtInCardDefs = [
    { key: 'cpl', icon: <IconMessage size={28} />, title: 'Cost Per Lead', value: cpl != null ? `$${numberFormatter.format(cpl)}` : 'No leads', change: cpl != null ? change(cpl, compCpl, 'currency') : undefined, prior: compCpl != null ? `$${numberFormatter.format(compCpl)}` : undefined, lowerBetter: true, format: 'currency' as const },
    { key: 'leads', icon: <IconUserPlus size={28} />, title: 'Total Leads', value: data.lead.toLocaleString(), change: change(data.lead, comparison?.lead), prior: comparison?.lead.toLocaleString(), format: 'number' as const, metric: 'lead' as MetricKey, sameDayChange: sameDayChanges.lead },
    { key: 'cpa', icon: <IconTrendingUp size={28} />, title: 'Cost Per Acquisition', value: cpa != null ? `$${numberFormatter.format(cpa)}` : 'No conversions', change: cpa != null ? change(cpa, compCpa, 'currency') : undefined, prior: compCpa != null ? `$${numberFormatter.format(compCpa)}` : comparison ? 'No conversions' : undefined, lowerBetter: true, format: 'currency' as const },
    { key: 'conversionValue', icon: <IconCurrencyDollar size={28} />, title: 'Conversion Value', value: `$${numberFormatter.format(data.conversionValue)}`, change: change(data.conversionValue, comparison?.conversionValue, 'currency'), prior: comparison ? `$${numberFormatter.format(comparison.conversionValue)}` : undefined, lowerBetter: false, format: 'currency' as const, metric: 'conversionValue' as MetricKey, sameDayChange: sameDayChanges.conversionValue },
    { key: 'conversionRate', icon: <IconTrendingUp size={28} />, title: 'Conversion Rate', value: `${numberFormatter.format(conversionRate)}%`, change: change(conversionRate, compConversionRate), prior: comparison ? `${numberFormatter.format(compConversionRate ?? 0)}%` : undefined, format: 'percent' as const },
    { key: 'cpm', icon: <IconPercentage size={28} />, title: 'Cost Per Mille', value: `$${numberFormatter.format(data.cpm)}`, change: change(data.cpm, comparison?.cpm, 'currency'), prior: comparison ? `$${numberFormatter.format(comparison.cpm)}` : undefined, lowerBetter: true, format: 'currency' as const },
    { key: 'amountSpent', icon: <IconChartLine size={28} />, title: 'Amount Spent', value: `$${numberFormatter.format(data.amountSpent)}`, change: change(data.amountSpent, comparison?.amountSpent, 'currency'), prior: comparison ? `$${numberFormatter.format(comparison.amountSpent)}` : undefined, neutral: true, format: 'currency' as const, metric: 'amountSpent' as MetricKey, sameDayChange: sameDayChanges.amountSpent },
    { key: 'ctr', icon: <IconCoin size={28} />, title: 'Click Through Rate', value: `${numberFormatter.format(data.ctr)}%`, change: change(data.ctr, comparison?.ctr), prior: comparison ? `${numberFormatter.format(comparison.ctr)}%` : undefined, format: 'percent' as const },
    { key: 'frequency', icon: <IconUsers size={28} />, title: 'Frequency', value: data.frequency.toLocaleString(), change: change(data.frequency, comparison?.frequency), prior: comparison?.frequency.toLocaleString(), lowerBetter: true, format: 'number' as const },
    { key: 'roas', icon: <IconUsers size={28} />, title: 'Return on Ad Spend', value: roas.toFixed(2), change: change(roas, compRoas), prior: compRoas?.toLocaleString(), format: 'number' as const },
    { key: 'conversions', icon: <IconUsers size={28} />, title: 'Num Conversions', value: data.conversions.toString(), change: change(data.conversions, comparison?.conversions), prior: comparison?.conversions.toString(), format: 'number' as const, metric: 'conversions' as MetricKey, sameDayChange: sameDayChanges.conversions },
  ];

  // ── Unified render list ────────────────────────────────────────────────────
  // Normalise both built-in and extra cards to the same shape so the loop
  // below stays simple and the row-expansion logic works for all of them.
  type RenderItem =
    | { kind: 'builtin'; index: number; def: typeof builtInCardDefs[number] }
    | { kind: 'extra'; index: number; def: ExtraCard };

  const renderItems: RenderItem[] = [
    ...builtInCardDefs.map((def, i) => ({ kind: 'builtin' as const, index: i, def })),
    ...extraCards.map((def, i) => ({ kind: 'extra' as const, index: builtInCardDefs.length + i, def })),
  ];

  const totalCards = renderItems.length;

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

      <Grid>
        {renderItems.map((item) => {
          const { index } = item;
          const rowIndex = Math.floor(index / cardsPerRow);
          const isRowEnd = (index + 1) % cardsPerRow === 0 || index === totalCards - 1;
          const metric = item.def.metric as MetricKey | undefined;
          const isActive = !!metric && activeMetric === metric;

          return (
            <Fragment key={item.def.key}>
              <Grid.Col
                span={colSpan}
                onClick={() => metric ? toggleMetric(metric, rowIndex) : undefined}
              >
                {item.kind === 'extra' ? (
                  // Render the pre-built node as-is
                  item.def.node
                ) : (
                  (() => {
                    const { key: _key, metric: _metric, sameDayChange, prior, ...cardProps } = item.def;
                    return (
                      <StatCard
                        {...cardProps}
                        color="#20c997"
                        priorValue={prior}
                        active={isActive}
                        sameDayChange={sameDayChange}
                      />
                    );
                  })()
                )}
              </Grid.Col>

              {isRowEnd && activeRow === rowIndex && activeMetric && (
                <Grid.Col span={12}>
                  <RunRateChart
                    analytics={dataArr}
                    comparisonData={comparisonArr}
                    metric={activeMetric}
                    increment={1}
                  />
                </Grid.Col>
              )}
            </Fragment>
          );
        })}
      </Grid>
    </>
  );
};