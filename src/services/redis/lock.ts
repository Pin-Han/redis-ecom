import { randomBytes } from "crypto";
import { client } from "./client";

export const withLock = async (key: string, cb: () => any) => {
  // Initialize the variables to control retry behavior

  const retryDelayMs = 100;
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
      PX: retryDelayMs,
    });
    if (!acquired) {
      // Else brief pause (retryDelayMs) and then retry
      await pause(retryDelayMs);
      continue;
    }
    // If successful, run the callback and return the result
    const result = await cb();
    await client.del(lockKey);
    return result;
  }
  // Unset the locked set
};

const buildClientProxy = () => {};

const pause = (duration: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};
