import Redis from 'ioredis';
import { GHLData, MetaAdsetData } from '../../types/analytics';
import { startOfDayInSydney } from "@/lib/utils/aedt";
import fs from "fs";
import path from "path";

export const redis = new Redis({
    host: process.env.REDIS_URL,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_API_PASS,
    username: 'default'
});

function logToFile(message: string) {
    const logPath = path.resolve("./dryRunLog.txt");
    fs.appendFileSync(logPath, message + "\n", { encoding: "utf-8" });
}


export async function cacheData(data: MetaAdsetData[], fullData: MetaAdsetData[]): Promise<void> {
    await redis.del('metaAdsetData');
    await redis.del('fullMetaAdsetData');
    for (const item of data) {
        await redis.zadd('metaAdsetData', convertToUnix(item.date), JSON.stringify(item));
    }
    for (const item of fullData) {
        await redis.zadd('fullMetaAdsetData', convertToUnix(item.date), JSON.stringify(item));
    }
    await redis.set('metaAdsetDataTimestamp', new Date().toISOString());
}

export async function updateCacheData(data: MetaAdsetData[], fullData: MetaAdsetData[], startDate: Date): Promise<void> {
    // Remove the elements from the same day (Australia/Sydney) onward
    const startOfUpdateDate = startOfDayInSydney(startDate);
    await redis.zremrangebyscore('metaAdsetData', convertToUnix(startOfUpdateDate), 'inf');
    await redis.zremrangebyscore('testData', 0, 'inf')
    // const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    // await redis.zremrangebyscore('fullMetaAdsetData', convertToUnix(startOfMonth), 'inf')
    console.log('removing')
    for (const item of data) {
        await redis.zadd('testData', convertToUnix(item.date), JSON.stringify(item));
        await redis.zadd('metaAdsetData', convertToUnix(item.date), JSON.stringify(item));
    }

    for (const item of fullData) {
        await redis.zadd('fullMetaAdsetData', convertToUnix(item.date), JSON.stringify(item));
        await redis.zadd('testData', convertToUnix(item.date), JSON.stringify(item))
    }
    await redis.set('metaAdsetDataTimestamp', new Date().toISOString());
    return;
}



function parseRedisJSON(arr: string[]) {
    return arr
        .filter((item) => item && item.trim() !== "") // skip empty strings
        .map((item) => JSON.parse(item));
}

function convertToUnix(date: Date | string): number {
    const d = typeof date === "string" ? new Date(date) : date
    return Math.floor(d.getTime() / 1000) ?? 0
}

export async function getCachedData(): Promise<MetaAdsetData[]> {
    const data = await redis.zrange('metaAdsetData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
    return mappedData;
}
export async function getFullCachedData(): Promise<MetaAdsetData[]> {
    const data = await redis.zrange('fullMetaAdsetData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
    return mappedData;
}

export async function getDateCached(): Promise<string> {
    const date = await redis.get("metaAdsetDataTimestamp");
    return date || '';
    // return '2026-02-10T02:01:22.806Z'
}

export async function getDateCachedUnix(): Promise<number> {
    const stored_date = await redis.get("metaAdsetDataTimestamp")
    const date = new Date(stored_date || "");
    return convertToUnix(date);
}

export async function cacheGHLData(data: GHLData[]): Promise<void> {
    await redis.del('ghlData');
    for (const item of data) {
        await redis.zadd('ghlData', convertToUnix(new Date(item.dateCreated)), JSON.stringify(item));
    }
}

export async function updateGHLCache(data: GHLData[]): Promise<void> {
    for (const item of data) {
        await redis.zadd('ghlData', convertToUnix(new Date(item.dateCreated)), JSON.stringify(item));
    }
}

export async function getCachedGHLData(): Promise<GHLData[]> {
    const data = await redis.zrange('ghlData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as GHLData);
    return mappedData;
}
