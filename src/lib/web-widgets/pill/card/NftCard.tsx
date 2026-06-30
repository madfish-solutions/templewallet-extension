import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import { buildTokenImagesStack } from 'lib/images-uri';
import type { ObjktToken } from 'lib/temple/back/web-widgets/objkt-query';

import type { TagData } from '../../engine/types';
import * as messaging from '../../messaging';

import { CardAd } from './CardAd';
import { CardHeader } from './CardHeader';
import { deriveCardState } from './derive-card-state';
import { deriveHeader } from './derive-header';
import { InfoPanel } from './InfoPanel';
import { grantAdPermit, readAdPermit, subscribeAdPermitGranted } from './permit';
import { TrustRow } from './TrustRow';
import { WelcomeOverlay } from './WelcomeOverlay';

interface NftCardProps {
  tagData: TagData;
  onClose: EmptyFn;
}

const parseTokenRef = (href?: string): { contract: string; tokenId: string } => {
  if (!href) return { contract: '', tokenId: '' };
  const parts = href.split('/');
  return { contract: parts.at(-2) ?? '', tokenId: parts.at(-1) ?? '' };
};

const isObjktToken = (raw: unknown): raw is ObjktToken =>
  typeof raw === 'object' && raw !== null && 'listings_active' in raw;

export const NftCard = ({ tagData, onClose }: NftCardProps) => {
  const seed = isObjktToken(tagData.raw) ? tagData.raw : undefined;
  const { contract, tokenId } = parseTokenRef(tagData.href);
  const logoUri = seed?.fa?.logo ?? null;

  const [permit, setPermit] = useState(false);
  const [fiatRate, setFiatRate] = useState<number | null>(null);
  const [adUrl, setAdUrl] = useState<string | null>(null);
  const [owned, setOwned] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(tagData.iconUrl);
  const [token, setToken] = useState<ObjktToken | null>(seed ?? null);
  const [notFound, setNotFound] = useState(() => !seed && !(contract && tokenId));

  useEffect(() => {
    let active = true;

    messaging.trackWebWidgetEvent('Web NFT Widget / View').catch(() => {});

    readAdPermit().then(granted => {
      if (active && granted) setPermit(true);
    });

    messaging
      .getWidgetContext()
      .then(ctx => {
        if (!active) return;
        if (ctx.permitGranted) setPermit(true);
        setAdUrl(ctx.adUrl);
      })
      .catch(() => {});

    messaging
      .getTezFiatRate()
      .then(rate => {
        if (active) setFiatRate(rate);
      })
      .catch(() => {});

    if (contract && tokenId) {
      messaging
        .getWidgetOwnedCount(contract, tokenId)
        .then(count => {
          if (active) setOwned(count);
        })
        .catch(() => {});

      messaging
        .fetchObjktToken(contract, tokenId)
        .then(result => {
          if (!active) return;
          if (result) setToken(result);
          else if (!seed) setNotFound(true);
        })
        .catch(() => {
          if (active && !seed) setNotFound(true);
        });
    }

    const logoSrc = logoUri ? buildTokenImagesStack(logoUri)[0] : undefined;
    if (logoSrc) {
      messaging
        .fetchThumbnailBlob(logoSrc)
        .then(dataUrl => {
          if (active && dataUrl) setAvatarUrl(dataUrl);
        })
        .catch(() => {});
    }

    const unsubscribe = subscribeAdPermitGranted(() => {
      if (active) setPermit(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [contract, tokenId, logoUri, seed]);

  const handleContinue = () => {
    void grantAdPermit();
    setPermit(true);
    messaging.trackWebWidgetEvent('Web NFT Widget / Agreement').catch(() => {});
  };
  const handleSnooze = () => {
    messaging.trackWebWidgetEvent('Web NFT Widget / Snooze').catch(() => {});
    messaging.snoozeWebWidgets().catch(() => {});
    onClose();
  };
  const handleDisable = () => {
    messaging.trackWebWidgetEvent('Web NFT Widget / Disable').catch(() => {});
    messaging.disableWebWidgets().catch(() => {});
    onClose();
  };

  const headerData = deriveHeader(token, contract);
  const header = (
    <CardHeader
      collectionName={headerData.name}
      collectionHref={headerData.href}
      avatarUrl={avatarUrl}
      onClose={onClose}
      onSnooze={handleSnooze}
      onDisable={handleDisable}
    />
  );

  if (notFound) {
    return (
      <div className="tw-card">
        <CardHeader collectionName={null} onClose={onClose} onSnooze={handleSnooze} onDisable={handleDisable} />
        <div className="tw-card__body tw-card__body--state">
          <div className="tw-card__state">
            <SadSearchIcon className="tw-card__sadface" />
            <div className="tw-card__state-text tw-card__state-text--bold">Couldn't find anything about this NFT</div>
          </div>
        </div>
        {permit ? <CardAd adUrl={adUrl} /> : null}
      </div>
    );
  }

  if (!token) {
    return (
      <div className="tw-card">
        <CardHeader collectionName={null} onClose={onClose} onSnooze={handleSnooze} onDisable={handleDisable} />
        <div className="tw-card__body tw-card__body--state">
          <div className="tw-card__state">
            <div className="tw-card__spinner-box">
              <span className="tw-card__spinner" />
            </div>
            <div className="tw-card__loading-text">Loading NFT...</div>
          </div>
        </div>
        {permit ? <CardAd adUrl={adUrl} /> : null}
      </div>
    );
  }

  const state = deriveCardState(token);

  return (
    <div className="tw-card">
      {header}

      <div className={clsx('tw-card__body', !permit && 'tw-card__body--blurred')}>
        <TrustRow status={state.status} tokenId={tokenId} />
        <div className="tw-card__content">
          {tagData.iconUrl ? (
            <img className="tw-card__media" src={tagData.iconUrl} alt="" />
          ) : (
            <div className="tw-card__media tw-card__media--empty" />
          )}
          <InfoPanel name={token.name} state={state} fiatRate={fiatRate} owned={owned} />
        </div>
        {tagData.href ? (
          <a
            className="tw-card__cta"
            href={tagData.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => messaging.trackWebWidgetEvent('Web NFT Widget / Marketplace link').catch(() => {})}
          >
            View on objkt
            <OutLinkIcon className="tw-card__cta-icon" />
          </a>
        ) : null}
      </div>

      {permit ? (
        <CardAd adUrl={adUrl} />
      ) : (
        <>
          <div className="tw-card__ad-placeholder" />
          <WelcomeOverlay onContinue={handleContinue} />
        </>
      )}
    </div>
  );
};
