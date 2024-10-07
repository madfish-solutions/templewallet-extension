import React, { memo, useMemo } from 'react';

import clsx from 'clsx';

import { HashShortView, IconBase } from 'app/atoms';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { Button } from 'app/atoms/Button';
import Name from 'app/atoms/Name';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { toastSuccess } from 'app/toaster';
import { StoredAccount } from 'lib/temple/types';
import Popper from 'lib/ui/Popper';
import { getAccountAddressForEvm, getAccountAddressForTezos } from 'temple/accounts';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { ActionListItem } from './ActionListItem';
import { EvmNetworksLogos, TezNetworkLogo } from './NetworksLogos';
import { SearchHighlightText } from './SearchHighlightText';

interface Props {
  account: StoredAccount;
  searchValue?: string;
  smaller?: boolean;
  testID?: string;
}

export const AccountName = memo<Props>(({ account, searchValue, smaller, testID }) => {
  const accountTezosAddress = useMemo(() => getAccountAddressForTezos(account), [account]);
  const accountEvmAddress = useMemo(() => getAccountAddressForEvm(account), [account]);

  return (
    <Popper
      placement="bottom-start"
      strategy="fixed"
      popup={props => (
        <ActionsDropdownPopup
          title="Select Address to copy"
          opened={props.opened}
          lowering={smaller ? 1 : 3}
          style={{ minWidth: 173 }}
        >
          {accountTezosAddress ? (
            <CopyAddressButton
              chain={TempleChainKind.Tezos}
              address={accountTezosAddress}
              onCopy={props.toggleOpened}
            />
          ) : null}

          {accountEvmAddress ? (
            <CopyAddressButton chain={TempleChainKind.EVM} address={accountEvmAddress} onCopy={props.toggleOpened} />
          ) : null}
        </ActionsDropdownPopup>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={clsx(
            'flex items-center gap-x-1 rounded-md',
            smaller ? 'py-1.5 px-2' : 'p-1.5',
            opened ? 'bg-secondary-low' : 'hover:bg-secondary-low'
          )}
          onClick={event => {
            event.stopPropagation();
            toggleOpened();
          }}
          testID={testID}
        >
          <Name className="text-font-medium-bold">
            {searchValue ? (
              <SearchHighlightText searchValue={searchValue}>{account.name}</SearchHighlightText>
            ) : (
              account.name
            )}
          </Name>

          <IconBase Icon={CopyIcon} size={12} className="text-secondary" />
        </Button>
      )}
    </Popper>
  );
});

interface CopyAddressButtonProps {
  chain: TempleChainKind;
  address: string;
  onCopy: EmptyFn;
}

const CopyAddressButton = memo<CopyAddressButtonProps>(({ chain, address, onCopy }) => (
  <ActionListItem
    onClick={() => {
      window.navigator.clipboard.writeText(address);
      onCopy();
      toastSuccess('Address Copied');
    }}
  >
    <div className="flex-1 flex flex-col gap-y-0.5 items-start">
      <span className="text-font-description-bold">{TempleChainTitle[chain]}</span>

      <span className="text-font-description text-grey-1">
        <HashShortView hash={address} />
      </span>
    </div>

    {chain === 'tezos' ? <TezNetworkLogo /> : <EvmNetworksLogos />}
  </ActionListItem>
));
