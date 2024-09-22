import { client } from "$services/redis";
import { userLikesKey, itemsKey } from "$services/keys";
import { getItems } from "./items";

export const userLikesItem = async (itemId: string, userId: string) => {
  return await client.sIsMember(userLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
  // Fetch all item ID's from this user's liked set
  const ids = await client.sMembers(userLikesKey(userId));
  // Fetch all item hashes with those ids and return as array
  return getItems(ids);
};

export const likeItem = async (itemId: string, userId: string) => {
  const result = await client.sAdd(userLikesKey(userId), itemId);
  if (result) {
    return client.hIncrBy(itemsKey(itemId), "likes", 1);
  }
};

export const unlikeItem = async (itemId: string, userId: string) => {
  const result = await client.sRem(userLikesKey(userId), itemId);
  if (result) {
    return client.hIncrBy(itemsKey(itemId), "likes", -1);
  }
};

export const commonLikedItems = async (
  userOneId: string,
  userTwoId: string
) => {
  const ids = await client.sInter([itemsKey(userOneId), itemsKey(userTwoId)]);
  return getItems(ids);
};
