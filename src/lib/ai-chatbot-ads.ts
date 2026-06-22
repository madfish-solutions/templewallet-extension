export type AiChatbotAdsOfferAction = 'view' | 'enable' | 'dismiss';

export interface AiChatbotAdsDomainState {
  snoozedUntil?: number;
  disabled?: boolean;
  cooldownUntil?: number;
  dismissCount?: number;
}

export interface AiChatbotAdsNudgeState {
  domains?: StringRecord<AiChatbotAdsDomainState>;
}

export interface AiChatbotAdsDomainSessionState {
  appearanceCount?: number;
  firstIgnoredAt?: number;
  stopped?: boolean;
  usedCopyIds?: string[];
}

export interface AiChatbotAdsNudgeSessionState {
  domains?: StringRecord<AiChatbotAdsDomainSessionState>;
}

export const AI_CHATBOT_PROMO_OFFER_EVENT = 'AI-chatbot Promo Offer';
export const GENERAL_ADS_ENABLED_EVENT = 'General Ads Enabled';

export function normalizeAiChatbotAdsDomain(hostname: string) {
  const normalized = hostname.toLowerCase();

  return normalized.startsWith('www.') ? normalized.slice(4) : normalized;
}

export function getAiChatbotAdsDomainState(state: AiChatbotAdsNudgeState | null, domain: string) {
  return state?.domains?.[domain] ?? {};
}

export function setAiChatbotAdsDomainState(
  state: AiChatbotAdsNudgeState | null,
  domain: string,
  domainState: AiChatbotAdsDomainState
): AiChatbotAdsNudgeState {
  return {
    ...state,
    domains: {
      ...state?.domains,
      [domain]: domainState
    }
  };
}

export function getAiChatbotAdsDomainSessionState(state: AiChatbotAdsNudgeSessionState | null, domain: string) {
  return state?.domains?.[domain] ?? {};
}

export function setAiChatbotAdsDomainSessionState(
  state: AiChatbotAdsNudgeSessionState | null,
  domain: string,
  domainState: AiChatbotAdsDomainSessionState
): AiChatbotAdsNudgeSessionState {
  return {
    ...state,
    domains: {
      ...state?.domains,
      [domain]: domainState
    }
  };
}
