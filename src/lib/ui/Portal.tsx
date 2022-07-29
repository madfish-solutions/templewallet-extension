import { FC, useEffect, useMemo } from 'react';

import * as ReactDOM from 'react-dom';

import { PropsWithChildren } from 'lib/props-with-children';

const Portal: FC<PropsWithChildren> = ({ children }) => {
  const portalEl = useMemo(() => document.createElement('div'), []);
  useEffect(() => {
    document.body.appendChild(portalEl);
    return () => {
      document.body.removeChild(portalEl);
    };
  }, [portalEl]);

  return ReactDOM.createPortal(children, portalEl);
};

export default Portal;
