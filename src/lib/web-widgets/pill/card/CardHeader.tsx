import React, { ReactNode, useState } from 'react';

import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as BrokenImageSvg } from 'app/icons/broken-image.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings-icon.svg';
import { ReactComponent as CloseIcon } from 'app/icons/x.svg';

import { CardMenu } from './CardMenu';

interface CardHeaderProps {
  collectionName?: string | null;
  collectionHref?: string;
  avatarUrl?: string;
  tokenSymbol?: string;
  tokenAvatarUrl?: string;
  menuIcon?: ReactNode;
  onClose: EmptyFn;
  onSnooze: EmptyFn;
  onDisable: EmptyFn;
}

export const CardHeader = ({
  collectionName,
  collectionHref,
  avatarUrl,
  tokenSymbol,
  tokenAvatarUrl,
  menuIcon,
  onClose,
  onSnooze,
  onDisable
}: CardHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <div className="tw-card__header">
      {tokenSymbol != null ? (
        <div className="tw-card__token">
          {tokenAvatarUrl && !avatarFailed ? (
            <img className="tw-card__token-avatar" src={tokenAvatarUrl} alt="" onError={() => setAvatarFailed(true)} />
          ) : (
            <div className="tw-card__token-avatar tw-card__token-avatar--empty" />
          )}
          <span className="tw-card__token-symbol">{tokenSymbol}</span>
        </div>
      ) : collectionName != null ? (
        <a className="tw-card__collection" href={collectionHref} target="_blank" rel="noopener noreferrer">
          {avatarUrl && !avatarFailed ? (
            <img className="tw-card__avatar" src={avatarUrl} alt="" onError={() => setAvatarFailed(true)} />
          ) : (
            <div className="tw-card__avatar tw-card__avatar--empty">
              <BrokenImageSvg className="tw-card__avatar-fallback" />
            </div>
          )}
          <span className="tw-card__collection-label">
            <span className="tw-card__collection-name">{collectionName || 'Collection'}</span>
            <OutLinkIcon className="tw-card__collection-link-icon" />
          </span>
        </a>
      ) : (
        <div className="tw-card__collection" />
      )}
      <div className="tw-card__header-actions">
        <button
          className="tw-card__icon-btn"
          type="button"
          aria-label="More"
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuIcon ?? <SettingsIcon className="tw-card__settings-icon" />}
        </button>
        <button className="tw-card__icon-btn" type="button" aria-label="Close" onClick={onClose}>
          <CloseIcon className="tw-card__close-icon" />
        </button>
        {menuOpen ? (
          <CardMenu
            onSnooze={() => {
              setMenuOpen(false);
              onSnooze();
            }}
            onDisable={() => {
              setMenuOpen(false);
              onDisable();
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
