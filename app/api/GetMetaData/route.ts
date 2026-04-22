export const runtime = 'nodejs'

import { AdSetMetric } from "@/app/lib/types";
import { getAdsetDataFromCache, cacheAdsetData } from "@/app/lib/cache/redisManager";

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!
const AD_ACCOUNT_ID = `act_${process.env.META_AD_ACCOUNT_ID}`
const API_VERSION = 'v24.0'

const getActionValue = (actions: any, actionType: string): number => {
  if (Array.isArray(actions)) {
    const match = actions.find((a) => a.action_type === actionType)
    return Number(match?.value ?? 0)
  }
  return 0
}

interface QueryParams {
  startDate: string
  endDate: string
  increment: string
}

async function checkCache(): Promise<AdSetMetric[] | null> {
  const cached = await getAdsetDataFromCache()

  if (cached) {
    console.log('Cache hit')
    return cached
  }
  return null
}

async function fetchFromMetaAPI(params: QueryParams): Promise<AdSetMetric[]> {
  const timeRange = {
    since: params.startDate,
    until: params.endDate,
  }

  let url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights`

  let queryParams: Record<string, string> | null = {
    fields: 'ad_name,adset_name,date_start,reach,spend,actions,video_p25_watched_actions,frequency,impressions,outbound_clicks_ctr,cpm,action_values',
    access_token: ACCESS_TOKEN,
    time_increment: params.increment,
    time_range: JSON.stringify(timeRange),
    level: 'adset',
  }

  const allInsights: any[] = []

  while (url) {
    const query = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(url + query, { signal: controller.signal })
    clearTimeout(timeout)

    const data = await response.json()

    if (data.error) throw new Error(JSON.stringify(data.error))

    allInsights.push(...(data.data ?? []))
    url = data.paging?.next ?? null
    queryParams = null
  }

  if (allInsights.length === 0) return []

  return allInsights
    .map((row): AdSetMetric => {
      const reach = Number(row.reach ?? 0)
      const amountSpent = Number(row.spend ?? 0)
      const impressions = Number(row.impressions ?? 0)
      const linkClicks = getActionValue(row.actions, 'link_click')
      const leads = getActionValue(row.actions, 'lead')

      return {
        date: new Date(row.date_start),
        adsetName: row.adset_name ?? '',
        reach,
        amountSpent: Number(amountSpent.toFixed(2)),
        linkClicks,
        landingPageView: getActionValue(row.actions, 'landing_page_view'),
        lead: leads,
        frequency: Number(row.frequency ?? 0),
        cost_per_lead: leads ? Number((amountSpent / leads).toFixed(2)) : 0,
        impressions,
        ctr: impressions ? Number(((linkClicks / impressions) * 100).toFixed(2)) : 0,
        conversions: 0,
        conversionValue: 0,
        cpm: Number(row.cpm ?? 0),
      }
    })
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime() ||
        a.adsetName.localeCompare(b.adsetName)
    )
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const endDateParam = url.searchParams.get('endDateParam')
    const startDateParam = url.searchParams.get('startDateParam')
    const increment = url.searchParams.get('increment') ?? '1'

    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    const params: QueryParams = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      increment,
    }

    const cached = await checkCache()
    if (cached) return Response.json(cached)

    const data = await fetchFromMetaAPI(params)
    await cacheAdsetData(data)

    return Response.json(data)
  } catch (err: any) {
    console.error('Meta insights error:', err)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch Meta insights', message: err.message }),
      { status: 500 }
    )
  }
}