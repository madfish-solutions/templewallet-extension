import { FC, AnchorHTMLAttributes, MouseEventHandler, MouseEvent, Ref, useCallback, useMemo } from 'react';

import { TestIDProps, useAnalytics, AnalyticsEventCategory, setTestID } from 'lib/analytics';

import { USE_LOCATION_HASH_AS_URL } from './config';
import { HistoryAction, createUrl, changeState } from './history';
import { To, createLocationUpdates, useLocation } from './location';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, TestIDProps {
  to: To;
  replace?: boolean;
  ref?: Ref<HTMLAnchorElement>;
}

export const Link: FC<LinkProps> = ({ to, replace, ref, ...rest }) => {
  const lctn = useLocation();

  const { pathname, search, hash, state } = useMemo(() => createLocationUpdates(to, lctn), [to, lctn]);

  const url = useMemo(() => createUrl(pathname, search, hash), [pathname, search, hash]);

  const href = useMemo(() => (USE_LOCATION_HASH_AS_URL ? `${window.location.pathname}#${url}` : url), [url]);

  const handleNavigate = useCallback(() => {
    const action =
      replace || url === createUrl(lctn.pathname, lctn.search, lctn.hash) ? HistoryAction.Replace : HistoryAction.Push;
    changeState(action, state, url);
  }, [replace, state, url, lctn]);

  return <LinkAnchor {...rest} href={href} onNavigate={handleNavigate} ref={ref} />;
};

interface LinkAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement>, TestIDProps {
  onNavigate: () => void;
  onClick?: MouseEventHandler;
  target?: string;
  ref?: Ref<HTMLAnchorElement>;
}

const LinkAnchor = ({
  children,
  onNavigate,
  onClick,
  target,
  testID,
  testIDProperties,
  ref,
  ...rest
}: LinkAnchorProps) => {
  const { trackEvent } = useAnalytics();

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLAnchorElement>) => {
      testID && trackEvent(testID, AnalyticsEventCategory.ButtonPress, testIDProperties);

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
    [onClick, target, onNavigate, trackEvent, testID, testIDProperties]
  );

  return (
    <a onClick={handleClick} target={target} ref={ref} {...rest} {...setTestID(testID)}>
      {children}
    </a>
  );
};

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return Boolean(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
