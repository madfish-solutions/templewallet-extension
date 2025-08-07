import React, { memo } from 'react';

import { Button, HashShortView } from 'app/atoms';
import { EvmNetworksLogos, TezNetworkLogo } from 'app/atoms/NetworksLogos';
import { StoredAccount } from 'lib/temple/types';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

interface CopyAccountAddressesProps {
  account: StoredAccount;
  tezosButtonTestID?: string;
  evmButtonTestID?: string;
}

export const CopyAccountAddresses = memo<CopyAccountAddressesProps>(
  ({ account, tezosButtonTestID, evmButtonTestID }) => (
    <>
      <CopyAddressButton
        address={getAccountAddressForTezos(account)}
        chainKind={TempleChainKind.Tezos}
        testID={tezosButtonTestID}
      />
      <CopyAddressButton
        address={getAccountAddressForEvm(account)}
        chainKind={TempleChainKind.EVM}
        testID={evmButtonTestID}
      />
    </>
  )
);

const CopyAddressButton = memo<{ address?: string; chainKind: TempleChainKind; testID?: string }>(
  ({ address, chainKind, testID }) => {
    const handleClick = useCopyText(address, true);

    return address ? (
      <Button
        className="flex gap-0.5 py-0.5 items-center hover:text-secondary self-end"
        testID={testID}
        onClick={handleClick}
      >
        {chainKind === TempleChainKind.Tezos ? <TezNetworkLogo size={16} /> : <EvmNetworksLogos size={16} />}
        <span className="text-font-description">
          <HashShortView hash={address} firstCharsCount={2} lastCharsCount={4} />
        </span>
      </Button>
    ) : null;
  }
);
