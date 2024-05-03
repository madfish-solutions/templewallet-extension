import React, { FC, memo } from 'react';

import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as AddAccIcon } from 'app/icons/add_acc.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/ledger2.svg';
import { ReactComponent as PlusIcon } from 'app/icons/plus.svg';
import { ReactComponent as WatchIcon } from 'app/icons/watch.svg';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { navigate } from 'lib/woozie';

import { Action, ActionsDropdown } from './actions-dropdown';

const actions: Action[] = [
  {
    key: 'create-wallet',
    danger: false,
    i18nKey: 'createWallet' as const,
    icon: AddAccIcon,
    onClick: () => navigate('/create-another-wallet')
  },
  {
    key: 'import-wallet',
    danger: false,
    i18nKey: 'importWallet' as const,
    icon: ImportedIcon,
    onClick: () => navigate('/import-account/wallet-from-mnemonic')
  },
  {
    key: 'ledger-connect',
    danger: false,
    i18nKey: 'connectLedger' as const,
    icon: LedgerIcon,
    onClick: () => navigate('/connect-ledger')
  },
  {
    key: 'watch-only',
    danger: false,
    i18nKey: 'watchOnlyAccount' as const,
    icon: WatchIcon,
    onClick: () => navigate('/import-account/watch-only')
  }
];

const NewWalletActionsDropdown = memo<PopperRenderProps>(({ opened, setOpened, toggleOpened }) => (
  <ActionsDropdown
    opened={opened}
    setOpened={setOpened}
    toggleOpened={toggleOpened}
    title="Add New Wallet"
    actions={actions}
  />
));

export const NewWalletActionsPopper: FC = () => (
  <Popper placement="bottom-end" strategy="fixed" popup={props => <NewWalletActionsDropdown {...props} />}>
    {({ ref, opened, toggleOpened }) => (
      <IconButton Icon={PlusIcon} design="blue" ref={ref} active={opened} onClick={toggleOpened} />
    )}
  </Popper>
);
