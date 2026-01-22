import { start } from 'repl';
import { MetaAdsetData, GHLData } from '../../types/analytics';

export class AnalyticsApiService {

  static async fetchGHLFunded(): Promise<GHLData[]> {
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

  static async fetchGHLData(): Promise<GHLData[]> {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${origin}/api/GetGHLData`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.log(response.statusText, response.text)
      throw new Error('Failed to fetch GHL data');
    }

    const ghlData = await response.json();
    return ghlData.data ?? [];
  }

  static async fetchDateData(startDate?: Date, endDate?: Date, interval?: string): Promise<MetaAdsetData[]> {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.log("Skipping fetchDateData during production build");
      return [];
    }

    const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const startDateString = startDate ? startDate.toISOString().split('T')[0] : undefined;
    const endDateString = endDate ? endDate.toISOString().split('T')[0] : undefined;
    const response = await fetch(`${origin}/api/GetMetaMonthDailyData?startDateParam=${startDateString}&endDateParam=${endDateString}&increment=${interval}`, {
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