export interface MetricData {
  metricName?: string;
  totalSpent: number;
  totalReach: number;
  totalLeads: number;
  totalConversions: number;
  pipelineValue: number;
  conversionRate: number;
  engagementRate: number;
  avgCPL: number;
  avgCPA: number;
  avgCTR: number;
  avgCPM: number;
  totalLinkClicks: number;
  frequency: number;
}

export interface TimeSeriesData {
  date: string;
  reach: number;
  engagement: number;
  contacts: number;
  leads: number;
}

export interface AnalyticsData {
  metrics: MetricData
  timeSeries: Array<{
    date: string;
    reach: number;
    engagement: number;
    contacts: number;
    leads: number;
  }>;
  contactsByStatus: Array<{ status: string; count: number }>;
  pipelineByStage: Array<{ stage: string; value: number }>;
  ghlData: Array<GHLData>;
}

export interface ComparisonData {
  current: AnalyticsData;
  previous?: AnalyticsData;
}

export interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  priorValue?: string;
  change?: string;
  color: string;
  lowerBetter?: boolean;
  neutral?: boolean;
  onClick?: () => void,

}

export interface MetaAdsetData {
  date: Date;
  adsetName: string;
  reach: number;
  amountSpent: number;
  linkClicks: number;
  landingPageView: number;
  lead: number;
  frequency: number;
  costPerLead: number;
  impressions: number;
  ctr: number;
  conversions: number;
  conversionValue: number;
  cpm: number;
}

export function createBlankMetaAdsetData(adsetName: string): MetaAdsetData {
  return {
    date: new Date(),
    adsetName,
    reach: 0,
    amountSpent: 0,
    linkClicks: 0,
    landingPageView: 0,
    lead: 0,
    frequency: 0,
    costPerLead: 0,
    impressions: 0,
    ctr: 0,
    conversions: 0,
    conversionValue: 0,
    cpm: 0,
  };
}

export interface GHLData {
  name: string;
  value: number;
  ad: string;
  adset: string;
  dateFunded: string;
  stageId: string;
}

export interface CategoryData {
  ato: AnalyticsData;
  machinery: AnalyticsData;
}