//Called with ./GetGHLData?startDateParam={YYYY-MM-DD}

import { NextResponse } from 'next/server'

const LOCATION_ID = process.env.LEADCONNECTOR_LOCATION_ID!
const TOKEN = process.env.LEADCONNECTOR_TOKEN!

const PIPELINE_ID = 'mdwRTZqohMS3j6UOPAe0'
const PIPELINE_STAGE_ID = '3f6932c8-c391-4a13-ab7d-8efe4b29823e'

const CUSTOM_FIELD_IDS: Record<string, string> = {
  adset: '2j4KHgSJLwDR0N2CVjZG',
  ad: '6JfDmY5LXhDc2lDP5vXA',
  dateFunded: '4ZkP43R1IirhstWNcw4E',
}

const PAGE_CAP = 50

export async function GET(req: Request) {
  const APIurl = new URL(req.url);
  let startDateParam = APIurl.searchParams.get("startDateParam") ?? "";
  if (startDateParam) {
    const splitDate = startDateParam.split('-');
    startDateParam = `${splitDate[1]}-${splitDate[2]}-${splitDate[0]}`
  }
  try {
    let page = 0
    let allOpportunities: any[] = []

    while (page <= PAGE_CAP) {
      const url = `https://services.leadconnectorhq.com/opportunities/search`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Version: '2021-07-28',
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({
          locationId: `${LOCATION_ID}`,
          page: page,
          limit: 20,
        })
      })

      if (!response.ok) {
        throw new Error(`LeadConnector error: ${response.status}`)
      }

      const jsonData = await response.json()
      const opportunities = jsonData.opportunities ?? []

      if (opportunities.length === 0) {
        break
      }

      allOpportunities.push(...opportunities)
      page++
    }

    const rows = allOpportunities.map((opp: any) => {
      const row: Record<string, any> = {
        name: opp.name,
        value: opp.monetaryValue,
        stageId: opp.pipelineStageId,
        funded: opp.lastStageChangeAt,
        dateCreated: opp.createdAt,
        owner: opp.assignedTo
      }

      const customLookup: Record<string, any> = {}

      for (const f of opp.customFields ?? []) {
        if (f.fieldValueString) {
          customLookup[f.id] = f.fieldValueString
        } else if (f.fieldValueDate) {
          customLookup[f.id] = new Date(f.fieldValueDate)
        }
      }

      for (const [colName, fieldId] of Object.entries(CUSTOM_FIELD_IDS)) {
        row[colName] = customLookup[fieldId] ?? null
      }

      return row
    })

    return NextResponse.json({
      count: rows.length,
      data: rows,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
