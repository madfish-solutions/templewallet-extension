import React, { memo } from 'react';

import { T } from 'lib/i18n';
import { AlertTriangleIcon } from 'lib/icons';
export const ScamTokenAlert = memo(() => (
  <div
    className="w-full max-w-sm mx-auto py-3 px-4 rounded-md border border-red-700 mb-4 flex flex-row items-center"
    style={{ backgroundColor: '#FFEFEF' }}
  >
    <AlertTriangleIcon width={16} height={16} stroke="#C53030" />
    <p className="ml-2 text-red-700 font-normal text-xs">
      <T id="scamTokenAlert" />
    </p>
  </div>
));
