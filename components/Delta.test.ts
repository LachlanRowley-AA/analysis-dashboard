import { describe, it, expect } from "vitest";
import { Delta, calcDeltaEfficiency } from "./Delta";

describe('calcDeltaLeadEfficiency', () => {
    it('calculates 100% lead efficiency', () => {
        const priorLeads = 10
        const priorSpend = 100
        const currentLeads = 11
        const currentSpend = 110

        let result = calcDeltaEfficiency(currentLeads, currentSpend, priorLeads, priorSpend)
        expect(result).toBe(100);
    })
    it('calculates <100% lead efficiency', () => {
        const priorLeads = 10
        const priorSpend = 100
        const currentLeads = 15
        const currentSpend = 200

        let result = calcDeltaEfficiency(currentLeads, currentSpend, priorLeads, priorSpend)
        expect(result).toBe(50);
    })
    it('calculates >100% lead efficiency', () => {
        const priorLeads = 10
        const priorSpend = 100
        const currentLeads = 30
        const currentSpend = 200

        let result = calcDeltaEfficiency(currentLeads, currentSpend, priorLeads, priorSpend)
        expect(result).toBe(200);
    })
    it('calculates lead efficiency when spend decreases', () => {
        const priorLeads = 10
        const priorSpend = 100
        const currentLeads = 8
        const currentSpend = 40

        let result = calcDeltaEfficiency(currentLeads, currentSpend, priorLeads, priorSpend)
        expect(result).toBe(200);
    })
    it('calculates lead efficiency when spend decreases', () => {
        const priorLeads = 20
        const priorSpend = 200
        const currentLeads = 5
        const currentSpend = 100

        let result = calcDeltaEfficiency(currentLeads, currentSpend, priorLeads, priorSpend)
        expect(result).toBe(50);
    })
})
