import { AreaChart } from '@mantine/charts';
import { useMatches } from '@mantine/core';
import { AdSetMetric } from '@/app/lib/types';

interface GraphDataPoint {
    day: number; // 1–31
    value: number | null;
    comparison?: number | null;
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

/* ------------------- Helpers ------------------- */

function daysInMonthSydney(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/* ------------------- Core logic ------------------- */

function getMonthDayCumulativeData(
    data: AdSetMetric[],
    metric: MetricKey,
    maxDay: number
): Map<number, number> {
    const perDay = new Map<number, number>();

    const sorted = [...data].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
    );

    for (const item of sorted) {
        const day = item.date.getDate();
        perDay.set(
            day,
            (perDay.get(day) ?? 0) + Number(item[metric] ?? 0)
        );
    }

    const cumulative = new Map<number, number>();
    let runningTotal = 0;

    for (let day = 1; day <= maxDay; day++) {
        runningTotal += perDay.get(day) ?? 0;
        cumulative.set(day, runningTotal);
    }

    return cumulative;
}

/* ------------------- Component ------------------- */

interface RunRateChartProps {
    analytics: AdSetMetric[];
    comparisonData?: AdSetMetric[];
    metric: MetricKey;
}

export function RunRateChart({
    analytics,
    comparisonData,
    metric,
}: RunRateChartProps) {
    if (!analytics?.length) {
        return <div>No data available</div>;
    }

    const today = new Date();
    const currentDay = today.getDate();

    const baseMonthDays = daysInMonthSydney(today);
    const comparisonMonthDays =
        comparisonData?.length
            ? daysInMonthSydney(comparisonData[0].date)
            : 31;

    const baseMap = getMonthDayCumulativeData(
        analytics,
        metric,
        currentDay // stop at today
    );

    const comparisonMap = comparisonData
        ? getMonthDayCumulativeData(
              comparisonData,
              metric,
              comparisonMonthDays // full month
          )
        : new Map<number, number>();

    const maxX = Math.max(
        currentDay,
        comparisonMonthDays
    );

    const graphData: GraphDataPoint[] = [];

    for (let day = 1; day <= maxX; day++) {
        graphData.push({
            day,
            value:
                day <= currentDay
                    ? baseMap.get(day) ?? 0
                    : null,
            comparison:
                day <= comparisonMonthDays
                    ? comparisonMap.get(day) ?? 0
                    : null,
        });
    }

    const showTooltip = useMatches({
        base: false,
        md: true,
    });

    return (
        <AreaChart
            h={300}
            data={graphData}
            dataKey="day"
            series={[
                { name: 'value', color: '#01E194' },
                { name: 'comparison', color: 'gray' },
            ]}
            withTooltip={showTooltip}
            connectNulls={false}
            withPointLabels={false}
        />
    );
}
