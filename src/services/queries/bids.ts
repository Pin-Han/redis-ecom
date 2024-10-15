import type { CreateBidAttrs, Bid } from "$services/types";
import { bidHistoryKey, itemsKey } from "$services/keys";
import { client } from "$services/redis";
import { DateTime } from "luxon";
import { getItem } from "./items";
export const createBid = async (attrs: CreateBidAttrs) => {
  const item = await getItem(attrs.itemId);
  if (!item) {
    throw new Error("Item does not exist");
  }
  console.log(`Create bid`, item.price, attrs.amount);
  if (item.price >= attrs.amount) {
    throw new Error("Bid must be higher than the current price");
  }
  if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
    throw new Error("Item has already ended");
  }
  const serialized = serializeHistory(
    attrs.amount,
    attrs.createdAt.toMillis().toString()
  );

  Promise.all([
    client.rPush(bidHistoryKey(attrs.itemId), serialized),
    client.hSet(itemsKey(attrs.itemId), {
      bids: (item.bids + 1).toString(),
      price: attrs.amount.toString(),
      highestBidUserId: attrs.userId,
    }),
  ]);
  return client.rPush(bidHistoryKey(attrs.itemId), serialized);
};

export const getBidHistory = async (
  itemId: string,
  offset = 0,
  count = 10
): Promise<Bid[]> => {
  const startIndex = -1 * offset - count;
  const endIndex = -1 - offset;
  const range = await client.lRange(
    bidHistoryKey(itemId),
    startIndex,
    endIndex
  );
  return range.map((bid) => deserializeHistory(bid));
};

const serializeHistory = (amount: number, createdAt: string) => {
  return `${amount}:${createdAt}`;
};

const deserializeHistory = (stored: string) => {
  const [amount, createdAt] = stored.split(":");
  return {
    amount: parseFloat(amount),
    createdAt: DateTime.fromMillis(parseInt(createdAt)),
  };
};
