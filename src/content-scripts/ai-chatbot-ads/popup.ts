import { AI_CHATBOT_ADS_HOST_ID, AI_CHATBOT_ADS_TIMING } from './constants';
import { getStyles } from './styles';

const POPUP_STAYS_VISIBLE_FOR_TESTS = true;
const POPUP_FONT_TEXT =
  ' _-,;:!?.\'"()[]{}@*/\\&#%`+<>|~≈$£¥€₴₺₿0123456789aAbBcCçdDeEéèfFgGhHiIıjJkKlLmMnNoOõpPqQrRsSştTuUvVwWxXyYzZ';
const POPUP_FONT_URL = `https://fonts.googleapis.com/css2?family=Inter:wght@300;500&display=swap&text=${encodeURIComponent(
  POPUP_FONT_TEXT
)}`;

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

  injectAiChatbotAdsPopupFont();

  const cleanupPosition = positionHost(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  const container = document.createElement('div');
  container.className = 'temple-nudge';
  container.innerHTML = `
    <div class="temple-countdown" aria-hidden="true"></div>
    <div class="temple-copy">${formatCopy(text)}</div>
    <button class="temple-enable">Enable now</button>
    <button class="temple-close">${closeIcon}</button>
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

function injectAiChatbotAdsPopupFont() {
  if (document.querySelector<HTMLLinkElement>(`link[href="${POPUP_FONT_URL}"]`)) return;

  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = POPUP_FONT_URL;
  document.head.appendChild(fontLink);
}

function positionHost(host: HTMLDivElement): () => void {
  const updatePosition = () => {
    const main = document.querySelector('main');
    const rect = (main ?? document.body).getBoundingClientRect();
    const left = rect.left + rect.width / 2;

    host.style.left = `${left}px`;
    host.style.top = '68px';
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
    .replace('20% revenue', '<span>20% revenue</span>')
    .replace('20% promo revenue', '<span>20% promo revenue</span>');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const closeIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.998 4.70508C11.0697 4.63346 11.151 4.58789 11.2422 4.56836C11.3366 4.54557 11.4294 4.54557 11.5205 4.56836C11.6149 4.59115 11.6995 4.63835 11.7744 4.70996C11.8428 4.77832 11.8883 4.8597 11.9111 4.9541C11.9372 5.0485 11.9372 5.1429 11.9111 5.2373C11.8883 5.32845 11.8428 5.40983 11.7744 5.48145L4.99707 12.2588C4.92871 12.3271 4.84733 12.3727 4.75293 12.3955C4.66178 12.4183 4.56901 12.4183 4.47461 12.3955C4.38021 12.3727 4.29557 12.3255 4.2207 12.2539C4.14909 12.1855 4.10189 12.1042 4.0791 12.0098C4.05632 11.9154 4.05632 11.821 4.0791 11.7266C4.10514 11.6322 4.15234 11.5524 4.2207 11.4873L10.998 4.70508ZM11.7744 11.4824C11.8428 11.554 11.8883 11.637 11.9111 11.7314C11.9339 11.8226 11.9339 11.9154 11.9111 12.0098C11.8883 12.1042 11.8428 12.1855 11.7744 12.2539C11.7028 12.3255 11.6198 12.3727 11.5254 12.3955C11.431 12.4183 11.3366 12.4183 11.2422 12.3955C11.1478 12.3727 11.0664 12.3271 10.998 12.2588L4.2207 5.47656C4.15234 5.41146 4.10677 5.33171 4.08398 5.2373C4.0612 5.1429 4.0612 5.0485 4.08398 4.9541C4.10677 4.8597 4.15234 4.77832 4.2207 4.70996C4.29232 4.63835 4.37533 4.59115 4.46973 4.56836C4.56413 4.54557 4.65853 4.54557 4.75293 4.56836C4.84733 4.59115 4.92871 4.63672 4.99707 4.70508L11.7744 11.4824Z" fill="#AEAEB2"/>
</svg>`;
