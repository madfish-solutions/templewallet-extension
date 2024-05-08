import React, { FC, useEffect, useMemo } from 'react';

import { eventHandlers } from 'jsx-ast-utils';
import * as ReactDOM from 'react-dom';

const DocumentBodyPortal: FC<PropsWithChildren> = ({ children }) => {
  const portalEl = useMemo(() => document.createElement('div'), []);

  useEffect(() => {
    document.body.appendChild(portalEl);

    return () => void document.body.removeChild(portalEl);
  }, [portalEl]);

  return ReactDOM.createPortal(children, portalEl);
};

export default DocumentBodyPortal;

export const PORTAL_EVENTS_LEAK_GUARD: Partial<
  React.DOMAttributes<HTMLDivElement> & { [key: `data-${string}`]: string }
> = {
  'data-warning': '/* No events bubble past here */'
};

const stopPropagation = (event: React.BaseSyntheticEvent) => void event.stopPropagation();

for (const name of eventHandlers)
  PORTAL_EVENTS_LEAK_GUARD[name === 'onDblClick' ? 'onDoubleClick' : name] = stopPropagation;

/** See: https://github.com/facebook/react/issues/11387 */
export const PortalEventsLeakGuard: FC<PropsWithChildren> = ({ children }) => (
  <div {...PORTAL_EVENTS_LEAK_GUARD} className="contents">
    {children}
  </div>
);
