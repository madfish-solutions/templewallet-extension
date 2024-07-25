import React, { FC, useRef } from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { ContentScriptType } from 'lib/constants';
import { AffiliateLink, AffiliateResponse, Daum } from 'lib/takeads/types';

export function replaceGoogleAds(localAds: Daum[]) {
  if (localAds.find(ad => ad.hostname === window.location.hostname)) {
    console.warn('HOST IS IN ADS LIST');
    return;
  }

  const anchorsElements = Array.from(document.querySelectorAll('a'));
  console.log('Found anchors:', anchorsElements);

  for (const aElem of anchorsElements) {
    const ad = localAds.find(ad => compareDomains(ad.websiteUrl, aElem.href));

    if (ad)
      processAnchorElement(aElem, ad).catch(error => {
        console.error('Error while replacing referral link:', error);
      });
  }
}

async function processAnchorElement(aElem: HTMLAnchorElement, adData?: Daum) {
  console.log('Processing referrals for:', adData, aElem);

  const dirtyLink = new URL(aElem.href);
  const cleanLink = dirtyLink.origin + dirtyLink.pathname;

  console.log('Link:', dirtyLink, '->', cleanLink);

  // Not requesting directly because of CORS.
  const takeadsItems: AffiliateResponse = await browser.runtime.sendMessage({
    type: ContentScriptType.FetchReferrals,
    linkUrl: cleanLink
  });
  console.log('TakeAds data:', takeadsItems);

  const takeadAd = takeadsItems.data[0] as AffiliateLink | undefined;

  if (!takeadAd) return console.warn('No affiliate link for', dirtyLink.href, '@', window.location.href);

  const newLink = takeadAd.trackingLink;
  const showHref = takeadAd.iri;

  console.info(
    'Replacing referral:',
    dirtyLink.href,
    'to show',
    showHref,
    'and link to',
    newLink,
    '@',
    window.location.href,
    'with pricing model',
    adData?.pricingModel
  );

  const parent = createRoot(aElem.parentElement!);

  parent.render(<ReactLink showHref={showHref} html={aElem.innerHTML} href={newLink} />);
}

const skeepSubdomain = (hostname: string, subdomain: string) => {
  if (hostname.includes(`${subdomain}.`)) {
    return hostname.slice(subdomain.length + 1);
  }

  return hostname;
};

const compareDomains = (url1: string, url2: string) => {
  try {
    const URL1 = new URL(url1);
    const URL2 = new URL(url2);
    const hostname1 = skeepSubdomain(URL1.hostname, 'www');
    const hostname2 = skeepSubdomain(URL2.hostname, 'www');

    return hostname1 === hostname2;
  } catch (e) {
    return false;
  }
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

    window.open(href, '_self');
  };

  const onRightClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    // linkRef.current!.href = href;
    event.currentTarget.href = href;

    console.log('Takead ad context menu:', showHref, '@', window.location.href);
  };

  return (
    <a
      onContextMenu={onRightClick}
      onClick={handleClick}
      ref={linkRef}
      href={showHref}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
