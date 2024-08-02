import React, { memo, useCallback } from 'react';

import { Button, HashShortView } from 'app/atoms';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { T } from 'lib/i18n';
import { TempleChainTitle } from 'temple/types';

import { AccountSettingsSelectors } from '../selectors';
import { PrivateKeyPayload } from '../types';

interface ChainSelectionProps {
  privateKeys: PrivateKeyPayload[];
  onSelect: (pk: PrivateKeyPayload) => void;
}

export const ChainSelection = memo<ChainSelectionProps>(({ privateKeys, onSelect }) => (
  <>
    <span className="pt-5 pb-2 text-font-description-bold">
      <T id="selectNetworkToReveal" />
    </span>
    <div className="w-full flex flex-col gap-3">
      {privateKeys.map(privateKey => (
        <ChainOption key={privateKey.chain} privateKey={privateKey} onSelect={onSelect} />
      ))}
    </div>
  </>
));

interface ChainOptionProps {
  onSelect: (pk: PrivateKeyPayload) => void;
  privateKey: PrivateKeyPayload;
}

const ChainOption = memo<ChainOptionProps>(({ onSelect, privateKey }) => {
  const { chain, address } = privateKey;

  const handleClick = useCallback(() => onSelect(privateKey), [onSelect, privateKey]);

  return (
    <Button
      className="w-full flex rounded-md shadow-bottom p-3 items-center hover:bg-secondary-low"
      onClick={handleClick}
      testID={AccountSettingsSelectors.chainOptionButton}
      testIDProperties={{ chain }}
    >
      <div className="flex-1 text-left">
        <p className="text-font-medium-bold">{TempleChainTitle[chain]}</p>
        <p className="text-font-description text-grey-1">
          <HashShortView hash={address} />
        </p>
      </div>
      {chain === 'tezos' ? <TezNetworkLogo size={36} /> : <EvmNetworksLogos size={36} />}
    </Button>
  );
});
