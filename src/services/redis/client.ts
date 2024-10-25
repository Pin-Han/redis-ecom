import { createClient, defineScript } from "redis";

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PW,
  scripts: {
    addOneAndStore: defineScript({
      NUMBER_OF_KEYS: 1, // number of keys that the script will use
      SCRIPT: `return redis.call('SET', KEYS[1], 1 + tonumber(ARGV[1]))`, // the script itself
      transformArguments: (key: string, value: number) => {
        return [key, value.toString()];
      },
      transformReply: (reply: string) => {
        return reply;
      },
    }),
  },
});

client.on("connect", async () => {
  console.log("connected to redis");
  await client.addOneAndStore("books:count", 1);
  const result = await client.get("books:count");
  console.log("this is result", result);
});

client.on("error", (err) =>
  console.error(`Redis client not connected to some  ${err}`)
);
client.connect();

export { client };
