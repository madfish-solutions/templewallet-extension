import React from 'react';

import { ReactComponent as DisableIcon } from 'app/icons/disable-icon.svg';
import { ReactComponent as SnoozeIcon } from 'app/icons/snooze-icon.svg';

interface CardMenuProps {
  onSnooze: EmptyFn;
  onDisable: EmptyFn;
}

export const CardMenu = ({ onSnooze, onDisable }: CardMenuProps) => (
  <div className="tw-card__menu">
    <button className="tw-card__menu-item" type="button" onClick={onSnooze}>
      <SnoozeIcon className="tw-card__menu-icon" />
      Snooze for 24h
    </button>
    <button className="tw-card__menu-item tw-card__menu-item--danger" type="button" onClick={onDisable}>
      <DisableIcon className="tw-card__menu-icon" />
      Disable
    </button>
  </div>
);
