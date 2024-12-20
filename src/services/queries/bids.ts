import type { CreateBidAttrs, Bid } from "$services/types";
import { bidHistoryKey, itemsByPriceKey, itemsKey } from "$services/keys";
import { client, withLock } from "$services/redis";
import { DateTime } from "luxon";
import { getItem } from "./items";
export const createBid = async (attrs: CreateBidAttrs) => {
  return withLock(
    attrs.itemId,
    async (lockedClient: typeof client, signal: any) => {
      // 1) Fetching the item
      // 2) Doing validation
      // 3) Writing some data

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
      // if (signal?.expired) {
      //   throw new Error("Lock expired, can't write any more data");
      // }
      return Promise.all([
        lockedClient.rPush(bidHistoryKey(attrs.itemId), serialized),
        lockedClient.hSet(itemsKey(attrs.itemId), {
          bids: (item.bids + 1).toString(),
          price: attrs.amount.toString(),
          highestBidUserId: attrs.userId,
        }),
        lockedClient.zAdd(itemsByPriceKey(), {
          value: item.id,
          score: attrs.amount,
        }),
      ]);
    }
  );

  // return client.executeIsolated(async (isolatedClient) => {
  //   await isolatedClient.watch(itemsKey(attrs.itemId));

  //     .exec();
  // });
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
