import { AdSetMetric } from '@/app/lib/types';

export function hydrateAdSetMetrics(data: AdSetMetric[]): AdSetMetric[] {
  if (!data || data.length === 0) return []
    return data.map(item => ({
        ...item,
        date: typeof item.date === 'string' ? new Date(item.date) : item.date
    }))
}