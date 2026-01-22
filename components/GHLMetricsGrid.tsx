import { useState } from 'react';
import { Grid, Switch, Group, Text, useMatches, Container } from '@mantine/core';
import { StatCard } from './StatCard';
import { GHLData } from '../types/analytics';
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
import { GHL_PIPELINE_IDS } from '@/lib/constants/ghl';

interface GHLMetricsGridProps {
  data: GHLData[];
  comparison?: GHLData[];
  showComparison?: boolean;
}

const MERGED_STAGE_MAP: Record<string, string> = {
  'Discovery Session Booked': 'New Leads',
};

const normalizeStage = (stageId: string) => {
  const name = GHL_PIPELINE_IDS[stageId];
  return MERGED_STAGE_MAP[name] ?? name;
};

const GHLProgressPipeline = ['New Leads', 'Supporting Docs Requested', 'Work in Progress', 'Qualified & Quoted', 'Approved', 'Funded']

export const GHLMetricsGrid: React.FC<GHLMetricsGridProps> = ({ data, comparison, showComparison = false }) => {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [graphIndex, setGraphIndex] = useState<number>(-1);

  const calculateChange = (current: number, previous?: number, isCurrency: boolean = false): string | undefined => {
    if (!previous) return undefined;
    if (showAbsolute) {
      const absoluteChange = current - previous;
      const prefix = absoluteChange >= 0 ? '+' : '';
      if (isCurrency) {
        return `${prefix}$${numberFormatter.format(Math.abs(absoluteChange))}`;
      }
      return `${prefix}${numberFormatter.format(absoluteChange)}`;
    } else {
      const currentPercent = current / data.length * 100;
      const prevPercent = previous / (comparison?.length ?? 1) * 100;
      const change = currentPercent - prevPercent;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
  };

  const colSpan = useMatches({
    base: 12,
    sm: 6,
    md: 4,
    lg: 3,
  })

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

  console.log(data);
  const stageCount = buildStageCount(data);
  const previousStageCount = comparison ? buildStageCount(comparison) : undefined;

  function buildCumulativeCounts(
    stageCount: Map<string, number>,
    pipeline: string[]
  ) {
    const cumulative = new Map<string, number>();
    let runningTotal = 0;

    // iterate from END → START
    for (let i = pipeline.length - 1; i >= 0; i--) {
      const stage = pipeline[i];
      runningTotal += stageCount.get(stage) ?? 0;
      // runningTotal = stageCount.get(stage) ?? 0;
      cumulative.set(stage, runningTotal);
    }

    return cumulative;
  }


  const cumulativeStageCount = buildCumulativeCounts(stageCount, GHLProgressPipeline);
  const cumulativePreviousStageCount = previousStageCount
    ? buildCumulativeCounts(previousStageCount, GHLProgressPipeline)
    : undefined;

    console.log("stage count", stageCount)
  console.log("Cumulative stage count", cumulativeStageCount);

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
            : `${numberFormatter.format(value / (data.length || 1) * 100)}%`
        }
        color="#ffa94d"
        priorValue={
          comparison
            ? showAbsolute
              ? prevValue?.toLocaleString()
              : `${numberFormatter.format((prevValue || 0) / (comparison.length || 1) * 100)}%`
            : "0"
        }
        change={calculateChange(value, prevValue, false)}
      />
    );
  });


  const CARDS_PER_ROW = 12 / colSpan;

  const cards = stageCards.map((card, index) => {
    const rowIndex = Math.floor(index / CARDS_PER_ROW);
    const isRowEnd =
      (index + 1) % CARDS_PER_ROW === 0 || index === stageCards.length - 1;

    return (
      <>
        <Grid.Col
          key={`card-${index}`}
          span={colSpan}
          onClick={() => setGraphIndex(rowIndex)}
        >
          {card}
        </Grid.Col>

        {/* {isRowEnd && graphIndex === rowIndex && graph} */}
      </>
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
      <Container bd="black 1px solid" p="sm" size="xl">
        <Grid>
          {cards}
        </Grid>
      </Container>
      <Grid>
        {cards}
      </Grid>
    </>
  );
};