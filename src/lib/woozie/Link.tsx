import React, { AnchorHTMLAttributes, FC, MouseEventHandler, useCallback, useMemo } from 'react';

import { TestIDProps, useAnalytics, AnalyticsEventCategory } from 'lib/analytics';

import { USE_LOCATION_HASH_AS_URL } from './config';
import { HistoryAction, createUrl, changeState } from './history';
import { To, createLocationUpdates, useLocation } from './location';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, TestIDProps {
  to: To;
  replace?: boolean;
}

export const Link: FC<LinkProps> = ({ to, replace, trackID, trackProperties, ...rest }) => {
  const lctn = useLocation();
  const { trackEvent } = useAnalytics();

  const { pathname, search, hash, state } = useMemo(() => createLocationUpdates(to, lctn), [to, lctn]);

  const url = useMemo(() => createUrl(pathname, search, hash), [pathname, search, hash]);

  const href = useMemo(() => (USE_LOCATION_HASH_AS_URL ? `${window.location.pathname}#${url}` : url), [url]);

  const handleNavigate = useCallback(() => {
    trackID !== undefined && trackEvent(trackID, AnalyticsEventCategory.ButtonPress, trackProperties);
    const action =
      replace || url === createUrl(lctn.pathname, lctn.search, lctn.hash) ? HistoryAction.Replace : HistoryAction.Push;
    changeState(action, state, url);
  }, [replace, state, url, lctn, trackID, trackProperties, trackEvent]);

  return <LinkAnchor {...rest} href={href} onNavigate={handleNavigate} />;
};

interface LinkAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement>, TestIDProps {
  onNavigate: () => void;
  onClick?: MouseEventHandler;
  target?: string;
}

const LinkAnchor: FC<LinkAnchorProps> = ({
  children,
  onNavigate,
  onClick,
  target,
  trackID,
  trackProperties,
  ...rest
}) => {
  const { trackEvent } = useAnalytics();

  const handleClick = useCallback(
    (evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      trackID !== undefined && trackEvent(trackID, AnalyticsEventCategory.ButtonPress, trackProperties);

      try {
        if (onClick) {
          onClick(evt);
        }
      } catch (err: any) {
        evt.preventDefault();
        throw err;
      }

      if (
        !evt.defaultPrevented && // onClick prevented default
        evt.button === 0 && // ignore everything but left clicks
        (!target || target === '_self') && // let browser handle "target=_blank" etc.
        !isModifiedEvent(evt) // ignore clicks with modifier keys
      ) {
        evt.preventDefault();
        onNavigate();
      }
    },
    [onClick, target, onNavigate, trackEvent, trackID, trackProperties]
  );

  return (
    <a onClick={handleClick} target={target} {...rest}>
      {children}
    </a>
  );
};

function isModifiedEvent(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
