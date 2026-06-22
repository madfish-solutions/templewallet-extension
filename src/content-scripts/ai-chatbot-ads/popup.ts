import { AI_CHATBOT_ADS_HOST_ID, AI_CHATBOT_ADS_TIMING } from './constants';

export type AiChatbotAdsPopupAction = 'enable' | 'dismiss' | 'timeout';

interface AiChatbotAdsPopupProps {
  text: string;
  onAction: (action: AiChatbotAdsPopupAction) => void;
  onClosed: () => void;
}

export function mountAiChatbotAdsPopup({
  text,
  onAction,
  onClosed
}: AiChatbotAdsPopupProps): (action?: AiChatbotAdsPopupAction) => void {
  const host = document.createElement('div');
  host.id = AI_CHATBOT_ADS_HOST_ID;
  host.style.cssText = ['all: initial', 'position: fixed', 'z-index: 2147483647', 'pointer-events: none'].join(';');
  document.body.appendChild(host);

  const cleanupPosition = positionHost(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'temple-nudge';
  container.innerHTML = `
    <div class="temple-copy">${formatCopy(text)}</div>
    <button class="temple-enable" type="button">Enable now</button>
    <button class="temple-close" type="button" title="Close">x</button>
    <div class="temple-countdown" aria-hidden="true"></div>
  `;
  shadow.appendChild(container);

  const enableButton = container.querySelector<HTMLButtonElement>('.temple-enable');
  const closeButton = container.querySelector<HTMLButtonElement>('.temple-close');
  const countdown = container.querySelector<HTMLDivElement>('.temple-countdown');

  let closed = false;
  let paused = false;
  let remainingMs: number = AI_CHATBOT_ADS_TIMING.visibleWindowMs;
  let lastStartedAt = Date.now();
  let animationFrame: number | null = null;

  const stopCountdown = () => {
    if (animationFrame != null) window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };

  const close = (action?: AiChatbotAdsPopupAction) => {
    if (closed) return;
    closed = true;
    stopCountdown();
    cleanupPosition();
    if (action) onAction(action);

    container.classList.add('temple-nudge-exiting');
    container.classList.remove('temple-nudge-visible');
    window.setTimeout(() => {
      host.remove();
      onClosed();
    }, AI_CHATBOT_ADS_TIMING.exitMs);
  };

  const tick = () => {
    if (closed || paused) return;

    const elapsed = Date.now() - lastStartedAt;
    const nextRemaining = Math.max(0, remainingMs - elapsed);
    const progress = nextRemaining / AI_CHATBOT_ADS_TIMING.visibleWindowMs;

    if (countdown) countdown.style.width = `${Math.max(0, Math.min(1, progress)) * 100}%`;

    if (nextRemaining <= 0) {
      close('timeout');
      return;
    }

    animationFrame = window.requestAnimationFrame(tick);
  };

  container.addEventListener('mouseenter', () => {
    if (closed || paused) return;
    paused = true;
    remainingMs = Math.max(0, remainingMs - (Date.now() - lastStartedAt));
    stopCountdown();
  });

  container.addEventListener('mouseleave', () => {
    if (closed || !paused) return;
    paused = false;
    lastStartedAt = Date.now();
    animationFrame = window.requestAnimationFrame(tick);
  });

  enableButton?.addEventListener('click', () => close('enable'));
  closeButton?.addEventListener('click', () => close('dismiss'));

  window.requestAnimationFrame(() => {
    if (closed) return;
    container.classList.add('temple-nudge-visible');
    animationFrame = window.requestAnimationFrame(tick);
  });

  return () => close();
}

function positionHost(host: HTMLDivElement): () => void {
  const updatePosition = () => {
    const main = document.querySelector('main');
    const rect = (main ?? document.body).getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = Math.max(88, rect.top + 94);

    host.style.left = `${left}px`;
    host.style.top = `${top}px`;
    host.style.transform = 'translateX(-50%)';
  };

  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);

  return () => {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
  };
}

function formatCopy(text: string): string {
  return escapeHtml(text).replace('20% revenue', '<strong>20% revenue</strong>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getStyles(): string {
  return `
    :host {
      all: initial;
    }

    .temple-nudge {
      align-items: center;
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.14);
      box-sizing: border-box;
      color: #7b7f87;
      display: flex;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 15px;
      font-weight: 400;
      gap: 12px;
      line-height: 20px;
      max-width: min(820px, calc(100vw - 40px));
      min-height: 56px;
      opacity: 0;
      overflow: hidden;
      padding: 10px 16px 10px 22px;
      pointer-events: auto;
      position: relative;
      transition: opacity ${AI_CHATBOT_ADS_TIMING.entranceMs}ms cubic-bezier(0.2, 0.8, 0.2, 1);
      width: max-content;
    }

    .temple-nudge-visible {
      opacity: 1;
    }

    .temple-nudge-exiting {
      opacity: 0;
      transition-duration: ${AI_CHATBOT_ADS_TIMING.exitMs}ms;
    }

    .temple-copy {
      min-width: 0;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .temple-copy strong {
      color: #1d7afc;
      font-weight: 700;
    }

    .temple-enable {
      appearance: none;
      background: #1d7afc;
      border: 0;
      border-radius: 7px;
      color: #ffffff;
      cursor: pointer;
      flex: 0 0 auto;
      font: inherit;
      font-weight: 700;
      line-height: 20px;
      padding: 7px 13px;
    }

    .temple-enable:hover {
      background: #1166dd;
    }

    .temple-enable:focus-visible,
    .temple-close:focus-visible {
      outline: 2px solid rgba(29, 122, 252, 0.42);
      outline-offset: 2px;
    }

    .temple-close {
      appearance: none;
      background: transparent;
      border: 0;
      color: #a8adb5;
      cursor: pointer;
      flex: 0 0 auto;
      font: inherit;
      font-size: 26px;
      font-weight: 300;
      line-height: 20px;
      padding: 2px 0 4px;
    }

    .temple-close:hover {
      color: #6b7280;
    }

    .temple-countdown {
      background: #1d7afc;
      bottom: 0;
      height: 2px;
      left: 0;
      position: absolute;
      width: 100%;
    }

    @media (max-width: 720px) {
      .temple-nudge {
        align-items: stretch;
        flex-wrap: wrap;
        font-size: 14px;
        gap: 8px;
        min-height: 0;
        padding: 10px 12px;
        width: min(420px, calc(100vw - 24px));
      }

      .temple-copy {
        flex: 1 1 100%;
      }
    }
  `;
}
