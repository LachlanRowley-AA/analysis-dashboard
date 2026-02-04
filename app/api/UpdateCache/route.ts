import { updateCacheData, getDateCached } from "@/lib/cache/redisManager";
import { AnalyticsApiService } from "@/lib/services/api";
import { ATO_TO_GHL_MAPPING } from "@/lib/constants/analytics";
import { createBlankMetaAdsetData } from "@/types/analytics";

/**
 * Helpers to normalise date keys
 */
const dayKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

const monthKey = (date: Date) =>
    `${date.getUTCFullYear()}-${date.getUTCMonth()}`;

export async function GET() {
    const startDate = new Date(await getDateCached());

    const endDate = new Date();
    const startOfMonth = new Date(startDate);
    startOfMonth.setDate(1);

    let dailyMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "1");
    let fullMetaData = await AnalyticsApiService.fetchDateData(startDate, endDate, "31");
    let ghlData = await AnalyticsApiService.fetchGHLFunded();

    const dayFilteredGHL = ghlData.filter(item => new Date(item.dateFunded) >= startDate);
    const monthFilteredGHL = ghlData.filter(item => new Date(item.dateFunded) >= startOfMonth);

    const dailyMetaMap = new Map<string, any>();
    const monthlyMetaMap = new Map<string, any>();


    //Initialize maps
    for (const metaItem of fullMetaData) {
        const key = `${monthKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        metaItem.conversions = 0;
        metaItem.conversionValue = 0;
        monthlyMetaMap.set(key, metaItem);
    }

    for (const metaItem of dailyMetaData) {
        const key = `${dayKey(metaItem.date)}_${ATO_TO_GHL_MAPPING[metaItem.adsetName]}`;
        // console.log('monthly adjustment count', monthAdjustmentCount)

        //Remove cached data from same day --> Stop duplicate counting from partial day
        metaItem.conversions = 0;
        metaItem.conversionValue = 0;
        dailyMetaMap.set(key, metaItem);
    }


    //Monthly data already caught by same day update
    let monthAdjustmentCount = 0
    let monthAdjustmentValue = 0



    for (const ghlItem of dayFilteredGHL) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${dayKey(date)}_${ghlItem.adset}`;
        const metaItem = dailyMetaMap.get(key);
        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
        } else {
            const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
            newMetaItem.date = date;
            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            dailyMetaData.push(newMetaItem);
        }
    }

    console.log("mf: ", monthFilteredGHL)

    for (const ghlItem of monthFilteredGHL) {
        const date = new Date(ghlItem.dateFunded);
        const key = `${monthKey(date)}_${ghlItem.adset}`;
        const metaItem = monthlyMetaMap.get(key);

        if (metaItem) {
            metaItem.conversions += 1;
            metaItem.conversionValue += ghlItem.value;
            console.log('updated meta item: ', metaItem)
        } else {
            const newMetaItem = createBlankMetaAdsetData(ghlItem.adset);
            // snap to month bucket
            newMetaItem.date = new Date(
                date.getUTCFullYear(),
                date.getUTCMonth(),
                1
            );

            newMetaItem.conversions = 1;
            newMetaItem.conversionValue = ghlItem.value;
            fullMetaData.push(newMetaItem);
            console.log('new meta item: ', newMetaItem)
        }
    }

    // console.log("fetched meta data", dailyMetaData)

    await updateCacheData(dailyMetaData, fullMetaData, startDate);

    const cachedDate = new Date().toISOString();

    return Response.json({
        dailyMetaData,
        fullMetaData,
        ghlData,
        cachedDate,
    });
}
