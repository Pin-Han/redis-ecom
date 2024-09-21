import type { Item } from "$services/types";
import { DateTime } from "luxon";

export const deserialize = (
  id: string,
  item: { [key: string]: string }
): Item => {
  return {
    id,
    createdAt: DateTime.fromMillis(Number(item.createdAt)),
    endingAt: DateTime.fromMillis(Number(item.endingAt)),
    name: item.name,
    ownerId: item.ownerId,
    imageUrl: item.imageUrl,
    description: item.description,
    highestBidUserId: item.highestBidUserId,
    views: Number(item.views),
    likes: Number(item.likes),
    price: Number(item.price),
    bids: Number(item.bids),
  };
};
