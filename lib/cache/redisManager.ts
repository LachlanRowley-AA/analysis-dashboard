import Redis from 'ioredis';
import { GHLData, MetaAdsetData } from '../../types/analytics';

export const redis = new Redis({
  host: process.env.REDIS_URL,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_API_PASS,
  username: 'default'
});


export async function cacheData(data: MetaAdsetData[], fullData: MetaAdsetData[]): Promise<void> {
    await redis.del('metaAdsetData');
    await redis.del('metaAdsetData:zset');
    await redis.del('fullMetaAdsetData');
    for (const item of data) {
        await redis.zadd('metaAdsetData', convertToUnix(item.date), JSON.stringify(item));
    }
    await redis.set('metaAdsetDataTimestamp', new Date().toISOString());
}

function convertToUnix(date : Date) : number {
    return Math.floor(date.getTime() / 1000) ?? 0
}

export async function getCachedData(): Promise<MetaAdsetData[]> {
    const data = await redis.zrange('metaAdsetData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
    return mappedData;
}
export async function getFullCachedData(): Promise<MetaAdsetData[]> {
    const data = await redis.lrange('fullMetaAdsetData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as MetaAdsetData);
    return mappedData;
}

export async function getDateCached(): Promise<string> {
    const date = await redis.get("metaAdsetDataTimestamp");
    return date || '';
}

export async function getDateCachedUnix(): Promise<number> {
    const stored_date = await redis.get("metaAdsetDataTimestamp")
    const date = new Date(stored_date || "");
    return convertToUnix(date);
}

export async function cacheGHLData(data: GHLData[]): Promise<void> {
    await redis.del('ghlData');
    for (const item of data) {
        await redis.rpush('ghlData', JSON.stringify(item));
    }
}
export async function getCachedGHLData(): Promise<GHLData[]> {
    const data = await redis.lrange('ghlData', 0, -1);
    const mappedData = data.map(item => JSON.parse(item) as GHLData);
    return mappedData;
}
