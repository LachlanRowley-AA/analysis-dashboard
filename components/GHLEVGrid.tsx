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
  Stack,
  Badge,
} from '@mantine/core';
import { StatCard } from './StatCard';
import { GHLData } from '../types/analytics';
import {
  IconMessage,
  IconTrendingUp,
  IconCurrencyDollar,
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
  Cell,
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

// Stage colors for visual hierarchy
const STAGE_COLORS: Record<string, string> = {
  'New Leads': '#4dabf7',
  'Supporting Docs Requested': '#74c0fc',
  'Work in Progress': '#ffd43b',
  'Qualified & Quoted': '#ffa94d',
  'Approved': '#74b816',
  'Funded': '#51cf66',
};

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
    { name: 'In Pipeline', value: inPipeline, fill: '#51cf66' },
    { name: 'Out of Pipeline', value: outOfPipeline, fill: '#868e96' },
  ];
}

interface PipelineBarChartProps {
  title: string;
  data: { name: string; value: number; fill: string }[];
}

const PipelineBarChart: React.FC<PipelineBarChartProps> = ({ title, data }) => {
  return (
    <Paper 
      p="xl" 
      radius="lg" 
      withBorder 
      style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
        borderColor: '#e9ecef',
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title 
            order={4} 
            style={{
              fontWeight: 700,
              color: '#212529',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Title>
          <Badge 
            variant="light" 
            color="blue" 
            size="lg"
            style={{ fontWeight: 600 }}
          >
            {data.reduce((sum, d) => sum + d.value, 0)} Total
          </Badge>
        </Group>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#495057', fontSize: 13, fontWeight: 500 }}
              axisLine={{ stroke: '#dee2e6' }}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fill: '#495057', fontSize: 13, fontWeight: 500 }}
              axisLine={{ stroke: '#dee2e6' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ fontWeight: 600, color: '#212529' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Stack>
    </Paper>
  );
};

interface GHLEVGridProps {
  data: GHLData[];
  comparison?: GHLData[];
  showComparison?: boolean;
}

export const GHLEVGrid: React.FC<GHLEVGridProps> = ({
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

  // Calculate total funded value
  function getTotalFundedValue(data: GHLData[]): number {
    return data
      .filter(item => normalizeStage(item.stageId) === 'Funded')
      .reduce((sum, item) => sum + (item.value || 0), 0);
  }

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

  // Get all leads that have been at or past a specific stage (including those that fell off)
  // IMPORTANT: This function assumes one of two scenarios for tracking fallen-off leads:
  // Option 1: Your GHLData has a 'maxStageReached' property tracking the furthest stage
  // Option 2: You maintain historical stage data separately
  // 
  // If you don't track max stage reached, you may need to:
  // - Add historical stage tracking to your data model
  // - Or only count currently active pipeline leads (removing the fallen-off logic)
  function getAllLeadsAtOrPastStage(
    data: GHLData[],
    targetStage: string
  ): number {
    const stageIndex = GHLProgressPipeline.indexOf(targetStage);
    if (stageIndex === -1) return 0;

    let count = 0;
    
    data.forEach(item => {
      const stageName = normalizeStage(item.stageId);
      const currentStageIndex = GHLProgressPipeline.indexOf(stageName);
      
      // Case 1: Lead is currently in pipeline at or past this stage
      if (currentStageIndex >= stageIndex && currentStageIndex !== -1) {
        count++;
      }
      // Case 2: Lead fell off pipeline but had reached this stage
      else if (!GHLProgressPipeline.includes(stageName)) {
        // Check if they had progressed to or past targetStage before falling off
        // MODIFY THIS BASED ON YOUR DATA STRUCTURE:
        
        // Option A: If you have maxStageReached property
        if ('maxStageReached' in item && item.maxStageReached) {
          const maxStageIndex = GHLProgressPipeline.indexOf(
            normalizeStage(item.maxStageReached as string)
          );
          if (maxStageIndex >= stageIndex) {
            count++;
          }
        }
        // Option B: If you track stage history in an array
        // else if ('stageHistory' in item && Array.isArray(item.stageHistory)) {
        //   const reachedStages = item.stageHistory.map(s => normalizeStage(s));
        //   const maxIndex = Math.max(
        //     ...reachedStages.map(s => GHLProgressPipeline.indexOf(s))
        //   );
        //   if (maxIndex >= stageIndex) {
        //     count++;
        //   }
        // }
        // Option C: Conservative fallback - assume they only made it to first stage
        // This will undercount but won't throw errors
        else if (stageIndex === 0) {
          count++;
        }
      }
    });

    return count;
  }

  // Calculate EV for each stage
  function calculateEV(
    stageName: string,
    data: GHLData[],
    totalFundedValue: number
  ): number {
    const totalLeads = getAllLeadsAtOrPastStage(data, stageName);
    if (totalLeads === 0) return 0;
    return totalFundedValue / totalLeads;
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

  const totalFundedValue = getTotalFundedValue(data);
  const previousTotalFundedValue = comparison
    ? getTotalFundedValue(comparison)
    : 0;

  const calculateChange = (
    currentEV: number,
    previousEV?: number
  ): string | undefined => {
    if (!previousEV || previousEV === 0) return undefined;

    if (showAbsolute) {
      const diff = currentEV - previousEV;
      return `${diff >= 0 ? '+' : ''}$${Math.abs(diff).toLocaleString(undefined, { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}`;
    }

    const change = ((currentEV - previousEV) / previousEV) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const stageCards = GHLProgressPipeline.map(stageName => {
    const currentEV = calculateEV(stageName, data, totalFundedValue);
    const previousEV = comparison 
      ? calculateEV(stageName, comparison, previousTotalFundedValue)
      : 0;

    const totalLeadsAtStage = getAllLeadsAtOrPastStage(data, stageName);
    const prevTotalLeadsAtStage = comparison 
      ? getAllLeadsAtOrPastStage(comparison, stageName)
      : 0;

    return (
      <StatCard
        key={stageName}
        icon={<IconCurrencyDollar size={28} />}
        title={stageName}
        value={`$${currentEV.toLocaleString(undefined, { 
          minimumFractionDigits: 0, 
          maximumFractionDigits: 0 
        })}`}
        color={STAGE_COLORS[stageName] || '#ffa94d'}
        priorValue={
          comparison && previousEV > 0
            ? `$${previousEV.toLocaleString(undefined, { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}`
            : undefined
        }
        change={comparison ? calculateChange(currentEV, previousEV) : undefined}
      />
    );
  });

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
    <Stack gap="xl">
      {/* Header with controls */}
      <Paper 
        p="lg" 
        radius="lg" 
        withBorder
        style={{
          background: 'linear-gradient(135deg, #e7f5ff 0%, #d0ebff 100%)',
          borderColor: '#74c0fc',
        }}
      >
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Title 
              order={3} 
              style={{
                fontWeight: 800,
                color: '#1864ab',
                letterSpacing: '-0.03em',
              }}
            >
              Pipeline Expected Value
            </Title>
            <Text size="sm" c="dimmed" fw={500}>
              EV = Total Funded Value ÷ All Leads (including those that fell off pipeline)
            </Text>
          </Stack>

          {showComparison && (
            <Group gap="xs">
              <Text size="sm" c="dimmed" fw={600}>
                Percentage
              </Text>
              <Switch
                checked={showAbsolute}
                onChange={event =>
                  setShowAbsolute(event.currentTarget.checked)
                }
                size="md"
                color="blue"
              />
              <Text size="sm" c="dimmed" fw={600}>
                Absolute
              </Text>
            </Group>
          )}
        </Group>
      </Paper>

      {/* Stats Grid */}
      <Container p={0} size="xl">
        <Grid gutter="lg">{cards}</Grid>

        {/* Summary Stats */}
        <Paper 
          p="xl" 
          radius="lg" 
          withBorder 
          mt="xl"
          style={{
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)',
            borderColor: '#ffc9c9',
          }}
        >
          <Group justify="space-around" align="center" wrap="wrap">
            <Stack gap={4} align="center">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Total Funded Value
              </Text>
              <Title order={2} style={{ color: '#c92a2a', fontWeight: 800 }}>
                ${totalFundedValue.toLocaleString(undefined, { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </Title>
            </Stack>
            
            <Stack gap={4} align="center">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Total Leads (All Time)
              </Text>
              <Title order={2} style={{ color: '#1864ab', fontWeight: 800 }}>
                {getAllLeadsAtOrPastStage(data, 'New Leads')}
              </Title>
              <Group gap={8}>
                <Badge color="green" variant="light" size="sm">
                  {currentPipelineData[0].value} Active
                </Badge>
                <Badge color="gray" variant="light" size="sm">
                  {currentPipelineData[1].value} Fell Off
                </Badge>
              </Group>
            </Stack>

            <Stack gap={4} align="center">
              <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                Conversion Rate
              </Text>
              <Title order={2} style={{ color: '#2b8a3e', fontWeight: 800 }}>
                {((stageCount.get('Funded') ?? 0) / (getAllLeadsAtOrPastStage(data, 'New Leads') || 1) * 100).toFixed(1)}%
              </Title>
              <Text size="xs" c="dimmed">
                {stageCount.get('Funded') ?? 0} funded / {getAllLeadsAtOrPastStage(data, 'New Leads')} total
              </Text>
            </Stack>
          </Group>
        </Paper>

        {/* Pipeline vs Not Pipeline charts */}
        <Grid mt="xl" gutter="lg">
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
    </Stack>
  );
};