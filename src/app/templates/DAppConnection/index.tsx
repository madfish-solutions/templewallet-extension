import React, { memo, useEffect, useRef } from 'react';

import { IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { StyledButton } from 'app/atoms/StyledButton';
import { useBottomShiftChangingElement } from 'app/hooks/use-bottom-shift-changing-element';
import { ReactComponent as ChevronRightSvg } from 'app/icons/base/chevron_right.svg';
import { DAppSession, isTezosDAppSession } from 'app/storage/dapps';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { Link } from 'lib/woozie';
import { isAccountOfActableType } from 'temple/accounts';
import {
  useAccount,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains
} from 'temple/front';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { SwitchAccountModal } from './switch-account-modal';
import { useActiveTabUrlOrigin } from './use-active-tab';
import { useDAppsConnections } from './use-connections';

export const DAppConnection = memo(() => {
  const { activeDApp, currentTabDApp, disconnectOne } = useDAppsConnections();

  const tezAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();
  const accountIsActable = isAccountOfActableType(useAccount());
  const activeTabOrigin = useActiveTabUrlOrigin();
  const prevTezAddressRef = useRef(tezAddress);
  const prevEvmAddressRef = useRef(evmAddress);
  const prevActiveTabOriginRef = useRef(activeTabOrigin);
  const [switchAccountModalVisible, openSwitchAccountModal, closeSwitchAccountModal] = useBooleanState(false);

  useEffect(() => {
    const prevTezAddress = prevTezAddressRef.current;
    const prevEvmAddress = prevEvmAddressRef.current;
    const prevActiveTabOrigin = prevActiveTabOriginRef.current;
    prevTezAddressRef.current = tezAddress;
    prevEvmAddressRef.current = evmAddress;
    prevActiveTabOriginRef.current = activeTabOrigin;

    if (!currentTabDApp) {
      closeSwitchAccountModal();

      return;
    }

    const [, dapp] = currentTabDApp;
    const dAppChainAccountAddress = isTezosDAppSession(dapp) ? tezAddress : evmAddress;

    if (
      (prevTezAddress !== tezAddress || prevEvmAddress !== evmAddress) &&
      prevActiveTabOrigin === activeTabOrigin &&
      accountIsActable &&
      // TODO: switch account for tezos dapps too when they become ready
      !isTezosDAppSession(dapp) &&
      dAppChainAccountAddress !== dapp.pkh
    ) {
      openSwitchAccountModal();
    }
  }, [
    tezAddress,
    evmAddress,
    currentTabDApp,
    activeTabOrigin,
    openSwitchAccountModal,
    accountIsActable,
    closeSwitchAccountModal
  ]);

  return (
    <>
      {activeDApp && accountIsActable && <DAppConnectionBox activeDApp={activeDApp} disconnectOne={disconnectOne} />}
      {switchAccountModalVisible && currentTabDApp && (
        <SwitchAccountModal dApp={currentTabDApp} onClose={closeSwitchAccountModal} />
      )}
    </>
  );
});

interface DAppConnectionBoxProps {
  activeDApp: [string, DAppSession];
  disconnectOne: (origin: string) => Promise<void>;
}

const DAppConnectionBox = memo(({ activeDApp, disconnectOne }: DAppConnectionBoxProps) => {
  const [origin, dapp] = activeDApp;
  const rootRef = useBottomShiftChangingElement(true);
  const evmChains = useAllEvmChains();
  const tezosChains = useAllTezosChains();

  const { data: tezosChainId } = useTypedSWR(['dapp-connection', 'tezos-chain-id'], () => {
    if (!isTezosDAppSession(dapp)) return null;

    if (dapp.network === 'mainnet') return TempleTezosChainId.Mainnet;
    if (dapp.network === 'ghostnet') return TempleTezosChainId.Ghostnet;
    if (dapp.network === 'shadownet') return TempleTezosChainId.Shadownet;

    if (dapp.network === 'sandbox') return loadTezosChainId('http://localhost:8732');

    if (typeof dapp.network === 'string') return null;

    return loadTezosChainId(dapp.network.rpc);
  });

  const network = isTezosDAppSession(dapp)
    ? tezosChainId
      ? tezosChains[tezosChainId]
      : null
    : evmChains[dapp.chainId] ?? null;

  return (
    <div className="sticky bottom-0 flex items-center gap-x-2 py-3 px-4 bg-white shadow-bottom" ref={rootRef}>
      <div className="relative flex">
        <DAppLogo origin={origin} icon={dapp.appMeta.icon} size={36} className="m-[2px] rounded-full" />

        {network && (
          <div className="absolute bottom-0 right-0">
            {network.kind === TempleChainKind.Tezos ? (
              <TezosNetworkLogo chainId={network.chainId} size={16} />
            ) : (
              <EvmNetworkLogo chainId={network.chainId} size={16} />
            )}
          </div>
        )}
      </div>

      <div className="flex-grow flex flex-col items-start gap-y-1">
        <span className="text-font-medium-bold">{dapp.appMeta.name}</span>

        <Link to="/settings/dapps" className="flex items-center text-font-description text-grey-1">
          <span>Manage connections</span>

          <IconBase Icon={ChevronRightSvg} size={12} />
        </Link>
      </div>

      <StyledButton size="S" color="red-low" onClick={() => disconnectOne(origin)}>
        Disconnect
      </StyledButton>
    </div>
  );
});
