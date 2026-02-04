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
  active?: boolean;
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

export function createBlankMetaAdsetData(adsetName: string, date? : Date): MetaAdsetData {
  return {
    date: date ? new Date(date) : new Date(),
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
  dateCreated: string;
  owner?: string;
}