export const AI_CHATBOT_ADS_HOST_ID = 'temple-ai-chatbot-ads-nudge-host';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const AI_CHATBOT_ADS_TIMING = {
  firstSiteDelayMs: 1_000,
  visibleWindowMs: 15_000,
  entranceMs: 260,
  exitMs: 250,
  reShowBackoffMs: 5 * 60 * 1000,
  cycleCooldownMs: 30 * ONE_DAY_MS,
  dismissSnoozeMs: ONE_DAY_MS
} as const;

export const AI_CHATBOT_ADS_MAX_APPEARANCES = 2;

export const AI_CHATBOT_ADS_COPY = [
  {
    id: 'chatgpt-first',
    text: 'We turned "Cooking..." into promo. 20% revenue goes to you. Powered by Temple.'
  },
  {
    id: 'chatgpt-second',
    text: 'Enjoying the chat? Earn 20% promo revenue while waiting for responses. Powered by Temple.'
  }
] as const;
