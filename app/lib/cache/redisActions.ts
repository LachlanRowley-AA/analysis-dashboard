'use server';

import { clearCache } from "./redisManager";

export async function clearAllCache() {
    await clearCache();
}