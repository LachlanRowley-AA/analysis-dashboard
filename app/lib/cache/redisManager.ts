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

function convertToUnix(date: Date | string): number {
    const d = typeof date === "string" ? new Date(date) : date;
    return Math.floor(d.getTime() / 1000) ?? 0;
}

function parseRedisJSON(arr: string[]) {
    return arr
        .filter((item) => item && item.trim() !== "")
        .map((item) => JSON.parse(item));
}

// ---------------------------------------------------------------------------
// Adset data (legacy key — weekly/quarterly bucketed)
// ---------------------------------------------------------------------------

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
    const secondsUntilMidnight = getSecondsUntilSydneyMidnight();

    await redis.del('metaAdsetData');

    if (adsetData.length === 0) {
        await redis.zadd('metaAdsetData', 0, '__EMPTY__');
        await redis.expire('metaAdsetData', secondsUntilMidnight);
        return;
    }

    const zaddArgs: (string | number)[] = [];
    for (const item of adsetData) {
        zaddArgs.push(convertToUnix(item.date), JSON.stringify(item));
    }

    await redis.zadd('metaAdsetData', ...zaddArgs);
    await redis.expire('metaAdsetData', secondsUntilMidnight);
}

// ---------------------------------------------------------------------------
// Quarterly Meta data (weekly-bucketed, 6-month window)
// ---------------------------------------------------------------------------

const QUARTERLY_CACHE_KEY = 'metaAdsetData:quarterly';

export async function getQuarterlyAdsetDataFromCache(): Promise<AdSetMetric[] | null> {
    const exists = await redis.exists(QUARTERLY_CACHE_KEY);
    if (!exists) {
        console.log('Quarterly cache missing or expired');
        return null;
    }

    const data = await redis.zrange(QUARTERLY_CACHE_KEY, 0, -1);
    if (data.length === 0) {
        console.log('Quarterly cache valid but empty');
        return [];
    }

    return data.map(item => JSON.parse(item) as AdSetMetric);
}

export async function cacheQuarterlyAdsetData(adsetData: AdSetMetric[]): Promise<void> {
    const secondsUntilMidnight = getSecondsUntilSydneyMidnight();

    await redis.del(QUARTERLY_CACHE_KEY);

    if (adsetData.length === 0) {
        await redis.zadd(QUARTERLY_CACHE_KEY, 0, '__EMPTY__');
        await redis.expire(QUARTERLY_CACHE_KEY, secondsUntilMidnight);
        return;
    }

    const zaddArgs: (string | number)[] = [];
    for (const item of adsetData) {
        zaddArgs.push(convertToUnix(item.date), JSON.stringify(item));
    }

    await redis.zadd(QUARTERLY_CACHE_KEY, ...zaddArgs);
    await redis.expire(QUARTERLY_CACHE_KEY, secondsUntilMidnight);
}

// ---------------------------------------------------------------------------
// Daily Meta data (day-by-day, from /api/GetMetaData)
// ---------------------------------------------------------------------------

const DAILY_CACHE_KEY = 'metaAdsetData:daily';

export async function getDailyAdsetDataFromCache(): Promise<AdSetMetric[] | null> {
    const exists = await redis.exists(DAILY_CACHE_KEY);
    if (!exists) {
        console.log('Daily cache missing or expired');
        return null;
    }

    const data = await redis.zrange(DAILY_CACHE_KEY, 0, -1);
    if (data.length === 0) {
        console.log('Daily cache valid but empty');
        return [];
    }

    return data.map(item => JSON.parse(item) as AdSetMetric);
}

export async function cacheDailyAdsetData(adsetData: AdSetMetric[]): Promise<void> {
    const secondsUntilMidnight = getSecondsUntilSydneyMidnight();

    await redis.del(DAILY_CACHE_KEY);

    if (adsetData.length === 0) {
        await redis.zadd(DAILY_CACHE_KEY, 0, '__EMPTY__');
        await redis.expire(DAILY_CACHE_KEY, secondsUntilMidnight);
        return;
    }

    const zaddArgs: (string | number)[] = [];
    for (const item of adsetData) {
        zaddArgs.push(convertToUnix(item.date), JSON.stringify(item));
    }

    await redis.zadd(DAILY_CACHE_KEY, ...zaddArgs);
    await redis.expire(DAILY_CACHE_KEY, secondsUntilMidnight);
}

// ---------------------------------------------------------------------------
// GHL data
// ---------------------------------------------------------------------------

const DEFAULT_CACHE_KEY = 'ghlData';

function getCacheKey(stageId?: string): string {
    return stageId ? `ghlData:${stageId}` : DEFAULT_CACHE_KEY;
}

export async function cacheGHLData(data: GHLData[], stageId?: string): Promise<void> {
    const key = getCacheKey(stageId);
    const ttl = getSecondsUntilSydneyMidnight();

    if (data.length === 0) {
        await redis.del(key);
        await redis.expire(key, ttl);
        return;
    }

    const args: (string | number)[] = [];
    for (const item of data) {
        args.push(
            convertToUnix(new Date(item.dateCreated)),
            JSON.stringify(item)
        );
    }

    await redis.del(key);
    await redis.zadd(key, ...args);
    await redis.expire(key, ttl);
}

export async function getGHLDataFromCache(stageId?: string): Promise<GHLData[] | null> {
    const key = getCacheKey(stageId);
    const exists = await redis.exists(key);

    if (!exists) {
        console.log(`GHL Cache missing or expired [key: ${key}]`);
        return null;
    }

    const data = await redis.zrange(key, 0, -1);
    if (data.length === 0) {
        return [];
    }

    return data.map(item => JSON.parse(item) as GHLData);
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

export async function clearCache(): Promise<void> {
    await redis.del('metaAdsetData');
    await redis.del(QUARTERLY_CACHE_KEY);
    await redis.del(DAILY_CACHE_KEY);
    await redis.del('ghlData');
}