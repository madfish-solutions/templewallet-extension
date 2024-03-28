import React, { memo } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import Identicon from 'app/atoms/Identicon';
import Logo from 'app/atoms/Logo';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { useTempleClient } from 'lib/temple/front';
import Popper from 'lib/ui/Popper';
import { Link } from 'lib/woozie';
import { useAccount, useEvmNetwork, useTezosNetwork } from 'temple/front';
import { TempleChainName } from 'temple/types';

import AccountDropdown from './Header/AccountDropdown';
import NetworkSelect from './Header/NetworkSelect';
import styles from './Header.module.css';
import { HeaderSelectors } from './Header.selectors';

const Header = memo(() => {
  const appEnv = useAppEnv();
  const { ready } = useTempleClient();

  return (
    <header className={classNames('bg-primary-orange', styles['inner-shadow'], appEnv.fullPage && 'pb-20 -mb-20')}>
      <ContentContainer className="py-4">
        <div className={classNames(appEnv.fullPage && 'px-4')}>
          <div className="flex items-stretch">
            {appEnv.fullPage && (
              <Link to="/" className="flex-shrink-0 mr-4" testID={HeaderSelectors.templeLogoIcon}>
                <div className="flex items-center">
                  <Logo hasTitle={appEnv.fullPage} fill="#FFFFFF" />
                </div>
              </Link>
            )}

            {ready && <Control />}
          </div>
        </div>
      </ContentContainer>
    </header>
  );
});

export default Header;

const Control = memo(() => {
  const account = useAccount();
  const tezosNetwork = useTezosNetwork();
  const evmNetwork = useEvmNetwork();

  return (
    <div className="flex-1 flex flex-col items-end">
      <div className="flex items-start">
        <Name className="text-primary-white text-sm font-semibold text-shadow-black opacity-90">{account.name}</Name>

        <Popper
          placement="left-start"
          strategy="fixed"
          style={{ pointerEvents: 'none' }}
          popup={props => <AccountDropdown {...props} />}
        >
          {({ ref, opened, toggleOpened }) => (
            <Button
              ref={ref}
              className={classNames(
                'ml-2 flex-shrink-0 flex p-px',
                'rounded-md border border-white border-opacity-25',
                'bg-white bg-opacity-10 cursor-pointer',
                'transition ease-in-out duration-200',
                opened
                  ? 'shadow-md opacity-100'
                  : 'shadow hover:shadow-md focus:shadow-md opacity-90 hover:opacity-100 focus:opacity-100'
              )}
              onClick={toggleOpened}
              testID={HeaderSelectors.accountIcon}
            >
              <Identicon type="bottts" hash={account.id} size={48} />
            </Button>
          )}
        </Popper>
      </div>

      <div className="mt-2 flex gap-x-2">
        <NetworkSelect chain={TempleChainName.EVM} currentNetwork={evmNetwork} />

        <NetworkSelect chain={TempleChainName.Tezos} currentNetwork={tezosNetwork} />
      </div>
    </div>
  );
});
