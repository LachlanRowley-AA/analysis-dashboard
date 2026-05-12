import { NextResponse } from 'next/server';

const LOCATION_ID = process.env.LEADCONNECTOR_LOCATION_ID!;
const TOKEN = process.env.LEADCONNECTOR_TOKEN!;

/**
 * Fetch from LeadConnector API
 */
async function fetchFromGHLAPI(): Promise<any[]> {
  const urlParams = new URLSearchParams({
    locationId: LOCATION_ID,
  });
  const response = await fetch(
    `https://services.leadconnectorhq.com/funnels/funnel/list?${urlParams}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Version: '2023-02-21',
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      }
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
    // 2. Fetch fresh data
    const data = await fetchFromGHLAPI();
    console.log(`Fetched ${data.length} records from GHL API`);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GHL API error:', error);

    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}