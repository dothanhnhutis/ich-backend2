import Redis from "ioredis";
import configs from "../configs";

let redisClient: Redis, connectionTimeout: NodeJS.Timeout;

const REDIS_CONNECT_TIMEOUT = 10000;

function handleTimeoutError() {
  connectionTimeout = setTimeout(() => {
    throw new Error("Redis reconnect time out");
  }, REDIS_CONNECT_TIMEOUT);
}

function handleEventConnect(redisClient: Redis) {
  redisClient.on("connect", () => {
    console.log("Redis connection status: connected");
    clearTimeout(connectionTimeout);
  });
  redisClient.on("end", () => {
    console.log("Redis connection status: disconnected");
    handleTimeoutError();
  });
  redisClient.on("reconnecting", () => {
    console.log("Redis connection status: reconnecting");
    clearTimeout(connectionTimeout);
  });
  redisClient.on("error", (err) => {
    console.log(`Redis connection status: error ${err}`);
    handleTimeoutError();
  });
}

export function initRedis(): void {
  const instanceRedis: Redis = new Redis(configs.REDIS_HOST);
  redisClient = instanceRedis;
  handleEventConnect(redisClient);
  process.on("SIGINT", () => {
    redisClient.disconnect();
  });
}
export { redisClient };
