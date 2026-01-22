export const runtime = 'nodejs'

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!
const AD_ACCOUNT_ID = `act_${process.env.META_AD_ACCOUNT_ID}`
const API_VERSION = 'v24.0'

const formatDateLocal = (date: Date) =>
  date.getFullYear() +
  '-' +
  String(date.getMonth() + 1).padStart(2, '0') +
  '-' +
  String(date.getDate()).padStart(2, '0')

// Helper: extract action value
const getActionValue = (actions: any, actionType: string): number => {
  if (Array.isArray(actions)) {
    const match = actions.find(
      (a) => a.action_type === actionType
    )
    return Number(match?.value ?? 0)
  }
  return 0
}

export async function GET(req: Request) {
  try {
    // Dates
    const APIurl = new URL(req.url);
    const endDateParam = APIurl.searchParams.get('endDateParam');
    const startDateParam = APIurl.searchParams.get('startDateParam');
    const increment = APIurl.searchParams.get('increment') ? APIurl.searchParams.get('increment') : '1';
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    const timeRange = {
      since: formatDateLocal(startDate),
      until: formatDateLocal(endDate),
    }

    let url = `https://graph.facebook.com/${API_VERSION}/${AD_ACCOUNT_ID}/insights`

    let params: Record<string, string> | null = {
      fields:
        'ad_name,adset_name,date_start,reach,spend,actions,video_p25_watched_actions,frequency,impressions,outbound_clicks_ctr,cpm,action_values',
      access_token: ACCESS_TOKEN,
      time_increment: increment ? increment.toString() : '1',
      time_range: JSON.stringify(timeRange),
      level: 'adset',
    }

    const allInsights: any[] = []

    while (url) {
      const query = params
        ? `?${new URLSearchParams(params).toString()}`
        : ''

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10_000)

      const response = await fetch(url + query, {
        signal: controller.signal,
      })

      clearTimeout(timeout)

      const data = await response.json()

      if (data.error) {
        throw new Error(JSON.stringify(data.error))
      }

      allInsights.push(...(data.data ?? []))

      url = data.paging?.next ?? null
      params = null
    }

    const df =
      allInsights.length > 0
        ? allInsights
            .map((row) => {
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
                landingPageView: getActionValue(
                  row.actions,
                  'landing_page_view'
                ),
                lead: leads,
                frequency: Number(row.frequency ?? 0),

                cost_per_lead: leads
                  ? Number((amountSpent / leads).toFixed(2))
                  : 0,

                impressions,

                ctr: impressions
                  ? Number(((linkClicks / impressions) * 100).toFixed(2))
                  : 0,
                //Set to 0 and overwrite using GHL data
                conversions: 0,
                conversionValue: 0,

                cpm: Number(row.cpm ?? 0),
              }
            })
            .sort(
              (a, b) =>
                a.date.getTime() - b.date.getTime() ||
                a.adsetName.localeCompare(b.adsetName)
            )
        : []

    return Response.json(df)
  } catch (err: any) {
    console.error('Meta insights error:', err)

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Meta insights',
        message: err.message,
      }),
      { status: 500 }
    )
  }
}
