import React, { FC } from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import type { AffiliateResponse } from 'lib/apis/takeads';
import { ContentScriptType } from 'lib/constants';
import { IS_MAC_OS } from 'lib/env';
import { isTruthy } from 'lib/utils';

export const PAGE_DOMAIN = stripSubdomain(window.location.hostname, 'www');
const TEMPLE_WALLET_ANCHOR_ATTRIBUTE = 'data-tw-referral';

/**
 * TODO: Account for subdomains like `sale.aliexpress.com`
 */
export async function processAnchors(supportedDomains: Set<string>) {
  const anchors = Array.from(document.querySelectorAll('a'));
  if (!anchors.length) throw new Error('No anchors found');

  const items = anchors
    .map(aElem => {
      if (aElem.hasAttribute(TEMPLE_WALLET_ANCHOR_ATTRIBUTE)) return null;

      const urlDomain = getDomain(aElem.href);
      if (!urlDomain || !supportedDomains.has(urlDomain)) return null;

      const iri = cleanLink(aElem.href);
      if (!iri) return null;

      return { iri, aElem, urlDomain };
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

  console.info('Replacing', takeadsItems.data.length, 'referrlas');

  for (const { iri, aElem, urlDomain } of items) {
    const referralUrl = takeadsItems.data.find(item => item.iri === iri)?.trackingLink;

    if (!referralUrl) {
      console.warn('No affiliate link for', aElem);
      continue;
    }

    processAnchorElement({ iri, aElem, urlDomain, referralUrl });
  }

  return;
}

interface PreppedItem {
  iri: string;
  aElem: HTMLAnchorElement;
  urlDomain: string;
  referralUrl: string;
}

function processAnchorElement(item: PreppedItem) {
  const { aElem, urlDomain, referralUrl } = item;

  const showHref = aElem.href;

  console.info('Replacing referral:', showHref, 'to', referralUrl, 'for anchor:', aElem);

  const parent = createRoot(aElem.parentElement!);

  parent.render(
    <ReactLink html={aElem.innerHTML} referralUrl={referralUrl} showHref={showHref} urlDomain={urlDomain} />
  );
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

function stripSubdomain(hostname: string, subdomain: string) {
  if (hostname.includes(`${subdomain}.`)) {
    return hostname.slice(subdomain.length + 1);
  }

  return hostname;
}

interface ReactLinkProps {
  html: string;
  referralUrl: string;
  showHref: string;
  urlDomain: string;
}

const ReactLink: FC<ReactLinkProps> = ({ html, referralUrl, showHref, urlDomain }) => {
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    event.preventDefault();

    console.log('Referral clicked:', showHref, '->', referralUrl);

    browser.runtime.sendMessage({
      type: ContentScriptType.ReferralClick,
      urlDomain,
      pageDomain: PAGE_DOMAIN
    });

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
