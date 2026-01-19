import { start } from 'repl';
import { MetaAdsetData, GHLData } from '../../types/analytics';

export class AnalyticsApiService {

  static async fetchGHLData(): Promise<GHLData[]> {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${origin}/api/GetGHLFunded`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GHL data');
    }

    const ghlData = await response.json();
    return ghlData.data ?? [];
  }

  static async fetchDateData(startDate?: Date, endDate?: Date): Promise<MetaAdsetData[]> {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }

    const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const startDateString = startDate ? startDate.toISOString().split('T')[0] : undefined;
    const endDateString = endDate ? endDate.toISOString().split('T')[0] : undefined;
    const response = await fetch(`${origin}/api/GetMetaMonthDailyData?startDateParam=${startDateString}&endDateParam=${endDateString}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data' + response.statusText);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      date: new Date(item.date),
    }));
  }
}