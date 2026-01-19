import { AnalyticsData } from '../../types/analytics';

export const getCombinedTimeSeries = (
  data1: AnalyticsData,
  data2: AnalyticsData,
  key: keyof AnalyticsData['timeSeries'][0]
) => {
  return data1.timeSeries.map((item, index) => ({
    date: item.date,
    category1: item[key],
    category2: data2.timeSeries[index][key],
  }));
};