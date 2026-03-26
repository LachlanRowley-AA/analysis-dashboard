import { describe, it, expect } from 'vitest'
import { transformMeta } from './metaAPIParser'

describe('transformMeta', () => {
  it('calculates ctr and cost_per_lead correctly', () => {
    const input = [
      {
        date_start: '2026-02-01',
        adset_name: 'Test Adset',
        reach: '100',
        spend: '200',
        impressions: '1000',
        frequency: '1.5',
        cpm: '20',
        actions: [
          { action_type: 'link_click', value: '50' },
          { action_type: 'lead', value: '10' },
          { action_type: 'landing_page_view', value: '30' },
        ],
      },
    ]

    const result = transformMeta(input)

    expect(result[0].linkClicks).toBe(50)
    expect(result[0].lead).toBe(10)
    expect(result[0].cost_per_lead).toBe(20) // 200 / 10
    expect(result[0].ctr).toBe(5) // 50 / 1000 * 100
  })

  it('handles zero leads safely', () => {
    const input = [
      {
        date_start: '2026-02-01',
        adset_name: 'Test',
        spend: '100',
        impressions: '1000',
        actions: [],
      },
    ]

    const result = transformMeta(input)

    expect(result[0].cost_per_lead).toBe(0)
  })

  it('sorts by date then adset name', () => {
    const input = [
      { date_start: '2026-02-02', adset_name: 'B' },
      { date_start: '2026-02-01', adset_name: 'A' },
    ]

    const result = transformMeta(input)

    expect(result[0].adsetName).toBe('A')
  })
})
