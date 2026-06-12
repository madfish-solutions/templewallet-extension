import React, { useEffect, useRef, useState } from 'react';

import * as messaging from '../../messaging';

interface CardAdProps {
  adUrl: string | null;
}

const SUCCESS_MESSAGE_TYPES = ['ready', 'resize', 'impression'];
const FAIL_TIMEOUT_MS = 6000;

const getMessageType = (data: unknown): string | undefined => {
  let value: unknown = data;
  if (typeof data === 'string') {
    try {
      value = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string') {
    return value.type;
  }
  return undefined;
};

export const CardAd = ({ adUrl }: CardAdProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const impressionFiredRef = useRef(false);
  const [adReady, setAdReady] = useState(false);
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    const failTimer = setTimeout(() => setAdFailed(true), FAIL_TIMEOUT_MS);

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const type = getMessageType(event.data);
      if (!type) return;

      if (SUCCESS_MESSAGE_TYPES.includes(type)) {
        clearTimeout(failTimer);
        setAdReady(true);
      }

      if (type === 'error') {
        clearTimeout(failTimer);
        setAdFailed(true);
      }

      if (type === 'impression' && !impressionFiredRef.current) {
        impressionFiredRef.current = true;
        messaging.postWidgetAdImpression('HypeLab').catch(() => {});
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      clearTimeout(failTimer);
      window.removeEventListener('message', onMessage);
    };
  }, []);

  if (!adUrl || adFailed) {
    return (
      <div className="tw-card__ad">
        <div className="tw-card__ad-fallback">Thanks for supporting Temple</div>
      </div>
    );
  }

  return (
    <div className="tw-card__ad">
      {adReady ? null : (
        <div className="tw-card__ad-loader">
          <span className="tw-card__spinner" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Ad"
        className="tw-card__ad-iframe"
        src={adUrl}
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
};
