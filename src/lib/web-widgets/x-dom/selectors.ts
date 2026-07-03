export const TWEET = 'article[data-testid="tweet"]';
export const USER_NAME = '[data-testid="User-Name"]';
export const TWEET_TEXT = '[data-testid="tweetText"]';

export const CANDIDATE_LINK = 'a[role="link"][href^="https://t.co/"]';

export const DIRECT_OBJKT_LINK = 'a[role="link"][href^="https://objkt.com/"]';

export const parseStatusId = (post: HTMLElement): string | undefined => {
  const time = post.querySelector('time');
  const anchor = time?.closest('a[href*="/status/"]') ?? post.querySelector('a[href*="/status/"]');
  const href = anchor?.getAttribute('href');
  const match = href?.match(/\/status\/(\d+)/);
  return match?.[1];
};
