import { client } from "$services/redis";
import { itemsByViewsKey, itemsKey } from "$services/keys";
import { deserialize } from "./deserialize";

export const itemsByViews = async (
  order: "DESC" | "ASC" = "DESC",
  offset = 0,
  count = 10
) => {
  let results: any = await client.sort(itemsByViewsKey(), {
    GET: [
      "#", // return the id
      `${itemsKey("*")}->name`, // return the name, e.g. from itemsKey#123456 -> name
      `${itemsKey("*")}->views`, // return the views
      `${itemsKey("*")}->endingAt`,
      `${itemsKey("*")}->imageUrl`,
      `${itemsKey("*")}->price`,
    ],
    BY: "nosort",
    DIRECTION: order,
    LIMIT: {
      offset,
      count,
    },
  });

  // console.log("results", results);
  const items = [];
  while (results.length) {
    const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
    const item = deserialize(id, { name, views, endingAt, imageUrl, price });
    items.push(item);
    results = rest;
  }

  return items;
};
