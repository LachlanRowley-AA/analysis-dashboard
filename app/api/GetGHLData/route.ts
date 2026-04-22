import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { GHLData } from '@/app/lib/types';
import { getGHLDataFromCache, cacheGHLData } from '@/app/lib/cache/redisManager';

const LOCATION_ID = process.env.LEADCONNECTOR_LOCATION_ID!;
const TOKEN = process.env.LEADCONNECTOR_TOKEN!;

const PIPELINE_ID = 'mdwRTZqohMS3j6UOPAe0';
const PIPELINE_STAGE_ID = '3f6932c8-c391-4a13-ab7d-8efe4b29823e';

const CUSTOM_FIELD_IDS: Record<string, string> = {
  adset: '2j4KHgSJLwDR0N2CVjZG',
  ad: '6JfDmY5LXhDc2lDP5vXA',
  dateFunded: '4ZkP43R1IirhstWNcw4E',
};

/**
 * Cache read helper
 */
async function getCachedData(): Promise<GHLData[] | null> {
  const cached = await getGHLDataFromCache();

  if (cached) {
    console.log('GHL cache hit');
    return cached;
  }

  console.log('GHL cache miss');
  return null;
}

/**
 * Fetch from LeadConnector API
 */
async function fetchFromGHLAPI(): Promise<any[]> {
  const response = await fetch(
    'https://services.leadconnectorhq.com/opportunities/search',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Version: '2021-07-28',
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: LOCATION_ID,
        limit: 500,
        page: 0,
        query: '',
        additionalDetails: {
          notes: false,
          tasks: false,
          calendarEvents: false,
          unReadConversations: false,
        },
        filters: [
          {
            field: 'pipeline_id',
            operator: 'eq',
            value: PIPELINE_ID,
          },
          {
            field: 'pipeline_stage_id',
            operator: 'eq',
            value: PIPELINE_STAGE_ID,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`LeadConnector error: ${response.status}`);
  }

  const json = await response.json();
  return json.opportunities ?? [];
}

/**
 * Main API handler
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get('date');

    console.log('Request date param:', startDateParam);

    // 1. Try cache first
    const cached = await getCachedData();
    if (cached) {
      return NextResponse.json(cached);
    }

    // 2. Fetch fresh data
    const opportunities = await fetchFromGHLAPI();

    const rows: GHLData[] = opportunities.map((opp: any): GHLData => {
      const customLookup: Record<string, any> = {};
      for (const f of opp.customFields ?? []) {
        if (f.fieldValueString) {
          customLookup[f.id] = f.fieldValueString;
        }

        if (f.fieldValueDate) {
          const dt = DateTime
            .fromMillis(Number(f.fieldValueDate), { zone: 'utc' })
            .setZone('Australia/Sydney');

          customLookup[f.id] = dt.toFormat('yyyy-MM-dd');
        }
      }

      return {
        name: opp.name,
        value: opp.monetaryValue,
        stageId: opp.pipelineStageId,
        dateCreated: opp.createdAt,
        owner: opp.assignedTo,

        ad: customLookup[CUSTOM_FIELD_IDS.ad] ?? null,
        adset: customLookup[CUSTOM_FIELD_IDS.adset] ?? null,
        dateFunded: customLookup[CUSTOM_FIELD_IDS.dateFunded] ?? null,
      };
    });

    // 3. Cache result (IMPORTANT: await)
    await cacheGHLData(rows);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('GHL API error:', error);

    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}