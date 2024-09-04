import { redisClient } from "./connection";

export async function getKeyByPattern(pattern: string) {
  return await redisClient.keys(pattern);
}

export async function getDataCache(key: string): Promise<string | null> {
  return await redisClient.get(key);
}

export async function setDataCache(
  key: string,
  val: string,
  opt?: { keepTTL?: boolean }
): Promise<void> {
  if (opt?.keepTTL) {
    await redisClient.set(key, val, "KEEPTTL");
  } else {
    await redisClient.set(key, val);
  }
}

export async function setDataInMilisecondCache(
  key: string,
  val: string,
  milliseconds: number | string
): Promise<void> {
  await redisClient.set(key, val, "PX", milliseconds);
}

export async function setDataInSecondCache(
  key: string,
  val: string,
  seconds: number | string
): Promise<void> {
  await redisClient.set(key, val, "EX", seconds);
}

export async function deteleDataCache(key: string): Promise<void> {
  await redisClient.del(key);
}
