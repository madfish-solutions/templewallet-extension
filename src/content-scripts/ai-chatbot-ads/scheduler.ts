import type { AiChatbotAdsDomainSessionState, AiChatbotAdsDomainState } from 'lib/ai-chatbot-ads';

import { AI_CHATBOT_ADS_COPY, AI_CHATBOT_ADS_MAX_APPEARANCES, AI_CHATBOT_ADS_TIMING } from './constants';

export type AiChatbotAnswerState = 'idle' | 'answering' | 'indeterminate';

export type AiChatbotAdsTrigger = 'timer' | 'completed-answer' | 'tick';

export interface AiChatbotAdsEligibilityInput {
  now: number;
  siteStartedAt: number;
  completedAnswers: number;
  enabled: boolean;
  focused: boolean;
  hasActiveModal: boolean;
  answerState: AiChatbotAnswerState;
  trigger: AiChatbotAdsTrigger;
  domainState: AiChatbotAdsDomainState;
  sessionDomainState: AiChatbotAdsDomainSessionState;
}

export interface AiChatbotAdsEligibleOffer {
  copyId: string;
  text: string;
}

export function getEligibleAiChatbotAdsOffer({
  now,
  siteStartedAt,
  completedAnswers,
  enabled,
  focused,
  hasActiveModal,
  answerState,
  trigger,
  domainState,
  sessionDomainState
}: AiChatbotAdsEligibilityInput): AiChatbotAdsEligibleOffer | null {
  if (enabled) return null;
  if (!focused || hasActiveModal || answerState !== 'idle') return null;
  if (domainState.disabled) return null;
  if (domainState.snoozedUntil && now < domainState.snoozedUntil) return null;
  if (domainState.cooldownUntil && now < domainState.cooldownUntil) return null;
  if (sessionDomainState.stopped) return null;

  const appearanceCount = sessionDomainState.appearanceCount ?? 0;
  if (appearanceCount >= AI_CHATBOT_ADS_MAX_APPEARANCES) return null;

  const copy = AI_CHATBOT_ADS_COPY[appearanceCount];
  if (!copy || sessionDomainState.usedCopyIds?.includes(copy.id)) return null;

  const offer = {
    copyId: copy.id,
    text: copy.text
  };

  if (appearanceCount === 0) {
    const timerEligible = now - siteStartedAt >= AI_CHATBOT_ADS_TIMING.firstSiteDelayMs;
    const answerEligible = completedAnswers >= 2;

    return timerEligible || answerEligible ? offer : null;
  }

  if (appearanceCount === 1) {
    const ignoredAt = sessionDomainState.firstIgnoredAt;
    const backoffElapsed = ignoredAt != null && now - ignoredAt >= AI_CHATBOT_ADS_TIMING.reShowBackoffMs;

    return backoffElapsed && trigger === 'completed-answer' ? offer : null;
  }

  return null;
}

export function buildViewedSessionState(
  sessionDomainState: AiChatbotAdsDomainSessionState,
  offer: AiChatbotAdsEligibleOffer
): AiChatbotAdsDomainSessionState {
  return {
    ...sessionDomainState,
    appearanceCount: (sessionDomainState.appearanceCount ?? 0) + 1,
    usedCopyIds: [...(sessionDomainState.usedCopyIds ?? []), offer.copyId]
  };
}

export function buildTimedOutState(
  now: number,
  domainState: AiChatbotAdsDomainState,
  sessionDomainState: AiChatbotAdsDomainSessionState
) {
  const appearanceCount = sessionDomainState.appearanceCount ?? 0;

  if (appearanceCount >= AI_CHATBOT_ADS_MAX_APPEARANCES) {
    return {
      domainState: {
        ...domainState,
        cooldownUntil: now + AI_CHATBOT_ADS_TIMING.cycleCooldownMs
      },
      sessionDomainState: {
        ...sessionDomainState,
        stopped: true
      }
    };
  }

  return {
    domainState,
    sessionDomainState: {
      ...sessionDomainState,
      firstIgnoredAt: sessionDomainState.firstIgnoredAt ?? now
    }
  };
}

export function buildDismissedState(
  now: number,
  domainState: AiChatbotAdsDomainState,
  sessionDomainState: AiChatbotAdsDomainSessionState
) {
  const dismissCount = domainState.dismissCount ?? 0;

  return {
    domainState:
      dismissCount === 0
        ? {
            ...domainState,
            dismissCount: 1,
            snoozedUntil: now + AI_CHATBOT_ADS_TIMING.dismissSnoozeMs
          }
        : {
            ...domainState,
            dismissCount: dismissCount + 1,
            disabled: true
          },
    sessionDomainState: {
      ...sessionDomainState,
      stopped: true
    }
  };
}

export function buildEnabledSessionState(sessionDomainState: AiChatbotAdsDomainSessionState) {
  return {
    ...sessionDomainState,
    stopped: true
  };
}
