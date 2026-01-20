import { AreaChart } from '@mantine/charts';
import { useMatches } from '@mantine/core';

interface GraphDataPoint {
    day: string;
    value: number | null;
    comparison?: number | null;
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

import { useAnalytics } from './DataStorageContext';
import { MetaAdsetData } from '@/types/analytics';

function getCumulativeData(
    data: MetaAdsetData[],
    metric: MetricKey
): GraphDataPoint[] {
    data.sort((a, b) => a.date.getTime() - b.date.getTime());

    let counter = 0;

    return data.map(item => {
        counter += Number(item[metric] ?? 0);

        return {
            day: item.date.getDate().toString(),
            value: counter,
        };
    });
}

function mergeDupes(data: GraphDataPoint[]): GraphDataPoint[] {
    const mergedData: GraphDataPoint[] = [];
    const merged = new Map<string, GraphDataPoint>();
    data.forEach(item => {
        if (merged.has(item.day)) {
            const existing = merged.get(item.day)!;
            existing.value = existing.value ? existing.value + ((item.value || 0) - existing.value) : item.value;
        } else {
            merged.set(item.day, { ...item });
        }
    });
    for (const key of merged.keys()) {
        const dataPoint : GraphDataPoint = { day: key, value: merged.get(key)!.value };
        mergedData.push(dataPoint);
    }
    return mergedData;
}

interface RunRateChartProps {
    analytics: MetaAdsetData[];
    comparisonData?: MetaAdsetData[];
    metric: MetricKey;
}
export function RunRateChart({ analytics, comparisonData, metric }: RunRateChartProps) {
    if (!analytics || analytics.length === 0) {
        return <div>No data available</div>;
    }

    const graphData = mergeDupes(getCumulativeData(analytics, metric));
    const comparison = mergeDupes(getCumulativeData(comparisonData || [], metric));
    for (let i = 0; i < graphData.length; i++) {
        if (comparison[i]) {
            graphData[i].comparison = comparison[i].value || 0;
        }
    }
    for (let i = graphData.length; i < comparison.length; i++) {
        const newDataPoint: GraphDataPoint = {
            day: comparison[i].day,
            value: null,
            comparison: comparison[i].value || null,
        }
        graphData.push(newDataPoint);
    }

    const showTooltip = useMatches({
        base: false,
        md: true
    });

    return (
        <AreaChart
            h={300}
            data={graphData}
            series={[{ name: 'value', color: 'blue' }, { name: 'comparison', color: 'gray' }]}
            dataKey='day'
            withPointLabels={showTooltip}
            connectNulls={false}
            withTooltip
        />
    )
}