import React, { memo, ReactNode, useCallback } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { T } from 'lib/i18n';

import { RewardsTooltip } from '../tooltip';

import { ReactComponent as DisabledIcon } from './disabled.svg';
import { ReactComponent as EnabledIcon } from './enabled.svg';
import { ReactComponent as IconBg } from './icon_bg.svg';

interface FeatureItemProps {
  Icon: ImportedSVGComponent;
  enabled: boolean;
  setEnabled: (newValue: boolean) => Promise<void>;
  name: ReactNode | ReactNode[];
  description: ReactNode | ReactNode[];
  tooltip: string;
  buttonTestID?: string;
}

export const FeatureItem = memo<FeatureItemProps>(
  ({ Icon, enabled, setEnabled, name, description, tooltip, buttonTestID }) => {
    const toggle = useCallback(() => setEnabled(!enabled), [enabled, setEnabled]);
    const StatusIcon = enabled ? EnabledIcon : DisabledIcon;

    return (
      <div className="rounded-2xl px-4 py-3 flex gap-3 items-center bg-gray-100">
        <div className="relative">
          <IconBg className="w-10 h-10 text-blue-150 fill-current" />
          <Icon
            className={clsx(
              'w-6 h-6 text-blue-500 fill-current',
              'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            )}
          />
          <StatusIcon
            className={clsx(
              'absolute bottom-0 right-0 w-3.5 h-3.5 fill-current',
              enabled ? 'text-green-500' : 'text-red-600'
            )}
          />
        </div>

        <div className="flex-1 flex flex-col gap-0.5 mr-1">
          <div className="flex gap-0.5 items-center">
            <span className="text-sm text-gray-910 font-semibold">{name}</span>
            <RewardsTooltip placement="bottom" content={tooltip} />
          </div>
          <span className="text-xs text-gray-600">{description}</span>
        </div>

        <Button
          className={clsx(
            'rounded-lg p-2 text-center text-white text-xs font-semibold leading-none capitalize',
            enabled ? 'bg-gray-500' : 'bg-blue-500'
          )}
          style={{ minWidth: '3.875rem' }}
          onClick={toggle}
          testID={buttonTestID}
        >
          <T id={enabled ? 'disable' : 'enable'} />
        </Button>
      </div>
    );
  }
);
