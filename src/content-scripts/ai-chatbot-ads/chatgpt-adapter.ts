import { AiChatbotAnswerState } from './scheduler';

const SUBMIT_BUTTON_SELECTOR = '#composer-submit-button.composer-submit-btn';
const SEND_BUTTON_SELECTOR = `${SUBMIT_BUTTON_SELECTOR}[data-testid="send-button"]`;
const STOP_BUTTON_SELECTOR = `${SUBMIT_BUTTON_SELECTOR}[data-testid="stop-button"]`;
const ACTIVE_MODAL_SELECTORS = [
  '[id^="modal-"]',
  '[data-testid^="modal-"]',
  '.popover[data-state="open"]',
  '.fixed.inset-0[data-state="open"]'
].join(',');

type AnswerStateListener = (state: AiChatbotAnswerState) => void;

export interface AiChatbotAdapter {
  getAnswerState(): AiChatbotAnswerState;
  hasActiveModal(): boolean;
  isFocused(): boolean;
  observeAnswerState(listener: AnswerStateListener): () => void;
}

export class ChatGptAdapter implements AiChatbotAdapter {
  getAnswerState(): AiChatbotAnswerState {
    if (!document.body) return 'indeterminate';

    const sendButtons = document.querySelectorAll(SEND_BUTTON_SELECTOR);
    const stopButtons = document.querySelectorAll(STOP_BUTTON_SELECTOR);

    if (stopButtons.length === 1 && sendButtons.length === 0) return 'answering';
    if (sendButtons.length === 1 && stopButtons.length === 0) return 'idle';

    return 'indeterminate';
  }

  hasActiveModal(): boolean {
    return Array.from(document.querySelectorAll<HTMLElement>(ACTIVE_MODAL_SELECTORS)).some(isVisibleElement);
  }

  isFocused(): boolean {
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  observeAnswerState(listener: AnswerStateListener): () => void {
    let lastState = this.getAnswerState();
    let scheduled = false;

    const emitIfChanged = () => {
      scheduled = false;

      const nextState = this.getAnswerState();
      if (nextState === lastState) return;

      lastState = nextState;
      listener(nextState);
    };

    const scheduleEmit = () => {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(emitIfChanged, 50);
    };

    const observer = new MutationObserver(scheduleEmit);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-testid', 'id'],
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }
}

function isVisibleElement(element: HTMLElement) {
  if (element.hidden) return false;
  if (element.getAttribute('data-state') === 'closed') return false;

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  if (element.id.startsWith('modal-') || element.dataset.testid?.startsWith('modal-')) return true;

  const rect = element.getBoundingClientRect();

  return rect.width > 0 || rect.height > 0 || element.offsetParent !== null || style.position === 'fixed';
}
