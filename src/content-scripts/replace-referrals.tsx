import React, { FC, useRef } from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import type { AffiliateResponse } from 'lib/apis/takeads';
import { ContentScriptType } from 'lib/constants';
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
  const items = Array.from(document.querySelectorAll('a'))
    .map(aElem => {
      const aDomain = getDomain(aElem.href);
      if (!aDomain || !supportedDomains.has(aDomain)) return null;

      const iri = cleanLink(aElem.href);
      if (!iri) return null;

      return { iri, aElem };
    })
    .filter(isTruthy);

  if (!items.length) throw new Error('No anchors found');

  // Not requesting directly because of CORS.
  const takeadsItems: AffiliateResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferrals,
    links: items.map(l => l.iri)
  });

  if (!takeadsItems.data.length) return void console.info('No referrals received');

  for (const { iri, aElem } of items) {
    if (aElem.hasAttribute(TEMPLE_WALLET_ANCHOR_ATTRIBUTE)) continue;

    const trackingUrl = takeadsItems.data.find(item => item.iri === iri)?.trackingLink;

    if (!trackingUrl) {
      console.warn('No affiliate link for', aElem);
      continue;
    }

    processAnchorElement({ iri, aElem, trackingUrl }); // TODO: Return these promises batched ?
  }
}

async function processAnchorElement(item: PreppedItem) {
  const { aElem } = item;
  aElem.setAttribute(TEMPLE_WALLET_ANCHOR_ATTRIBUTE, 'loading');

  const newLink = item.trackingUrl;
  const showHref = item.iri;

  console.info(
    'Replacing referral:',
    aElem.href,
    'to show',
    showHref,
    'and link to',
    newLink,
    '@',
    window.location.href,
    'aElem:',
    aElem
  );

  const parent = createRoot(aElem.parentElement!);

  parent.render(<ReactLink showHref={showHref} html={aElem.innerHTML} href={newLink} />);
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
  showHref: string;
  href: string;
}

const ReactLink: FC<ReactLinkProps> = ({ html, href, showHref }) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Takead ad clicked:', showHref, '@', window.location.href);

    window.open(href, '_self'); // Make sure if it works in Firefox
    // Make sure, users can open links in new tab (Ctl/Cmd + Click)
  };

  const onRightClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    event.currentTarget.href = href; // Needed to preserve copiable original link in context menu

    console.log('Takead ad context menu:', showHref, '@', window.location.href);
  };

  return (
    <a
      onContextMenu={onRightClick}
      onClick={handleClick}
      ref={linkRef}
      href={showHref}
      dangerouslySetInnerHTML={{ __html: html }}
      {...{ [TEMPLE_WALLET_ANCHOR_ATTRIBUTE]: 'set' }}
    />
  );
};
