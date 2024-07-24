import React, { FC, useRef } from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import { EnvVars } from 'lib/env';

import { TakeAds } from './takeads';
import { Daum } from './takeads/types';

export function replaceGoogleAds(localAds: Daum[]) {
  if (localAds.find(ad => ad.hostname === window.location.hostname)) {
    console.warn('HOST IS IN ADS LIST');
    return;
  }

  const links = document.querySelectorAll('a');
  const anchorsElements = Array.from(links);
  console.log('Found anchors:', anchorsElements);

  // if href of <a> tag is not empty, replace it with our ad
  for (const aElem of anchorsElements) {
    const ad = localAds.find(ad => compareDomains(ad.websiteUrl, aElem.href));

    if (ad) processAnchorElement(aElem, ad);
  }
}

const takeads = new TakeAds(EnvVars.TAKE_ADS_TOKEN);

async function processAnchorElement(aElem: HTMLAnchorElement, adData: Daum) {
  const dirtyLink = new URL(aElem.href);
  const cleanLink = dirtyLink.origin + dirtyLink.pathname;

  console.log('LINK', cleanLink);

  // const newLinkData = await sendRequestToBackground(cleanLink);
  const newLinkData = await takeads.affiliateLinks([cleanLink]);
  console.log('NEW LINK DATA', newLinkData);

  const newLink = newLinkData.data[0]!.deeplink;
  const showHref = newLinkData.data[0]!.iri;

  console.log('ADS CHANGED', aElem, newLink);

  console.log('OLD_LINK', aElem);

  const parent = createRoot(aElem.parentElement as Element);
  console.log('PARENT', parent);
  parent.render(<ReactLink showHref={showHref} html={aElem.innerHTML} href={newLink} />);

  await browser.runtime.sendMessage({
    type: 'AD_VIEWED',
    payload: {
      pricing_model: adData.pricingModel
    }
  });
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

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();

    await browser.runtime.sendMessage({
      type: 'AD_CLICKED',
      payload: {
        host: window.location.host,
        url: showHref
      }
    });

    window.open(href, '_self');
  };

  const onRightClick: React.MouseEventHandler<HTMLAnchorElement> = event => {
    // linkRef.current!.href = href;
    event.currentTarget.href = href;

    browser.runtime.sendMessage({
      type: 'AD_CONTEXT_MENU_CLICKED',
      payload: {
        host: window.location.host,
        url: showHref
      }
    });
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
