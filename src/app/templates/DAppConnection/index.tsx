import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as ChevronRightSvg } from 'app/icons/base/chevron_right.svg';
import { isTezosDAppSession } from 'app/storage/dapps';
import { t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { TempleTezosChainId } from 'lib/temple/types';
import { Link } from 'lib/woozie';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { useDAppsConnections } from './use-connections';

export const DAppConnection = memo(() => {
  const { activeDApp, disconnectOne } = useDAppsConnections();

  const evmChains = useAllEvmChains();
  const tezosChains = useAllTezosChains();

  const { data: tezosChainId } = useTypedSWR(['dapp-connection', 'tezos-chain-id'], () => {
    if (!isTezosDAppSession(dapp)) return null;

    if (dapp.network === 'mainnet') return TempleTezosChainId.Mainnet;
    if (dapp.network === 'ghostnet') return TempleTezosChainId.Ghostnet;

    if (dapp.network === 'sandbox') return loadTezosChainId('http://localhost:8732');

    if (typeof dapp.network === 'string') return null;

    return loadTezosChainId(dapp.network.rpc);
  });

  if (!activeDApp) return null;

  const [origin, dapp] = activeDApp;

  const network = isTezosDAppSession(dapp)
    ? tezosChainId
      ? tezosChains[tezosChainId]
      : null
    : evmChains[dapp.chainId] ?? null;
  const networkName = network?.nameI18nKey ? t(network.nameI18nKey) : network?.name;
  console.log('oy vey 1', origin, dapp.appMeta.icon);

  return (
    <div className="sticky bottom-0 flex items-center gap-x-2 py-3 px-4 bg-white shadow-bottom">
      <div className="relative flex">
        <DAppLogo origin={origin} icon={dapp.appMeta.icon} size={36} className="m-[2px] rounded-full" />

        {network && (
          <div className="absolute bottom-0 right-0">
            {network.kind === TempleChainKind.Tezos ? (
              <TezosNetworkLogo chainId={network.chainId} size={16} networkName={networkName!} />
            ) : (
              <EvmNetworkLogo chainId={network.chainId} size={16} networkName={networkName!} />
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
