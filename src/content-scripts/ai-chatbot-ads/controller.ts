import type { AiChatbotAdsDomainSessionState, AiChatbotAdsDomainState } from 'lib/ai-chatbot-ads';
import { browser } from 'lib/browser';
import { ContentScriptType } from 'lib/constants';

import { AiChatbotAdapter } from './chatgpt-adapter';
import { AI_CHATBOT_ADS_HOST_ID } from './constants';
import { mountAiChatbotAdsPopup, type AiChatbotAdsPopupAction } from './popup';
import {
  AiChatbotAnswerState,
  AiChatbotAdsTrigger,
  buildDismissedState,
  buildEnabledSessionState,
  buildTimedOutState,
  buildViewedSessionState,
  getEligibleAiChatbotAdsOffer
} from './scheduler';

interface AiChatbotAdsControllerParams {
  adapter: AiChatbotAdapter;
  domain: string;
}

interface AiChatbotAdsNudgeStateResponse {
  enabled: boolean;
  domainState: AiChatbotAdsDomainState;
  sessionDomainState: AiChatbotAdsDomainSessionState;
}

export class AiChatbotAdsController {
  private readonly adapter: AiChatbotAdapter;
  private readonly domain: string;
  private readonly siteStartedAt = Date.now();
  private completedAnswers = 0;
  private currentAnswerState: AiChatbotAnswerState;
  private previousAnswerState: AiChatbotAnswerState;
  private popupClose: ((action?: AiChatbotAdsPopupAction) => void) | null = null;
  private activeClaimId: string | null = null;
  private disposed = false;
  private evaluating = false;
  private readonly cleanups: Array<() => void> = [];

  constructor({ adapter, domain }: AiChatbotAdsControllerParams) {
    this.adapter = adapter;
    this.domain = domain;
    this.currentAnswerState = adapter.getAnswerState();
    this.previousAnswerState = this.currentAnswerState;
  }

  start(): void {
    this.cleanups.push(
      this.adapter.observeAnswerState(state => {
        this.handleAnswerStateChange(state);
      })
    );

    const evaluateOnFocus = () => this.evaluate('tick');
    window.addEventListener('focus', evaluateOnFocus);
    document.addEventListener('visibilitychange', evaluateOnFocus);
    this.cleanups.push(() => {
      window.removeEventListener('focus', evaluateOnFocus);
      document.removeEventListener('visibilitychange', evaluateOnFocus);
    });

    const intervalId = window.setInterval(() => this.evaluate('tick'), 1_000);
    this.cleanups.push(() => window.clearInterval(intervalId));

    window.addEventListener('pagehide', this.dispose, { once: true });
    this.cleanups.push(() => window.removeEventListener('pagehide', this.dispose));

    this.evaluate('tick');
  }

  dispose = (): void => {
    if (this.disposed) return;
    this.disposed = true;
    this.popupClose?.('timeout');
    this.releaseClaim();
    this.cleanups.splice(0).forEach(cleanup => cleanup());
  };

  private handleAnswerStateChange(state: AiChatbotAnswerState): void {
    this.previousAnswerState = this.currentAnswerState;
    this.currentAnswerState = state;

    if (state !== 'idle' && this.popupClose) {
      this.popupClose('timeout');
      return;
    }

    if (this.previousAnswerState === 'answering' && state === 'idle') {
      this.completedAnswers++;
      this.evaluate('completed-answer');
      return;
    }

    this.evaluate('tick');
  }

  private async evaluate(trigger: AiChatbotAdsTrigger): Promise<void> {
    if (this.disposed || this.evaluating || this.popupClose) return;
    if (document.getElementById(AI_CHATBOT_ADS_HOST_ID)) return;

    this.evaluating = true;

    try {
      const state = await this.fetchNudgeState();
      const answerState = this.adapter.getAnswerState();
      this.currentAnswerState = answerState;

      const offer = getEligibleAiChatbotAdsOffer({
        now: Date.now(),
        siteStartedAt: this.siteStartedAt,
        completedAnswers: this.completedAnswers,
        enabled: state.enabled,
        focused: this.adapter.isFocused(),
        answerState,
        trigger,
        domainState: state.domainState,
        sessionDomainState: state.sessionDomainState
      });

      if (!offer) return;
      if (!(await this.claimNudge())) return;

      const viewedSessionState = buildViewedSessionState(state.sessionDomainState, offer);
      await this.updateNudgeState(undefined, viewedSessionState);
      await this.recordOfferAction('view');

      this.popupClose = mountAiChatbotAdsPopup({
        text: offer.text,
        onAction: action => {
          void this.handlePopupAction(action);
        },
        onClosed: () => {
          this.popupClose = null;
          this.releaseClaim();
        }
      });
    } finally {
      this.evaluating = false;
    }
  }

  private async handlePopupAction(action: AiChatbotAdsPopupAction): Promise<void> {
    const state = await this.fetchNudgeState();
    const now = Date.now();

    switch (action) {
      case 'timeout': {
        const nextState = buildTimedOutState(now, state.domainState, state.sessionDomainState);
        await this.updateNudgeState(nextState.domainState, nextState.sessionDomainState);
        break;
      }

      case 'dismiss': {
        const nextState = buildDismissedState(now, state.domainState, state.sessionDomainState);
        await this.updateNudgeState(nextState.domainState, nextState.sessionDomainState);
        await this.recordOfferAction('dismiss');
        break;
      }

      case 'enable': {
        await browser.runtime.sendMessage({
          type: ContentScriptType.EnableAiChatbotAdsDomain,
          domain: this.domain
        });
        await this.updateNudgeState(undefined, buildEnabledSessionState(state.sessionDomainState));
        break;
      }
    }
  }

  private async fetchNudgeState(): Promise<AiChatbotAdsNudgeStateResponse> {
    const response = await browser.runtime.sendMessage({
      type: ContentScriptType.GetAiChatbotAdsNudgeState,
      domain: this.domain
    });

    return {
      enabled: Boolean(response?.enabled),
      domainState: response?.domainState ?? {},
      sessionDomainState: response?.sessionDomainState ?? {}
    };
  }

  private updateNudgeState(
    domainState?: AiChatbotAdsDomainState,
    sessionDomainState?: AiChatbotAdsDomainSessionState
  ): Promise<unknown> {
    return browser.runtime.sendMessage({
      type: ContentScriptType.UpdateAiChatbotAdsNudgeState,
      domain: this.domain,
      domainState,
      sessionDomainState
    });
  }

  private async claimNudge(): Promise<boolean> {
    const claimId = createClaimId();
    const claimed = Boolean(
      await browser.runtime.sendMessage({
        type: ContentScriptType.ClaimAiChatbotAdsNudge,
        domain: this.domain,
        claimId
      })
    );

    if (claimed) this.activeClaimId = claimId;

    return claimed;
  }

  private releaseClaim(): void {
    const claimId = this.activeClaimId;
    if (!claimId) return;

    this.activeClaimId = null;
    browser.runtime
      .sendMessage({
        type: ContentScriptType.ReleaseAiChatbotAdsNudge,
        domain: this.domain,
        claimId
      })
      .catch(() => {});
  }

  private recordOfferAction(action: 'view' | 'dismiss'): Promise<unknown> {
    return browser.runtime.sendMessage({
      type: ContentScriptType.RecordAiChatbotAdsOffer,
      domain: this.domain,
      action
    });
  }
}

function createClaimId(): string {
  const randomValues = new Uint32Array(2);
  crypto.getRandomValues(randomValues);

  return `${Date.now()}-${randomValues[0].toString(36)}-${randomValues[1].toString(36)}`;
}
