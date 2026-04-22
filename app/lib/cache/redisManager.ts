import Redis from 'ioredis';
import fs from "fs";
import path from "path";
import { AdSetMetric, GHLData } from '../types';
import { DateTime } from 'luxon';

export const redis = new Redis({
    host: process.env.REDIS_URL,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_API_PASS,
    username: 'default'
});

function getSecondsUntilSydneyMidnight(): number {
    const now = DateTime.now().setZone('Australia/Sydney');
    return Math.ceil(now.endOf('day').diff(now, 'seconds').seconds);
}

export async function getAdsetDataFromCache(): Promise<AdSetMetric[] | null> {
    const exists = await redis.exists('metaAdsetData');

    if (!exists) {
        console.log('Cache missing or expired');
        return null;
    }

    const data = await redis.zrange('metaAdsetData', 0, -1);

    if (data.length === 0) {
        console.log('Cache valid but empty');
        return [];
    }

    return data.map(item => JSON.parse(item) as AdSetMetric);
}

export async function cacheAdsetData(adsetData: AdSetMetric[]): Promise<void> {
    const now = DateTime.now().setZone('Australia/Sydney');
    const secondsUntilMidnight = Math.ceil(
        now.endOf('day').diff(now, 'seconds').seconds
    );

    // Clear existing
    await redis.del('metaAdsetData');

    if (adsetData.length === 0) {
        // Still set key so we cache "empty result"
        await redis.zadd('metaAdsetData', 0, '__EMPTY__');
        await redis.expire('metaAdsetData', secondsUntilMidnight);
        return;
    }

    // Batch insert
    const zaddArgs: (string | number)[] = [];

    for (const item of adsetData) {
        zaddArgs.push(
            convertToUnix(item.date), // score
            JSON.stringify(item)      // value
        );
    }

    await redis.zadd('metaAdsetData', ...zaddArgs);

    // Set expiry on the key itself
    await redis.expire('metaAdsetData', secondsUntilMidnight);
}

export async function cacheGHLData(data: GHLData[]): Promise<void> {
    const ttl = getSecondsUntilSydneyMidnight();

    if (data.length === 0) {
        await redis.del('ghlData');
        await redis.expire('ghlData', ttl);
        return;
    }

    // Batch ZADD args
    const args: (string | number)[] = [];

    for (const item of data) {
        args.push(
            convertToUnix(new Date(item.dateCreated)),
            JSON.stringify(item)
        );
    }

    // Replace entire dataset in one atomic operation
    await redis.del('ghlData');
    await redis.zadd('ghlData', ...args);

    // Set TTL on key itself (no separate expiry key needed)
    await redis.expire('ghlData', ttl);
}
export async function getGHLDataFromCache(): Promise<GHLData[] | null> {
    const exists = await redis.exists('ghlData');

    if (!exists) {
        console.log('GHL Cache missing or expired');
        return null;
    }
    const data = await redis.zrange('ghlData', 0, -1);

    if (data.length === 0) {
        return [];
    }

    return data.map(item => JSON.parse(item) as GHLData);
}
// export async function updateCacheData(data: MetaAdsetData[], fullData: MetaAdsetData[], startDate: Date): Promise<void> {
//     // Remove the elements from the same day (Australia/Sydney) onward
//     const startOfUpdateDate = startOfDayInSydney(startDate);
//     await redis.zremrangebyscore('metaAdsetData', convertToUnix(startOfUpdateDate), 'inf');
//     await redis.zremrangebyscore('testData', 0, 'inf')
//     // const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
//     // await redis.zremrangebyscore('fullMetaAdsetData', convertToUnix(startOfMonth), 'inf')
//     console.log('removing')
//     for (const item of data) {
//         await redis.zadd('testData', convertToUnix(item.date), JSON.stringify(item));
//         await redis.zadd('metaAdsetData', convertToUnix(item.date), JSON.stringify(item));
//     }

//     for (const item of fullData) {
//         await redis.zadd('fullMetaAdsetData', convertToUnix(item.date), JSON.stringify(item));
//         await redis.zadd('testData', convertToUnix(item.date), JSON.stringify(item))
//     }
//     await redis.set('metaAdsetDataTimestamp', new Date().toISOString());
//     return;
// }



function parseRedisJSON(arr: string[]) {
    return arr
        .filter((item) => item && item.trim() !== "") // skip empty strings
        .map((item) => JSON.parse(item));
}

function convertToUnix(date: Date | string): number {
    const d = typeof date === "string" ? new Date(date) : date
    return Math.floor(d.getTime() / 1000) ?? 0
}
0
// export async function getCachedData(): Promise<MetaAdsetData[]> {
//     const data = await redis.zrange('metaAdsetData', 0, -1);
//     const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
//     return mappedData;
// }
// export async function getFullCachedData(): Promise<MetaAdsetData[]> {
//     const data = await redis.zrange('fullMetaAdsetData', 0, -1);
//     const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
//     return mappedData;
// }

// export async function getDateCached(): Promise<string> {
//     const date = await redis.get("metaAdsetDataTimestamp");
//     return date || '';
//     // return '2026-02-10T02:01:22.806Z'
// }

// export async function getDateCachedUnix(): Promise<number> {
//     const stored_date = await redis.get("metaAdsetDataTimestamp")
//     const date = new Date(stored_date || "");
//     return convertToUnix(date);
// }

// export async function cacheGHLData(data: GHLData[]): Promise<void> {
//     await redis.del('ghlData');
//     for (const item of data) {
//         await redis.zadd('ghlData', convertToUnix(new Date(item.dateCreated)), JSON.stringify(item));
//     }
// }

// export async function updateGHLCache(data: GHLData[]): Promise<void> {
//     for (const item of data) {
//         await redis.zadd('ghlData', convertToUnix(new Date(item.dateCreated)), JSON.stringify(item));
//     }
// }

// export async function getCachedGHLData(): Promise<GHLData[]> {
//     const data = await redis.zrange('ghlData', 0, -1);
//     const mappedData = data.map(item => JSON.parse(item) as GHLData);
//     return mappedData;
// }
