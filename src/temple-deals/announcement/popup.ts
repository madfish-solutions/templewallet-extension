import { TEMPLE_ICON } from 'content-scripts/constants';

import { MERCHANTS_IMG } from './assets';
import { CLOSE_ICON } from './icons';
import { el, msg } from './utils';

async function playSuccessAnimation(target: HTMLElement) {
  const [{ default: lottie }, { default: doneAnimation }] = await Promise.all([
    import('lottie-web'),
    import('app/atoms/done-animation/done-animation.json')
  ]);
  lottie.loadAnimation({
    container: target,
    animationData: doneAnimation,
    loop: false,
    autoplay: true,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  });
}

function buildHeader(container: HTMLElement, onClose: () => void) {
  const header = el('div', 'tw-deals-header');

  const templeIcon = document.createElement('img');
  templeIcon.className = 'tw-deals-temple-icon';
  templeIcon.src = TEMPLE_ICON;
  templeIcon.alt = '';
  header.appendChild(templeIcon);

  const title = el('span', 'tw-deals-title', msg('templeDeals'));
  header.appendChild(title);

  const closeBtn = el('button', 'tw-deals-close-btn');
  closeBtn.innerHTML = CLOSE_ICON;
  closeBtn.addEventListener('click', onClose);
  header.appendChild(closeBtn);

  container.appendChild(header);
}

export function renderPreActivationState(
  container: HTMLElement,
  callbacks: { onActivate: () => void; onClose: () => void }
) {
  container.textContent = '';

  buildHeader(container, callbacks.onClose);

  const body = el('div', 'tw-deals-body');

  const content = el('div', 'tw-deals-content');

  const hero = el('div', 'tw-deals-hero');

  const heroImg = document.createElement('img');
  heroImg.className = 'tw-deals-hero-img';
  heroImg.src = MERCHANTS_IMG;
  heroImg.alt = '';
  hero.appendChild(heroImg);

  hero.appendChild(el('div', 'tw-deals-offer-title', msg('upTo25CashbackInUSDT')));

  content.appendChild(hero);
  content.appendChild(el('div', 'tw-deals-offer-body', msg('cashbackTagline')));
  body.appendChild(content);

  const activateBtn = el('button', 'tw-deals-activate-btn', msg('activateCashback'));
  activateBtn.addEventListener('click', callbacks.onActivate);
  body.appendChild(activateBtn);

  const disclaimer = el('div', 'tw-deals-disclaimer', msg('cashbackParticipationDisclaimer'));
  body.appendChild(disclaimer);

  container.appendChild(body);
}

export function renderPostActivationState(
  container: HTMLElement,
  callbacks: { onGotIt: () => void; onClose: () => void }
) {
  container.textContent = '';

  buildHeader(container, callbacks.onClose);

  const successContainer = el('div', 'tw-deals-success-container');

  const animTarget = el('div', 'tw-deals-success-anim');
  successContainer.appendChild(animTarget);
  playSuccessAnimation(animTarget).catch(() => {});

  successContainer.appendChild(el('div', 'tw-deals-success-title', msg('cashbackActivated')));
  successContainer.appendChild(el('div', 'tw-deals-success-body', msg('cashbackActivatedReloadHint')));

  const gotItBtn = el('button', 'tw-deals-got-it-btn', msg('gotIt'));
  gotItBtn.addEventListener('click', callbacks.onGotIt);
  successContainer.appendChild(gotItBtn);

  container.appendChild(successContainer);
}
