import { getCachedData, cacheData, getFullCachedData, getDateCached, getCachedGHLData, cacheGHLData } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { mergeGHLIntoMeta } from "@/lib/utils/analytics-merger";
import { startOfMonthOffsetInSydney, addDaysInSydney, parseDateOnlyInAEDT } from "@/lib/utils/aedt";


export async function GET() {
    try {
        let ghlData = await getCachedGHLData();
        if (!(ghlData.length > 0)) {
            ghlData = await AnalyticsApiService.fetchGHLData();
            await cacheGHLData(ghlData);
        }
        const cached = await getCachedData();
        const fullCachedData = await getFullCachedData();


        const date = await getDateCached();
        if (cached.length > 0 && fullCachedData.length > 0) {
            return Response.json({ fetchedMetaData: cached, fullMetaData: fullCachedData, cachedDate: date, ghlData, cached: true });
        }

        const MONTHS_TO_FETCH = 2;
        const startDate = startOfMonthOffsetInSydney(-(MONTHS_TO_FETCH - 1));
        const endDate = addDaysInSydney(new Date(), 1);

        // First date of adset data (Australia/Sydney)
        const ADSET_START = parseDateOnlyInAEDT("2025-08-08");

        let fetchedMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
        let fullMetaData = await AnalyticsApiService.fetchDateData(ADSET_START, endDate, "31");

        mergeGHLIntoMeta(fetchedMetaData, ghlData, undefined, true, true, false);
        mergeGHLIntoMeta(fullMetaData, ghlData, undefined, true, false);


        const cachedDate = new Date().toISOString();
        await cacheData(fetchedMetaData, fullMetaData);
        const payload = {
            fetchedMetaData,
            fullMetaData,
            cachedDate,
            ghlData
        };
        return Response.json(payload);
    } catch (error) {
        console.error("Error in /api/Analytics GET handler:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}