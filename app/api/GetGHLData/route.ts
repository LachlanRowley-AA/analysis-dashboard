import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { GHLData } from '@/app/lib/types';
import { getGHLDataFromCache, cacheGHLData } from '@/app/lib/cache/redisManager';

const LOCATION_ID = process.env.LEADCONNECTOR_LOCATION_ID!;
const TOKEN = process.env.LEADCONNECTOR_TOKEN!;
const PIPELINE_ID = 'mdwRTZqohMS3j6UOPAe0';
const PAGE_LIMIT = 100;

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
 * Fetch a single page from LeadConnector API
 */
async function fetchPage(page: number): Promise<{ opportunities: any[]; total: number }> {
  const response = await fetch(
    'https://services.leadconnectorhq.com/opportunities/search',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Version: '2023-02-21',
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locationId: LOCATION_ID,
        limit: PAGE_LIMIT,
        page,
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
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`LeadConnector error: ${response.status} (page ${page})`);
  }

  const json = await response.json();
  return {
    opportunities: json.opportunities ?? [],
    total: json.meta?.total ?? json.total ?? 0,
  };
}

/**
 * Fetch all pages from LeadConnector API
 */
async function fetchFromGHLAPI(): Promise<any[]> {
  const all: any[] = [];

  // Fetch first page to get total count
  const first = await fetchPage(1);
  all.push(...first.opportunities);

  const totalPages = Math.ceil(first.total / PAGE_LIMIT);
  console.log(`GHL: fetched page 1/${totalPages} (${first.total} total records)`);

  if (totalPages > 1) {
    // Fetch remaining pages concurrently
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) => fetchPage(i + 2));
    const results = await Promise.all(remaining);

    for (const result of results) {
      all.push(...result.opportunities);
    }

    console.log(`GHL: fetched all ${totalPages} pages (${all.length} records)`);
  }

  return all;
}

/**
 * Map a raw GHL opportunity to a GHLData row
 */
function mapOpportunity(opp: any): GHLData {
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
}

/**
 * Main API handler
 */
export async function GET(req: Request) {
  try {
    // 1. Try cache first
    const cached = await getCachedData();
    if (cached) {
      return NextResponse.json(cached);
    }

    // 2. Fetch all pages
    const opportunities = await fetchFromGHLAPI();
    const rows: GHLData[] = opportunities.map(mapOpportunity);

    // 3. Cache result
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