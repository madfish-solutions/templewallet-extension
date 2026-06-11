import React, { FC } from 'react';

import { DISABLE_ICON_SVG, SNOOZE_ICON_SVG } from 'lib/icons/snooze-disable-icons';

interface CardMenuProps {
  onSnooze: EmptyFn;
  onDisable: EmptyFn;
}

const InlineSvgIcon: FC<{ markup: string; className?: string }> = ({ markup, className }) => (
  <span className={className} dangerouslySetInnerHTML={{ __html: markup }} />
);

export const CardMenu = ({ onSnooze, onDisable }: CardMenuProps) => (
  <div className="tw-card__menu">
    <button className="tw-card__menu-item" type="button" onClick={onSnooze}>
      <InlineSvgIcon markup={SNOOZE_ICON_SVG} className="tw-card__menu-icon" />
      Snooze for 24h
    </button>
    <button className="tw-card__menu-item tw-card__menu-item--danger" type="button" onClick={onDisable}>
      <InlineSvgIcon markup={DISABLE_ICON_SVG} className="tw-card__menu-icon" />
      Disable
    </button>
  </div>
);
