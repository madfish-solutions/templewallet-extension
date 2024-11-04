import React, { memo } from 'react';

import { AutoLockSelect } from './auto-lock-select';
import { UsageAnalyticsSettings } from './usage-analytics-settings';

export const SecuritySettings = memo(() => (
  <div className="flex flex-col gap-6">
    <AutoLockSelect />

    <UsageAnalyticsSettings />
  </div>
));
