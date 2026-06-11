import React from 'react';

import { ReactComponent as WidgetIcon } from 'app/icons/widget-icon.svg';

interface WelcomeOverlayProps {
  onContinue: EmptyFn;
}

export const WelcomeOverlay = ({ onContinue }: WelcomeOverlayProps) => (
  <div className="tw-card__welcome">
    <div className="tw-card__welcome-center">
      <WidgetIcon className="tw-card__welcome-icon" />
      <div className="tw-card__welcome-title">Crypto widgets now live!</div>
      <div className="tw-card__welcome-subtitle">View insight about crypto without leaving the surface.</div>
    </div>
    <div className="tw-card__welcome-bottom">
      <button className="tw-card__continue" type="button" onClick={onContinue}>
        Continue
      </button>
      <div className="tw-card__welcome-agreement">
        By continue, you agree to participate customer-based ads program.
      </div>
    </div>
  </div>
);
