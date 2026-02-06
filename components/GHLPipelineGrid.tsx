import { Fragment, useState } from 'react';
import {
  Grid,
  Switch,
  Group,
  Text,
  useMatches,
  Container,
} from '@mantine/core';
import { StatCard } from './StatCard';
import { GHLData } from '../types/analytics';
import { IconMessage } from '@tabler/icons-react';
import { numberFormatter } from '@/lib/formatter';
import { GHL_PIPELINE_IDS } from '@/lib/constants/ghl';

const normalizeStage = (stageId: string): string => {
  return GHL_PIPELINE_IDS[stageId] ?? 'Unknown';
};

interface GHLMetricsGridProps {
  data: GHLData[];
  comparison?: GHLData[];
  showComparison?: boolean;
}

export const GHLPipelineGrid: React.FC<GHLMetricsGridProps> = ({
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

  const stageCount = buildStageCount(data);

  const stageCards = Array.from(stageCount.entries()).map(
    ([stageName, value]) => (
      <StatCard
        key={stageName}
        icon={<IconMessage size={28} />}
        title={stageName}
        value={
             `${value.toLocaleString()} | ${numberFormatter.format(
                (value / (data.length || 1)) * 100
              )}%`
        }
        color="#ffa94d"
      />
    )
  );

  const cards = stageCards.map((card, index) => (
    <Fragment key={index}>
      <Grid.Col span={colSpan}>{card}</Grid.Col>
    </Fragment>
  ));

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
      </Container>
    </>
  );
};
