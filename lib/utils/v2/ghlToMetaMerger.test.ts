import { describe, it, expect } from 'vitest'
import { dayKey } from './ghlToMetaMerger'

describe('dayKey', () => {
    it('pulls dayKey from Meta correctly', () => {
        const mInput = {
            "date": "2026-02-09T00:00:00.000Z",
            "adsetName": "Advantage plus",
            "reach": 3926,
            "amountSpent": 335.71,
            "linkClicks": 50,
            "landingPageView": 44,
            "lead": 24,
            "frequency": 1.490066,
            "cost_per_lead": 37.3,
            "impressions": 5850,
            "ctr": 0.85,
            "conversions": 0,
            "conversionValue": 0,
            "cpm": 57.386325
        }
        const result = dayKey(new Date(mInput.date))
        expect(result).toBe("2026-02-09")

        const ghlInput = {
            "name": "Stephen Young",
            "value": 0,
            "stageId": "3d4be6e3-ea30-4dbf-8dcc-ed4dcca14142",
            "funded": "2026-02-14T03:51:29.739Z",
            "dateCreated": "2026-02-14T03:50:40.920Z",
            "owner": "y81EGLBUhdnuHW4lDoPs",
            "adset": "ATO A+",
            "ad": "ATO Coming After Businesses",
            "dateFunded": null
        }
        const gResult = dayKey(new Date(ghlInput.dateCreated))
        expect(gResult).toBe("2026-02-14")

        const gInputTwo = {
            "name": "Emily Nichols", "value": 0, 
            "stageId": "3d4be6e3-ea30-4dbf-8dcc-ed4dcca14142", 
            "funded": "2026-02-13T21:02:17.100Z", 
            "dateCreated": "2026-02-13T21:01:00.091Z", 
            "owner": "nvZ9RG8XCllPKeGbpxR8", 
            "adset": "ATO Interest Targeting", 
            "ad": "ATO Coming After Businesses", 
            "dateFunded": null
        }
        const gResult2 = dayKey(new Date(gInputTwo.dateCreated))
        expect(gResult2).toBe('2026-02-14')
    })
})