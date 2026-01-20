import { useState } from 'react';
import { Grid, Switch, Group, Text } from '@mantine/core';
import { StatCard } from './StatCard';
import { AnalyticsData, MetaAdsetData, MetricData } from '../types/analytics';
import {
  IconTrendingUp
} from '@tabler/icons-react';
import { numberFormatter } from '@/lib/formatter';
import { metaAdsetGrouping, LTV_VALUES } from '@/lib/constants/analytics';

interface LTVCostProps {
  data: MetaAdsetData[];
  comparison?: MetaAdsetData[];
  showComparison?: boolean;
  currentCost: number;
  priorCost?: number;
}

const calculateLTV = (data: MetaAdsetData[]): number => {
  const dataLTV = data.map(item => {
    const category = metaAdsetGrouping[item.adsetName];
    if (category === "ATO") {
      return LTV_VALUES["ATO"] * item.conversions;
    } else if (category === "Machinery") {
      return LTV_VALUES["Machinery"] * item.conversions;
    }
    return 0;
  })
  return dataLTV.reduce((sum, val) => sum + val, 0);
}

export const LTVCost: React.FC<LTVCostProps> = ({ data, comparison, showComparison = false, currentCost, priorCost }) => {
  const [showAbsolute, setShowAbsolute] = useState(false);


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
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    }
  };

  const current = calculateLTV(data) / currentCost;
  const prior = comparison && priorCost ? calculateLTV(comparison) / priorCost : undefined;

  return (
    <>
      <StatCard
        icon={<IconTrendingUp size={28} />}
        title="LTV to CtA"
        value={`${numberFormatter.format(current)}`}
        change={calculateChange(current, prior, true)}
        priorValue={comparison ? `${numberFormatter.format(prior ? prior : 0)}` : undefined}
        color="#40c057"
      />
    </>
  );
};