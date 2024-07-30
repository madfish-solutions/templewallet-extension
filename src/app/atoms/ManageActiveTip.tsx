import React, { memo } from 'react';

import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';
import { T } from 'lib/i18n';

import { IconBase } from './IconBase';

export const ManageActiveTip = memo(() => (
  <div className="flex flex-row bg-secondary-low p-3 mb-4 gap-x-1 rounded-md">
    <IconBase Icon={InfoFillIcon} size={24} className="text-secondary" />
    <p className="text-font-description">
      <T id="manageAssetsSearchTip" />
    </p>
  </div>
));
