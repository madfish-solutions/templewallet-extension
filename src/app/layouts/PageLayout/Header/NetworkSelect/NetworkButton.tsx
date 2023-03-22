import React from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { T } from 'lib/i18n';
import { TempleNetwork } from 'lib/temple/types';

import { NetworkSelectSelectors } from './selectors';

interface Props {
  network: TempleNetwork;
  selected: boolean;
  onClick: EmptyFn;
}

export const NetworkButton: React.FC<Props> = ({ network, selected, onClick }) => {
  const { id, name, color, disabled, nameI18nKey } = network;

  return (
    <Button
      key={id}
      className={classNames(
        'flex items-center w-full mb-1 rounded',
        'transition easy-in-out duration-200',
        !disabled && (selected ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-5'),
        disabled ? 'opacity-25 cursor-default' : 'cursor-pointer'
      )}
      style={{
        padding: '0.375rem 1.5rem 0.375rem 0.5rem'
      }}
      disabled={disabled}
      autoFocus={selected}
      onClick={disabled ? undefined : onClick}
      testID={NetworkSelectSelectors.networkItemButton}
      testIDProperties={{ networkType: network.type }}
    >
      <div
        className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
        style={{ backgroundColor: color }}
      />

      <span
        className="overflow-hidden text-sm text-white whitespace-nowrap text-shadow-black"
        style={{ textOverflow: 'ellipsis', maxWidth: '10rem' }}
      >
        {(nameI18nKey && <T id={nameI18nKey} />) || name}
      </span>
    </Button>
  );
};
