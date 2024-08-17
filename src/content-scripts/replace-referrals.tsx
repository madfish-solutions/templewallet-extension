import React, { FC } from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import type { AffiliateResponse } from 'lib/apis/takeads';
import { ContentScriptType } from 'lib/constants';
import { IS_MAC_OS } from 'lib/env';
import { isTruthy } from 'lib/utils';

const TEMPLE_WALLET_ANCHOR_ATTRIBUTE = 'data-tw-referral';

interface PreppedItem {
  iri: string;
  aElem: HTMLAnchorElement;
  trackingUrl: string;
}

/**
 * TODO: Account for subdomains like `sale.aliexpress.com`
 */
export async function processAnchors(supportedDomains: Set<string>) {
  const anchors = Array.from(document.querySelectorAll('a'));
  if (!anchors.length) throw new Error('No anchors found');

  const items = anchors
    .map(aElem => {
      if (aElem.hasAttribute(TEMPLE_WALLET_ANCHOR_ATTRIBUTE)) return null;

      const aDomain = getDomain(aElem.href);
      if (!aDomain || !supportedDomains.has(aDomain)) return null;

      const iri = cleanLink(aElem.href);
      if (!iri) return null;

      return { iri, aElem };
    })
    .filter(isTruthy);

  if (!items.length) return void console.info('Nothing to replace');

  const links = items.map(l => l.iri);

  // Not requesting directly in content script because of CORS.
  const takeadsItems: AffiliateResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferrals,
    links
  });

  if (!takeadsItems.data.length) return void console.info('No referrals received');

  for (const { iri, aElem } of items) {
    const trackingUrl = takeadsItems.data.find(item => item.iri === iri)?.trackingLink;

    if (!trackingUrl) {
      console.warn('No affiliate link for', aElem);
      continue;
    }

    processAnchorElement({ iri, aElem, trackingUrl });
  }

  return;
}

function processAnchorElement(item: PreppedItem) {
  const { aElem } = item;

  const referralUrl = item.trackingUrl;
  const showHref = aElem.href;

  console.info('Replacing referral:', showHref, 'to', referralUrl, 'for anchor:', aElem);

  const parent = createRoot(aElem.parentElement!);

  parent.render(<ReactLink html={aElem.innerHTML} referralUrl={referralUrl} showHref={showHref} />);
}

function getDomain(href: string) {
  try {
    return stripSubdomain(new URL(href).hostname, 'www');
  } catch {
    return null;
  }
}

function cleanLink(href: string) {
  try {
    const dirtyLink = new URL(href);

    return dirtyLink.origin + dirtyLink.pathname;
  } catch {
    return null;
  }
}

export const stripSubdomain = (hostname: string, subdomain: string) => {
  if (hostname.includes(`${subdomain}.`)) {
    return hostname.slice(subdomain.length + 1);
  }

  return hostname;
};

interface ReactLinkProps {
  html: string;
  referralUrl: string;
  showHref: string;
}

const ReactLink: FC<ReactLinkProps> = ({ html, referralUrl, showHref }) => {
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    event.preventDefault();

    console.log('Referral clicked:', showHref, '->', referralUrl);

    const newTab = IS_MAC_OS ? event.metaKey : event.ctrlKey;

    window.open(referralUrl, newTab ? '_blank' : '_self');
  };

  return (
    <a
      onClick={onClick}
      href={showHref}
      dangerouslySetInnerHTML={{ __html: html }}
      {...{ [TEMPLE_WALLET_ANCHOR_ATTRIBUTE]: 'set' }}
    />
  );
};
