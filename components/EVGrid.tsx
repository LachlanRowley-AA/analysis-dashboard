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
import { useAnalytics } from './DataStorageContext';
import { LTVCost } from './LTVCtAC';
import { Fragment } from 'react';

interface EVGridProps {
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

export const EVGrid: React.FC<EVGridProps> = ({ data, comparison, showComparison = false, dataArr, comparisonArr }) => {
  const [showAbsolute, setShowAbsolute] = useState(false);
  const fullData: MetaAdsetData[] = useAnalytics().metaData;

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
  const colSpan = useMatches({
    base: 12,
    sm: 6,
    md: 4,
    lg: 3,
  })

  const StatCards = [
    <StatCard
      key={'lead_ev'}
      icon={<IconMessage size={28} />}
      title="Lead EV (net)"
      value={data.lead > 0 ? 
        data.conversionValue > 0 ? `$${numberFormatter.format((data.conversionValue - data.amountSpent) / data.lead)}` : "$0" 
      : "No leads"}
      change={calculateChange(data.amountSpent / data.lead, comparison ? comparison.amountSpent / comparison.lead : undefined, true)}
      priorValue={comparison ? `$${numberFormatter.format(comparison.amountSpent / comparison.lead)}` : undefined}
      color="#40c057"
      lowerBetter
    />,
    // <StatCard
    //   key={'leads'}
    //   icon={<IconUserPlus size={28} />}
    //   title="Total Leads"
    //   value={data.lead.toLocaleString()}
    //   change={calculateChange(data.lead, comparison?.lead)}
    //   priorValue={comparison ? comparison.lead.toLocaleString() : undefined}
    //   color="#7950f2"
    // />,
    // <StatCard
    //   key={'cta'}
    //   icon={<IconTrendingUp size={28} />}
    //   title="Cost Per Acquisition"
    //   value={data.conversions != 0 ? `$${numberFormatter.format(data.amountSpent / data.conversions)}` : "No conversions"}
    //   change={calculateChange(data.amountSpent / data.conversions, comparison ? comparison?.amountSpent / comparison?.conversions : 0, true)}
    //   lowerBetter
    //   color="#f06595"
    //   priorValue={comparison ? `$${numberFormatter.format(comparison.amountSpent / comparison.conversions)}` : undefined}
    // />,
    // <StatCard
    //   key={'conversionValue'}
    //   icon={<IconCurrencyDollar size={28} />}
    //   title="Conversion Value"
    //   value={`$${numberFormatter.format(data.conversionValue)}`}
    //   change={calculateChange(data.conversionValue, comparison?.conversionValue, true)}
    //   priorValue={comparison ? `$${numberFormatter.format(comparison.conversionValue)}` : undefined}
    //   color="#fd7e14"
    //   lowerBetter={false}
    // />,
    // <StatCard
    //   key={'cpm'}
    //   icon={<IconPercentage size={28} />}
    //   title="Cost Per Mille"
    //   value={`$${numberFormatter.format(data.cpm)}`}
    //   change={calculateChange(data.cpm, comparison?.cpm, true)}
    //   priorValue={comparison ? `$${numberFormatter.format(comparison.cpm)}` : undefined}
    //   color="#20c997"
    //   lowerBetter
    // />,
    // <StatCard
    //   key={'amountSpent'}
    //   icon={<IconChartLine size={28} />}
    //   title="Amount Spent"
    //   value={`$${numberFormatter.format(data.amountSpent)}`}
    //   change={calculateChange(data.amountSpent, comparison?.amountSpent, true)}
    //   color="#ffa94d"
    //   priorValue={comparison ? `$${numberFormatter.format(comparison.amountSpent)}` : undefined}
    //   neutral
    // />,
    // <StatCard
    //   key={'ctr'}
    //   icon={<IconCoin size={28} />}
    //   title="Click Through Rate"
    //   value={`${numberFormatter.format(data.ctr)}%`}
    //   change={calculateChange(data.ctr, comparison?.ctr)}
    //   color="#51cf66"
    //   priorValue={comparison ? `${numberFormatter.format(comparison.ctr)}%` : undefined}
    // />,
    // <StatCard
    //   key={'frequency'}
    //   icon={<IconUsers size={28} />}
    //   title="Frequency"
    //   value={data.frequency.toLocaleString()}
    //   change={calculateChange(data.frequency, comparison?.frequency)}
    //   priorValue={comparison ? comparison.frequency.toLocaleString() : undefined}
    //   color="#228be6"
    //   lowerBetter
    // />,
    // <StatCard
    //   key={'roas'}
    //   icon={<IconUsers size={28} />}
    //   title="Return on Ad Spend"
    //   value={(data.conversionValue / data.amountSpent).toFixed(2)}
    //   change={calculateChange((data.conversionValue / data.amountSpent), (comparison?.conversionValue ? comparison?.conversionValue / comparison?.amountSpent : 0))}
    //   priorValue={comparison ? (comparison.conversionValue / comparison.amountSpent).toLocaleString() : undefined}
    //   color="#228be6"
    // />,
    // <LTVGrid
    //   key={'ltv'}
    //   data={dataArr ? dataArr : fullData}
    //   comparison={comparisonArr ?? fullData}
    //   showComparison={true}
    // />,
    // <LTVCost
    //   key={'ltvCta'}
    //   data={dataArr ? dataArr : fullData}
    //   comparison={comparisonArr ?? fullData}
    //   showComparison={true}
    //   currentCost={data.amountSpent}
    //   priorCost={comparison ? comparison.amountSpent : 0}
    // />,
    // <StatCard
    //   key={'Conversions'}
    //   icon={<IconUsers size={28} />}
    //   title="Num Conversions"
    //   value={(data.conversions.toString())}
    //   change={calculateChange((data.conversions), (comparison?.conversions ? comparison?.conversions : 0))}
    //   priorValue={comparison ? comparison.conversions.toString() : undefined}
    //   color="#228be6"
    // />,
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
        >
          {card}
        </Grid.Col>
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