import { createClient } from "redis";

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
  password: process.env.REDIS_PW,
});

client.on("error", (err) =>
  console.error(`Redis client not connected to some  ${err}`)
);
client.connect();

export { client };
