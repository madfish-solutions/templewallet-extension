import React, { FC, memo } from 'react';

import { IconButton } from 'app/atoms/IconButton';
import { ReactComponent as AddAccIcon } from 'app/icons/add_acc.svg';
import { ReactComponent as ImportedIcon } from 'app/icons/imported.svg';
import { ReactComponent as LedgerIcon } from 'app/icons/ledger2.svg';
import { ReactComponent as PlusIcon } from 'app/icons/plus.svg';
import { ReactComponent as WatchIcon } from 'app/icons/watch.svg';
import { t } from 'lib/i18n';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { navigate } from 'lib/woozie';

import { AccountsAction, AccountsActionsDropdown } from './actions-dropdown';

const actions: AccountsAction[] = [
  {
    key: 'create-wallet',
    title: () => 'Create wallet',
    icon: AddAccIcon,
    onClick: () => navigate('/create-another-wallet')
  },
  {
    key: 'import-wallet',
    title: () => 'Import wallet',
    icon: ImportedIcon,
    onClick: () => navigate('/import-account/wallet-from-mnemonic')
  },
  {
    key: 'ledger-connect',
    title: () => 'Ledger connect',
    icon: LedgerIcon,
    onClick: () => navigate('/connect-ledger')
  },
  {
    key: 'watch-only',
    title: () => t('watchOnlyAccount'),
    icon: WatchIcon,
    onClick: () => navigate('/import-account/watch-only')
  }
];

const NewWalletActionsDropdown = memo<PopperRenderProps>(({ opened, setOpened, toggleOpened }) => (
  <AccountsActionsDropdown
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
