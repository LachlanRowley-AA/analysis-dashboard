import { AnalyticsData, MetaAdsetData, GHLData, ComparisonData } from '../../types/analytics';
import { ATO_TO_GHL_MAPPING } from '../constants/analytics';
import { AnalyticsTransformer } from '../transformers/analyticsTransformer';

export class AnalyticsProcessor {
  static createAdsetMap(adsetData: AnalyticsData[]): Map<string, AnalyticsData> {
    const map = new Map<string, AnalyticsData>();

    adsetData.forEach(adset => {
      const key = adset.metrics.metricName;
      if (key) {
        map.set(key, adset);
      }
    });

    return map;
  }

  static filterOpportunitiesByMonth(
    opportunities: GHLData[],
    startDate: Date,
    endDate: Date
  ): GHLData[] {
    return opportunities.filter(opp => {
      if (!opp.dateFunded) return false;
      const fundedDate = new Date(opp.dateFunded);
      return fundedDate >= startDate && fundedDate < endDate;
    });
  }

  static mapAdsetKey(adset: string): string {
    return ATO_TO_GHL_MAPPING[adset] ?? adset;
  }

  static attachGHLDataToAdsets(
    ghlData: GHLData[],
    adsetMap: Map<string, AnalyticsData>
  ): void {
    ghlData.forEach(opp => {
      const adsetKey = this.mapAdsetKey(opp.adset);
      adsetMap.get(adsetKey)?.ghlData?.push(opp);
    });
  }

  static buildComparisonData(
    currentAdsets: AnalyticsData[],
    lastMonthMap: Map<string, AnalyticsData>
  ): ComparisonData[] {
    return currentAdsets.map(current => {
      const key = current.metrics.metricName;
      const enhancedCurrent = AnalyticsTransformer.addGHLDataToAnalytics(current);
      const previous = key ? lastMonthMap.get(key) : undefined;

      return {
        current: enhancedCurrent,
        previous: previous ? AnalyticsTransformer.addGHLDataToAnalytics(previous) : undefined,
      };
    });
  }

  static buildMonthlyAnalytics(
    monthData: MetaAdsetData[],
    ghlData: GHLData[],
    metricName: string
  ): AnalyticsData {
    let analytics = AnalyticsTransformer.transformMetaData(monthData);
    analytics.ghlData = ghlData;
    analytics.metrics.metricName = metricName;
    return AnalyticsTransformer.addGHLDataToAnalytics(analytics);
  }

  static meta_adset_grouping: Record<string, string> = {
    "Advantage plus": "ATO",
    "Interest Targeting": "ATO",
    "ATO Custom Audience": "ATO",
    "ATO": "ATO",
    "Advantage plus - Ads with Abbie": "Machinery",
    "Machinery & Trucks Custom Audience": "Machinery",
    "Advantage plus - Machinery & trucks": "Machinery",
  };

  static filterByCategory(
    data: AnalyticsData[],
    group: string,
    grouping: Record<string, string>
  ): AnalyticsData[] {
    return data.filter(item => {
      const metricName = item.metrics.metricName;
      return metricName !== undefined && grouping[metricName] === group;
    });
  }


  static buildCategoryData(monthData: AnalyticsData[]) {
    const atoData = this.filterByCategory(monthData, 'ATO', this.meta_adset_grouping);
    const machineryData = this.filterByCategory(monthData, 'Machinery', this.meta_adset_grouping);

    return {
      ato: AnalyticsTransformer.transformMetaAnalyticsData(atoData),
      machinery: AnalyticsTransformer.transformMetaAnalyticsData(machineryData),
    };
  }
}