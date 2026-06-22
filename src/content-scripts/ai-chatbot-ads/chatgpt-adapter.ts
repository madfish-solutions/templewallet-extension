import { AiChatbotAnswerState } from './scheduler';

const SUBMIT_BUTTON_SELECTOR = '#composer-submit-button.composer-submit-btn';
const SEND_BUTTON_SELECTOR = `${SUBMIT_BUTTON_SELECTOR}[data-testid="send-button"]`;
const STOP_BUTTON_SELECTOR = `${SUBMIT_BUTTON_SELECTOR}[data-testid="stop-button"]`;

type AnswerStateListener = (state: AiChatbotAnswerState) => void;

export interface AiChatbotAdapter {
  getAnswerState(): AiChatbotAnswerState;
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
