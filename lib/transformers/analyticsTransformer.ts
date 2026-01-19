import { MetaAdsetData, AnalyticsData, GHLData } from '../../types/analytics';
import { getWeekStart } from '../utils/dateUtils';

export class AnalyticsTransformer {
  static transformMetaData(data: MetaAdsetData[]): AnalyticsData {
    const totalReach = data.reduce((sum, item) => sum + item.reach, 0);
    const totalLeads = data.reduce((sum, item) => sum + item.lead, 0);
    const totalSpent = data.reduce((sum, item) => sum + item.amountSpent, 0);
    const totalConversions = data.reduce((sum, item) => sum + item.conversions, 0);
    const totalConversionValue = data.reduce((sum, item) => sum + item.conversionValue, 0);
    const totalLinkClicks = data.reduce((sum, item) => sum + item.linkClicks, 0);

    const avgCPL = totalLeads ? totalSpent / totalLeads : 0;
    const avgCPA = totalConversions ? totalSpent / totalConversions : 0;
    const avgCTR = totalReach ? (totalLinkClicks / totalReach) * 100 : 0;

    const timeSeries = this.groupByWeek(data);
    const frequency = totalLeads > 0 ? data.reduce((sum, item) => sum + item.frequency, 0) / data.length : 0;

    return {
      metrics: {
        totalSpent,
        totalReach,
        totalLeads,
        totalConversions,
        pipelineValue: totalConversionValue,
        conversionRate: totalReach > 0 ? (totalLeads / totalReach) * 100 : 0,
        engagementRate: totalReach > 0 ? (totalLinkClicks / totalReach) * 100 : 0,
        avgCPA,
        avgCPL,
        avgCTR,
        avgCPM: totalReach > 0 ? (totalSpent / totalReach) * 1000 : 0,
        totalLinkClicks,
        frequency,
      },
      timeSeries,
      contactsByStatus: this.generateContactsByStatus(totalLeads, totalConversions),
      pipelineByStage: this.generatePipelineByStage(totalConversionValue),
      ghlData: []
    };
  }

  static transformMetaAnalyticsData(data: AnalyticsData[]): AnalyticsData {
    const totalReach = data.reduce((sum, item) => sum + item.metrics.totalReach, 0);
    const totalLeads = data.reduce((sum, item) => sum + item.metrics.totalLeads, 0);
    const totalSpent = data.reduce((sum, item) => sum + item.metrics.totalSpent, 0);
    const totalConversions = data.reduce((sum, item) => sum + item.metrics.totalConversions, 0);
    const totalLinkClicks = data.reduce((sum, item) => sum + item.metrics.totalLinkClicks, 0);

    const avgCPL = totalLeads ? totalSpent / totalLeads : 0;
    const avgCPA = totalConversions ? totalSpent / totalConversions : 0;
    const avgCTR = totalReach ? (totalLinkClicks / totalReach) * 100 : 0;

    // const timeSeries = this.groupByWeek(data.metrics).flatMap(item => item.timeSeries);
    const frequency = totalLeads > 0 ? data.reduce((sum, item) => sum + item.metrics.frequency, 0) / data.length : 0;
    const ghlData: GHLData[] = data.flatMap(item => item.ghlData);
    const totalConversionValue = ghlData.reduce((sum, item) => sum + item.value, 0);

    return {
      metrics: {
        totalSpent,
        totalReach,
        totalLeads,
        totalConversions,
        pipelineValue: totalConversionValue,
        conversionRate: totalReach > 0 ? (totalLeads / totalReach) * 100 : 0,
        engagementRate: totalReach > 0 ? (totalLinkClicks / totalReach) * 100 : 0,
        avgCPA,
        avgCPL,
        avgCTR,
        avgCPM: totalReach > 0 ? (totalSpent / totalReach) * 1000 : 0,
        totalLinkClicks,
        frequency,
      },
      timeSeries: [],
      contactsByStatus: this.generateContactsByStatus(totalLeads, totalConversions),
      pipelineByStage: this.generatePipelineByStage(totalConversionValue),
      ghlData
    };
  }


  private static groupByWeek(data: MetaAdsetData[]) {
    const weeklyData = new Map<string, {
      reach: number;
      engagement: number;
      contacts: number;
      leads: number;
    }>();

    data.forEach(item => {
      const weekKey = getWeekStart(new Date(item.date));

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { reach: 0, engagement: 0, contacts: 0, leads: 0 });
      }

      const week = weeklyData.get(weekKey)!;
      week.reach += item.reach;
      week.engagement += item.linkClicks;
      week.contacts += item.landingPageView;
      week.leads += item.lead;
    });

    return Array.from(weeklyData.entries()).map(([date, values]) => ({
      date,
      ...values
    }));
  }

  private static generateContactsByStatus(totalLeads: number, totalConversions: number) {
    return [
      { status: 'New', count: Math.floor(totalLeads * 0.25) },
      { status: 'Contacted', count: Math.floor(totalLeads * 0.4) },
      { status: 'Qualified', count: Math.floor(totalLeads * 0.25) },
      { status: 'Converted', count: Math.floor(totalConversions) },
    ];
  }

  private static generatePipelineByStage(totalConversionValue: number) {
    return [
      { stage: 'Lead', value: Math.floor(totalConversionValue * 0.15) },
      { stage: 'Qualified', value: Math.floor(totalConversionValue * 0.25) },
      { stage: 'Proposal', value: Math.floor(totalConversionValue * 0.30) },
      { stage: 'Closed', value: Math.floor(totalConversionValue * 0.30) },
    ];
  }

  static transformAdsetData(data: MetaAdsetData[]): AnalyticsData[] {
    return data.map(item => {
      const transformed = this.transformMetaData([item]);
      transformed.metrics.metricName = item.adsetName;
      return transformed;
    });
  }

  static addGHLDataToAnalytics(analytics: AnalyticsData): AnalyticsData {
    analytics.metrics.pipelineValue = 0;

    if (analytics.ghlData) {
      for (let i = 0; i < analytics.ghlData.length; i++) {
        analytics.metrics.pipelineValue += analytics.ghlData[i].value;
      }
      analytics.metrics.avgCPA = analytics.ghlData.length > 0
        ? analytics.metrics.totalSpent / analytics.ghlData.length
        : 0;
    }

    return analytics;
  }
}