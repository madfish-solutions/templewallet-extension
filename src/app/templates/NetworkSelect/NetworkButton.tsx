import React from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { getNetworkTitle } from 'temple/front';
import { NetworkBase } from 'temple/networks';

interface Props {
  network: NetworkBase;
  selected: boolean;
  onClick: EmptyFn;
}

export const NetworkButton: React.FC<Props> = ({ network, selected, onClick }) => {
  const { id, color, disabled } = network;

  const title = getNetworkTitle(network);

  return (
    <Button
      key={id}
      className={clsx(
        'flex items-center w-full mb-1 rounded',
        'transition easy-in-out duration-200',
        !disabled && (selected ? 'bg-white bg-opacity-10' : 'hover:bg-white hover:bg-opacity-5'),
        disabled ? 'opacity-25 cursor-default' : 'cursor-pointer'
      )}
      style={{
        padding: '0.375rem 1.5rem 0.375rem 0.5rem'
      }}
      title={network.description}
      disabled={disabled}
      autoFocus={selected}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className="mr-2 w-3 h-3 border border-primary-white rounded-full shadow-xs"
        style={{ backgroundColor: color }}
      />

      <span
        className="overflow-hidden text-sm text-white whitespace-nowrap text-shadow-black"
        style={{ textOverflow: 'ellipsis', maxWidth: '10rem' }}
      >
        {title}
      </span>
    </Button>
  );
};
