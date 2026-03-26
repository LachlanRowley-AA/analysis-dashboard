import { describe, it, expect } from 'vitest'
import { transformOpportunities } from './ghlAPIParser'

describe('transformOpportunities', () => {
  it('maps basic fields', () => {
    const input = [
      {
        name: 'Test',
        monetaryValue: 1000,
        pipelineStageId: 'abc',
        lastStageChangeAt: '2026-01-01',
        createdAt: '2025-12-01',
        assignedTo: 'user1',
        customFields: []
      }
    ]

    const result = transformOpportunities(input, {})

    expect(result[0].name).toBe('Test')
    expect(result[0].value).toBe(1000)
  })
})
