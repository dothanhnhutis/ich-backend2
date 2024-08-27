import { redisClient } from "./connection";

// export async function getAllSessionOf(
//   pattern: string
// ): Promise<SessionRedis[]> {
//   const keys = await redisClient.keys(pattern);
//   const data: SessionRedis[] = [];
//   for (const id of keys) {
//     const sess = await redisClient.get(id);
//     if (sess) {
//       data.push(JSON.parse(sess));
//     }
//   }
//   return data;
// }

export async function getDataCache(key: string): Promise<string | null> {
  return await redisClient.get(key);
}

export async function setDataCache(key: string, val: string): Promise<void> {
  await redisClient.set(key, val);
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

export async function deteleDataCacheWithPattern(
  pattern: string
): Promise<void> {
  const keys = await redisClient.keys(pattern);
  if (keys && keys.length > 0) await redisClient.del(keys);
}

export async function deteleDataCache(key: string): Promise<void> {
  await redisClient.del(key);
}
