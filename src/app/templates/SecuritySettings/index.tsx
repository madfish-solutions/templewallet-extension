import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';

import { AutoLockSelect } from './auto-lock-select';
import { UsageAnalyticsSettings } from './usage-analytics-settings';

export const SecuritySettings = memo(() => (
  <FadeTransition>
    <div className="flex flex-col gap-6">
      <AutoLockSelect />

      <UsageAnalyticsSettings />
    </div>
  </FadeTransition>
));
