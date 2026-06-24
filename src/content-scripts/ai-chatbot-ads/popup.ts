import { AI_CHATBOT_ADS_HOST_ID, AI_CHATBOT_ADS_TIMING } from './constants';

const POPUP_STAYS_VISIBLE_FOR_TESTS = true;

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
    <button class="temple-close" type="button" title="Close">${closeIcon}</button>
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
    if (POPUP_STAYS_VISIBLE_FOR_TESTS) return;

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
    if (POPUP_STAYS_VISIBLE_FOR_TESTS) return;
    paused = true;
    remainingMs = Math.max(0, remainingMs - (Date.now() - lastStartedAt));
    stopCountdown();
  });

  container.addEventListener('mouseleave', () => {
    if (closed || !paused) return;
    if (POPUP_STAYS_VISIBLE_FOR_TESTS) return;
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
    const top = Math.max(0, rect.top - 2);

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
  return escapeHtml(text)
    .replace('20% revenue', '<strong>20% revenue</strong>')
    .replace('20% promo revenue', '<strong>20% promo revenue</strong>');
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
      height: 40px;
      max-width: calc(100vw - 40px);
      opacity: 0;
      overflow: hidden;
      padding: 8px 16px 8px 22px;
      pointer-events: auto;
      position: relative;
      transition: opacity ${AI_CHATBOT_ADS_TIMING.entranceMs}ms cubic-bezier(0.2, 0.8, 0.2, 1);
      width: 675px;
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
      align-items: center;
      appearance: none;
      background: transparent;
      border: 0;
      color: #a8adb5;
      cursor: pointer;
      display: inline-flex;
      flex: 0 0 auto;
      height: 24px;
      justify-content: center;
      padding: 0;
      width: 24px;
    }

    .temple-close svg {
      display: block;
      height: 8px;
      width: 8px;
    }

    .temple-close:hover {
      color: #6b7280;
    }

    .temple-countdown {
      background: #1d7afc;
      height: 2px;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }

    @media (max-width: 720px) {
      .temple-nudge {
        font-size: 14px;
        gap: 8px;
        padding: 8px 12px;
        width: calc(100vw - 24px);
      }

      .temple-copy {
        flex: 1 1 100%;
      }
    }
  `;
}

const closeIcon = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.95117 0.170898C7.02279 0.0992839 7.10417 0.0537109 7.19531 0.0341797C7.28971 0.0113932 7.38249 0.0113932 7.47363 0.0341797C7.56803 0.0569661 7.65267 0.104167 7.72754 0.175781C7.7959 0.244141 7.84147 0.325521 7.86426 0.419922C7.8903 0.514323 7.8903 0.608724 7.86426 0.703125C7.84147 0.794271 7.7959 0.875651 7.72754 0.947266L0.950195 7.72461C0.881836 7.79297 0.800456 7.83854 0.706055 7.86133C0.614909 7.88411 0.522135 7.88411 0.427734 7.86133C0.333333 7.83854 0.248698 7.79134 0.173828 7.71973C0.102214 7.65137 0.055013 7.56999 0.0322266 7.47559C0.0094401 7.38118 0.0094401 7.28678 0.0322266 7.19238C0.0582682 7.09798 0.105469 7.01823 0.173828 6.95312L6.95117 0.170898ZM7.72754 6.94824C7.7959 7.01986 7.84147 7.10286 7.86426 7.19727C7.88704 7.28841 7.88704 7.38118 7.86426 7.47559C7.84147 7.56999 7.7959 7.65137 7.72754 7.71973C7.65592 7.79134 7.57292 7.83854 7.47852 7.86133C7.38411 7.88411 7.28971 7.88411 7.19531 7.86133C7.10091 7.83854 7.01953 7.79297 6.95117 7.72461L0.173828 0.942383C0.105469 0.877279 0.0598958 0.797526 0.0371094 0.703125C0.0143229 0.608724 0.0143229 0.514323 0.0371094 0.419922C0.0598958 0.325521 0.105469 0.244141 0.173828 0.175781C0.245443 0.104167 0.328451 0.0569661 0.422852 0.0341797C0.517253 0.0113932 0.611654 0.0113932 0.706055 0.0341797C0.800456 0.0569661 0.881836 0.102539 0.950195 0.170898L7.72754 6.94824Z" fill="#AEAEB2"/>
</svg>`;
