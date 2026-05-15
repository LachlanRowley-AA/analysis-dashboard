import { AreaChart } from '@mantine/charts';
import { useMatches } from '@mantine/core';
import { AdSetMetric } from '@/app/lib/types';

interface GraphDataPoint {
    period: number; // day number from start of period (1, 8, 15, …)
    value: number | null;
    comparison?: number | null;
}

type MetricKey = {
    [K in keyof AdSetMetric]: AdSetMetric[K] extends number ? K : never;
}[keyof AdSetMetric] & (
        | 'lead' | 'amountSpent' | 'reach' | 'linkClicks'
        | 'landingPageView' | 'impressions' | 'ctr'
        | 'conversions' | 'conversionValue' | 'cpm'
    );

/* ------------------- Helpers ------------------- */

function bucketLabel(startDay: number, increment: number): string {
    if (increment === 1) return `${startDay}`;
    const end = startDay + increment - 1;
    return `Day ${startDay}–${end}`;
}

/* ------------------- Core logic ------------------- */

/**
 * Converts a sorted list of metrics into cumulative bucket totals.
 * Days are relative to the earliest date in the dataset (day 1).
 * Buckets are `increment` days wide, keyed by their start day.
 */
function getIncrementCumulativeData(
    data: AdSetMetric[],
    metric: MetricKey,
    maxRelativeDay: number,
    increment: number,
): Map<number, number> {
    if (!data.length) return new Map();

    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Anchor: midnight of the first day in the dataset
    const anchorTime = new Date(sorted[0].date);
    anchorTime.setHours(0, 0, 0, 0);

    // Sum values by relative day (1-indexed)
    const perDay = new Map<number, number>();
    for (const item of sorted) {
        const relativeDay =
            Math.floor(
                (item.date.getTime() - anchorTime.getTime()) / 86_400_000
            ) + 1;
        perDay.set(relativeDay, (perDay.get(relativeDay) ?? 0) + Number(item[metric] ?? 0));
    }

    // Walk day-by-day up to maxRelativeDay, emitting at bucket boundaries
    const result = new Map<number, number>();
    let runningTotal = 0;

    for (let day = 1; day <= maxRelativeDay; day++) {
        runningTotal += perDay.get(day) ?? 0;

        const isEndOfBucket = day % increment === 0;
        const isLastDay = day === maxRelativeDay;

        if (isEndOfBucket || isLastDay) {
            const bucketStart = day - (day % increment === 0 ? increment - 1 : (day % increment) - 1);
            result.set(bucketStart, runningTotal);
        }
    }

    return result;
}

/* ------------------- Component ------------------- */

interface RunRateChartProps {
    analytics: AdSetMetric[];
    comparisonData?: AdSetMetric[];
    metric: MetricKey;
    /** Bucket width in days. Defaults to 7. Use 1 for daily, 30 for monthly. */
    increment?: number;
}

export function RunRateChart({
    analytics,
    comparisonData,
    metric,
    increment = 7,
}: RunRateChartProps) {
    if (!analytics?.length) {
        return <div>No data available</div>;
    }

    const sorted = [...analytics].sort((a, b) => a.date.getTime() - b.date.getTime());
    const anchorBase = new Date(sorted[0].date);
    anchorBase.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const distinctDates = [...new Set(
        sorted.map(d => d.date.toDateString())
    )];

    const detectedIncrement = distinctDates.length >= 2
        ? Math.round(
            (new Date(distinctDates[1]).getTime() - new Date(distinctDates[0]).getTime()) / 86_400_000
        )
        : increment;

    const effectiveIncrement = detectedIncrement > 0 ? detectedIncrement : increment;

    
    const currentRelativeDay =
        Math.floor((today.getTime() - anchorBase.getTime()) / 86_400_000) + 1;

    const comparisonRelativeDay = comparisonData?.length
        ? (() => {
            const cs = [...comparisonData].sort((a, b) => a.date.getTime() - b.date.getTime());
            const compAnchor = new Date(cs[0].date);
            compAnchor.setHours(0, 0, 0, 0);
            const compEnd = new Date(cs[cs.length - 1].date);
            compEnd.setHours(0, 0, 0, 0);
            return Math.floor((compEnd.getTime() - compAnchor.getTime()) / 86_400_000) + 1;
        })()
        : 0;

    const baseMap = getIncrementCumulativeData(
        analytics,
        metric,
        currentRelativeDay,
        effectiveIncrement,
    );

    const comparisonMap = comparisonData?.length
        ? getIncrementCumulativeData(comparisonData, metric, comparisonRelativeDay, effectiveIncrement)
        : new Map<number, number>();

    const allBucketStarts = Array.from(
        new Set([...baseMap.keys(), ...comparisonMap.keys()])
    ).sort((a, b) => a - b);

    const graphData: GraphDataPoint[] = allBucketStarts.map((bucketStart) => ({
        period: bucketStart,
        value: baseMap.has(bucketStart) ? (baseMap.get(bucketStart) ?? 0) : null,
        comparison: comparisonMap.has(bucketStart)
            ? (comparisonMap.get(bucketStart) ?? 0)
            : null,
    }));

    const showTooltip = useMatches({ base: false, md: true });

    return (
        <AreaChart
            h={300}
            data={graphData}
            dataKey="period"
            series={[
                { name: 'value', color: '#01E194' },
                { name: 'comparison', color: 'gray' },
            ]}
            withTooltip={showTooltip}
            connectNulls={false}
            withPointLabels={false}
            xAxisProps={{
                tickFormatter: (v: number) => bucketLabel(v, effectiveIncrement),
            }}
        />
    );
}