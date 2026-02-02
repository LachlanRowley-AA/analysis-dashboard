import { Fragment, useState } from 'react';
import {
  Grid,
  Switch,
  Group,
  Text,
  useMatches,
  Container,
  Paper,
  Title,
} from '@mantine/core';
import { StatCard } from './StatCard';
import { GHLData } from '../types/analytics';
import {
  IconMessage,
} from '@tabler/icons-react';
import { numberFormatter } from '@/lib/formatter';
import { GHL_PIPELINE_IDS } from '@/lib/constants/ghl';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';


const MERGED_STAGE_MAP: Record<string, string> = {
  'Discovery Session Booked': 'New Leads',
};

const normalizeStage = (stageId: string) => {
  const name = GHL_PIPELINE_IDS[stageId];
  return MERGED_STAGE_MAP[name] ?? name;
};

const GHLProgressPipeline = [
  'New Leads',
  'Supporting Docs Requested',
  'Work in Progress',
  'Qualified & Quoted',
  'Approved',
  'Funded',
];

function buildPipelineSplit(data: GHLData[]) {
  let inPipeline = 0;
  let outOfPipeline = 0;

  data.forEach(item => {
    const stageName = normalizeStage(item.stageId);
    if (GHLProgressPipeline.includes(stageName)) {
      inPipeline++;
    } else {
      outOfPipeline++;
    }
  });

  return [
    { name: 'In Pipeline', value: inPipeline, fill: '#82ca9d' },
    { name: 'Out of Pipeline', value: outOfPipeline, fill: "#5f5f5f" },
  ];
}

interface PipelineBarChartProps {
  title: string;
  data: { name: string; value: number, fill: string }[];
}

const PipelineBarChart: React.FC<PipelineBarChartProps> = ({ title, data }) => {
  return (
    <Paper p="md" radius="md" withBorder>
      <Title order={5} mb="sm">
        {title}
      </Title>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};


interface GHLMetricsGridProps {
  data: GHLData[];
  comparison?: GHLData[];
  showComparison?: boolean;
}

export const GHLMetricsGrid: React.FC<GHLMetricsGridProps> = ({
  data,
  comparison,
  showComparison = false,
}) => {
  const [showAbsolute, setShowAbsolute] = useState(false);

  const colSpan = useMatches({
    base: 12,
    sm: 6,
    md: 4,
    lg: 3,
  });


  function buildStageCount(data: GHLData[]) {
    const map = new Map<string, number>();

    for (const stageName of Object.values(GHL_PIPELINE_IDS)) {
      map.set(stageName, 0);
    }

    data.forEach(item => {
      const stageName = normalizeStage(item.stageId);
      map.set(stageName, (map.get(stageName) ?? 0) + 1);
    });

    return map;
  }

  function buildCumulativeCounts(
    stageCount: Map<string, number>,
    pipeline: string[]
  ) {
    const cumulative = new Map<string, number>();
    let runningTotal = 0;

    for (let i = pipeline.length - 1; i >= 0; i--) {
      const stage = pipeline[i];
      runningTotal += stageCount.get(stage) ?? 0;
      cumulative.set(stage, runningTotal);
    }

    return cumulative;
  }

  const stageCount = buildStageCount(data);
  const previousStageCount = comparison
    ? buildStageCount(comparison)
    : undefined;

  const cumulativeStageCount = buildCumulativeCounts(
    stageCount,
    GHLProgressPipeline
  );

  const cumulativePreviousStageCount = previousStageCount
    ? buildCumulativeCounts(previousStageCount, GHLProgressPipeline)
    : undefined;

  const calculateChange = (
    current: number,
    previous?: number
  ): string | undefined => {
    if (!previous) return undefined;

    if (showAbsolute) {
      const diff = current - previous;
      return `${diff >= 0 ? '+' : ''}${diff}`;
    }

    const currentPct = (current / (data.length || 1)) * 100;
    const prevPct =
      (previous / (comparison?.length || 1)) * 100;

    const change = currentPct - prevPct;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const stageCards = GHLProgressPipeline.map(stageName => {
    const value = cumulativeStageCount.get(stageName) ?? 0;
    const prevValue = cumulativePreviousStageCount?.get(stageName);

    return (
      <StatCard
        key={stageName}
        icon={<IconMessage size={28} />}
        title={stageName}
        value={
          showAbsolute
            ? value.toLocaleString()
            : `${numberFormatter.format(
              (value / (data.length || 1)) * 100
            )}%`
        }
        color="#ffa94d"
        priorValue={
          comparison
            ? showAbsolute
              ? prevValue?.toLocaleString()
              : `${numberFormatter.format(
                ((prevValue || 0) /
                  (comparison.length || 1)) *
                100
              )}%`
            : '0'
        }
        change={calculateChange(value, prevValue)}
      />
    );
  });

  const CARDS_PER_ROW = 12 / colSpan;

  const cards = stageCards.map((card, index) => (
    <Fragment key={index}>
      <Grid.Col span={colSpan}>{card}</Grid.Col>
    </Fragment>
  ));


  const currentPipelineData = buildPipelineSplit(data);
  const comparisonPipelineData = comparison
    ? buildPipelineSplit(comparison)
    : null;

  return (
    <>
      {showComparison && (
        <Group justify="flex-end" mb="md">
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Percentage
            </Text>
            <Switch
              checked={showAbsolute}
              onChange={event =>
                setShowAbsolute(event.currentTarget.checked)
              }
              size="md"
            />
            <Text size="sm" c="dimmed">
              Numeric
            </Text>
          </Group>
        </Group>
      )}

      <Container p="sm" size="xl">
        <Grid>{cards}</Grid>

        {/* Pipeline vs Not Pipeline charts */}
        <Grid mt="lg">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <PipelineBarChart
              title="Current Period"
              data={currentPipelineData}
            />
          </Grid.Col>

          {comparisonPipelineData && (
            <Grid.Col span={{ base: 12, md: 6 }}>
              <PipelineBarChart
                title="Previous Period"
                data={comparisonPipelineData}
              />
            </Grid.Col>
          )}
        </Grid>
      </Container>
    </>
  );
};
