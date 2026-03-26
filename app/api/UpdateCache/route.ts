import { updateCacheData, getDateCached, updateGHLCache } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { mergeGHLIntoMeta } from "@/lib/utils/analytics-merger";
import { startOfDayInSydney, endOfDayInSydney, startOfMonthInSydney } from "@/lib/utils/aedt";

export async function GET() {
    const cachedDateStr = await getDateCached();
    const startDate = cachedDateStr ? startOfDayInSydney(new Date(cachedDateStr)) : startOfDayInSydney(new Date());
    const endDate = endOfDayInSydney(new Date());
    const startOfMonth = startOfMonthInSydney(startDate);

    let dailyMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");


    ///Get ghlData by funded after last cache date AND seperately by created after start of month
    //Will be filtered into after start day later
    let newGhlData = await AnalyticsApiService.fetchGHLData(startDate);
    let fundedGhlData = await AnalyticsApiService.fetchGHLFunded();

    console.log('new data ', newGhlData);

    // return;
    const fundedFilteredGHL = fundedGhlData.filter((item) => item.dateFunded && new Date(item.dateFunded) >= startOfMonth);
    const allGhlData = Array.from(
        new Map(
            newGhlData.concat(fundedFilteredGHL).map(item => [
                `${item.dateCreated}-${item.adset}`,
                item,
            ])
        ).values()
    );

    mergeGHLIntoMeta(dailyMetaData, allGhlData, startDate, true, true, false);
    // mergeGHLIntoMeta(fullMetaData, allGhlData, startOfMonth, true, false, false);

    // await updateCacheData(dailyMetaData, fullMetaData, startDate);
    // await updateGHLCache(allGhlData);

    console.log(dailyMetaData);

    const cachedDate = new Date().toISOString();

    return Response.json({
        dailyMetaData,
        fullMetaData,
        allGhlData,
        cachedDate,
    });
}
