import React, { useEffect, useState } from 'react';

import clsx from 'clsx';

import { ReactComponent as SadSearchIcon } from 'app/icons/monochrome/sad-search.svg';
import type { ChartPoint } from 'lib/temple/back/web-widgets/fetch-token-market';
import type { ResolvedAsset } from 'lib/temple/back/web-widgets/resolve-asset';
import { TempleChainKind } from 'temple/types';

import type { TagData } from '../../engine/types';
import * as messaging from '../../messaging';

import { BuyButton } from './BuyButton';
import { CardAd } from './CardAd';
import { CardHeader } from './CardHeader';
import { ChainBadge } from './ChainBadge';
import { MiniChart } from './MiniChart';
import { grantAdPermit, readAdPermit, subscribeAdPermitGranted } from './permit';
import { SwapButton } from './SwapButton';
import { formatPrice, TickerInfo, TickerInfoPanel } from './TickerInfoPanel';
import { WelcomeOverlay } from './WelcomeOverlay';

interface TickerPlaceholderCardProps {
  tagData: TagData;
  onClose: EmptyFn;
}

const ThreeDotsIcon = () => (
  <svg className="tw-card__more-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="7" r="1.1" fill="currentColor" />
    <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    <circle cx="12" cy="17" r="1.1" fill="currentColor" />
  </svg>
);

export const TickerPlaceholderCard = ({ tagData, onClose }: TickerPlaceholderCardProps) => {
  const symbol = tagData.label;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [info, setInfo] = useState<TickerInfo | null>(null);
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [resolved, setResolved] = useState<ResolvedAsset | null>(null);
  const [buyTarget, setBuyTarget] = useState<{ chainKind: TempleChainKind; chainId: string; fiat: string } | null>(
    null
  );
  const [permit, setPermit] = useState(false);
  const [adUrl, setAdUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    messaging
      .getCoinsBySymbol()
      .then(coins => {
        if (!active) return;
        const entry = coins[symbol.toUpperCase()];
        if (!entry) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setInfo({
          price: entry.price,
          change24h: entry.change24h,
          marketCap: entry.marketCap,
          fdv: entry.fdv,
          volume: entry.volume,
          high24: entry.high24,
          low24: entry.low24
        });
        setLoading(false);

        messaging
          .fetchTokenChart(entry.id)
          .then(points => {
            if (active) setSeries(points);
          })
          .catch(() => {})
          .finally(() => {
            if (active) setChartLoading(false);
          });

        messaging
          .resolveAsset(entry.id)
          .then(result => {
            if (active) setResolved(result);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (!resolved || !resolved.resolved || resolved.swappable) return;

    let active = true;
    const { chainKind, chainId } = resolved;

    messaging
      .getBuyPreselect(symbol, chainKind, chainId)
      .then(result => {
        if (active && result.supported) setBuyTarget({ chainKind, chainId, fiat: result.fiat });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [resolved, symbol]);

  useEffect(() => {
    let active = true;

    messaging.trackWebWidgetEvent('Web Token Widget / View').catch(() => {});

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

    const unsubscribe = subscribeAdPermitGranted(() => {
      if (active) setPermit(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleContinue = () => {
    void grantAdPermit();
    setPermit(true);
    messaging.trackWebWidgetEvent('Web Token Widget / Agreement').catch(() => {});
  };

  const handleSnooze = () => {
    messaging.trackWebWidgetEvent('Web Token Widget / Snooze').catch(() => {});
    messaging.snoozeWebWidgets().catch(() => {});
    onClose();
  };
  const handleDisable = () => {
    messaging.trackWebWidgetEvent('Web Token Widget / Disable').catch(() => {});
    messaging.disableWebWidgets().catch(() => {});
    onClose();
  };

  if (loading) {
    return (
      <div className="tw-card">
        <CardHeader menuIcon={<ThreeDotsIcon />} onClose={onClose} onSnooze={handleSnooze} onDisable={handleDisable} />
        <div className="tw-card__loader">
          <div className="tw-card__spinner-box">
            <span className="tw-card__spinner" />
          </div>
          <div className="tw-card__loading-text">Loading token...</div>
        </div>
        {permit ? <CardAd adUrl={adUrl} /> : <div className="tw-card__ad-placeholder" />}
      </div>
    );
  }

  if (notFound || !info) {
    return (
      <div className="tw-card">
        <CardHeader menuIcon={<ThreeDotsIcon />} onClose={onClose} onSnooze={handleSnooze} onDisable={handleDisable} />
        <div className="tw-card__loader">
          <SadSearchIcon className="tw-card__sadface" />
          <div className="tw-card__state-text tw-card__state-text--bold">Couldn't find anything about this token</div>
        </div>
        {permit ? <CardAd adUrl={adUrl} /> : <div className="tw-card__ad-placeholder" />}
      </div>
    );
  }

  const resolvedAsset = resolved && resolved.resolved ? resolved : null;
  const swappableTarget = resolvedAsset && resolvedAsset.swappable ? resolvedAsset : null;

  return (
    <div className="tw-card">
      <CardHeader
        tokenSymbol={tagData.label}
        tokenAvatarUrl={tagData.iconUrl}
        chainBadge={
          resolvedAsset ? (
            <ChainBadge
              chainKind={resolvedAsset.chainKind}
              chainId={resolvedAsset.chainId}
              className="tw-card__token-chain"
            />
          ) : null
        }
        copyContract={resolvedAsset && resolvedAsset.contract ? resolvedAsset.contract : undefined}
        menuIcon={<ThreeDotsIcon />}
        onClose={onClose}
        onSnooze={handleSnooze}
        onDisable={handleDisable}
      />
      <div className={clsx('tw-card__panel', !permit && 'tw-card__body--blurred')}>
        <div className="tw-card__ticker-row">
          <TickerInfoPanel market={info} />
          <div className="tw-card__chart">
            {chartLoading ? (
              <div className="tw-card__chart-loader">
                <span className="tw-card__spinner" />
              </div>
            ) : (
              <MiniChart
                data={series}
                width={202}
                height={108}
                highLabel={info.high24 != null ? formatPrice(info.high24) : undefined}
                lowLabel={info.low24 != null ? formatPrice(info.low24) : undefined}
              />
            )}
          </div>
        </div>
        {swappableTarget ? (
          <SwapButton
            chainKind={swappableTarget.chainKind}
            chainId={swappableTarget.chainId}
            assetSlug={swappableTarget.assetSlug}
          />
        ) : buyTarget ? (
          <BuyButton
            symbol={symbol}
            chainKind={buyTarget.chainKind}
            chainId={buyTarget.chainId}
            fiat={buyTarget.fiat}
          />
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
