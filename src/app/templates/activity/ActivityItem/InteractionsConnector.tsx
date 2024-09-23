import React, { memo } from 'react';

import { ReactComponent as InteractionsConnectorSvg } from './interactions-connector.svg';

export const InteractionsConnector = memo(() => (
  <div className="z-0 h-0 overflow-visible pl-7">
    <InteractionsConnectorSvg className="h-4 text-grey-3 fill-current stroke-current -translate-y-1/2" />
  </div>
));
