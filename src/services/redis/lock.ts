import { randomBytes } from "crypto";
import { client } from "./client";

export const withLock = async (
  key: string,
  cb: (redisClient: Client, signal: any) => any
) => {
  // Initialize the variables to control retry behavior

  const retryDelayMs = 100;
  const timeoutMs = 2000;
  let retries = 20;

  const token = randomBytes(6).toString("hex");

  // Create the lock key
  const lockKey = `lock:${key}`;

  // Setup a while loop to implement the retry behavior
  while (retries > 0) {
    retries--;
    // Try to do a SET NX operation
    const acquired = await client.set(lockKey, token, {
      NX: true,
      PX: timeoutMs,
    });
    if (!acquired) {
      // Else brief pause (retryDelayMs) and then retry
      await pause(retryDelayMs);
      continue;
    }
    // If successful, run the callback and return the result
    try {
      const signal = { expired: false };
      setTimeout(() => {
        signal.expired = true;
      }, timeoutMs);
      const proxiedClient = buildClientProxy(timeoutMs);
      const result = await cb(proxiedClient, signal);
      return result;
    } catch (err) {
      throw err;
    } finally {
      await client.unlock(lockKey, token);
    }
  }
  // Unset the locked set
};

type Client = typeof client;
const buildClientProxy = (timeoutMs: number) => {
  const startTime = Date.now();
  const handler = {
    get(target: Client, prop: keyof Client) {
      if (Date.now() >= startTime + timeoutMs) {
        throw new Error("Lock has expired");
      }
      const value = target[prop];
      return typeof value === "function" ? value.bind(target) : value;
    },
  };
  return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};
