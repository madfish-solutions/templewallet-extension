import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as AttentionIcon } from 'app/icons/base/attention.svg';
import { T } from 'lib/i18n';

export const ScamTokenAlert = memo(() => (
  <div
    className="py-3 px-4 rounded-md border border-red-700 mb-4 flex items-center"
    style={{ backgroundColor: '#FFEFEF' }}
  >
    <IconBase Icon={AttentionIcon} size={12} className="text-error" />

    <p className="ml-2 text-red-700 font-normal text-xs">
      <T id="scamTokenAlert" />
    </p>
  </div>
));
