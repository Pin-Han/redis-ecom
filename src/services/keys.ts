export const pageCacheKey = (id: string) => `pagecache#${id}`;
export const usersKey = (userId: string) => `usersKey#${userId}`;
export const sessionKey = (sessionId: string) => `sessionKey#${sessionId}`;
export const usernameUniqueKey = () => `usernames#unique`;
export const userLikesKey = (userId: string) => `user:likes#${userId}`;
export const usernamesKey = () => `usernames`;

// items
export const itemsKey = (itemId: string) => `items#${itemId}`;
export const itemsByViewsKey = () => `items:views`;
export const itemsByEndingAtKey = () => `items:endingAt`;

export const itemsViewsKey = (itemId: string) => `items:views#${itemId}`;

export const bidHistoryKey = (itemId: string) => `history#${itemId}`;

export const itemsByPriceKey = () => `items:price`;
