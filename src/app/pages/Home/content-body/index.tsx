import { FC, useEffect, useState } from 'react';

import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { ContentBodyBaseContext } from './content-body-base-context';
import { ContentBodyWithEvmChainTokens } from './content-body-with-evm-chain-tokens';
import { ContentBodyWithEvmTokens } from './content-body-with-evm-tokens';
import { ContentBodyWithMultiChainTokens } from './content-body-with-multichain-tokens';
import { ContentBodyWithTezChainTokens } from './content-body-with-tez-chain-tokens';
import { ContentBodyWithTezTokens } from './content-body-with-tez-tokens';

interface ContentBodyProps {
  onCryptoCardClick: EmptyFn;
}

export const ContentBody: FC<ContentBodyProps> = ({ onCryptoCardClick }) => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [localFilterChain, setLocalFilterChain] = useState(filterChain);

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();
  const account = useAccount();
  const accountId = account.id;

  const isTezosFilter = localFilterChain?.kind === TempleChainKind.Tezos;
  const isEvmFilter = localFilterChain?.kind === TempleChainKind.EVM;

  const isOnlyTezAccount = Boolean(accountTezAddress && !accountEvmAddress);
  const isOnlyEvmAccount = Boolean(!accountTezAddress && accountEvmAddress);

  useEffect(() => {
    if ((isTezosFilter && isOnlyEvmAccount) || (isEvmFilter && isOnlyTezAccount)) {
      dispatch(setAssetsFilterChain(null));
      setLocalFilterChain(null);
    }
  }, [isTezosFilter, isEvmFilter, isOnlyEvmAccount, isOnlyTezAccount]);

  useEffect(() => {
    if (filterChain?.chainId !== localFilterChain?.chainId) setLocalFilterChain(filterChain);
  }, [filterChain]);

  let body: ReactChildren;

  if (isTezosFilter && accountTezAddress) {
    body = (
      <ContentBodyWithTezChainTokens
        accountId={accountId}
        chainId={localFilterChain.chainId}
        publicKeyHash={accountTezAddress}
      />
    );
  } else if (isEvmFilter && accountEvmAddress) {
    body = (
      <ContentBodyWithEvmChainTokens
        accountId={accountId}
        chainId={localFilterChain.chainId}
        publicKeyHash={accountEvmAddress}
      />
    );
  } else if (!localFilterChain && accountTezAddress && accountEvmAddress) {
    body = (
      <ContentBodyWithMultiChainTokens
        accountId={accountId}
        accountTezAddress={accountTezAddress}
        accountEvmAddress={accountEvmAddress}
      />
    );
  } else if (!localFilterChain && accountTezAddress) {
    body = <ContentBodyWithTezTokens accountId={accountId} publicKeyHash={accountTezAddress} />;
  } else if (!localFilterChain && accountEvmAddress) {
    body = <ContentBodyWithEvmTokens accountId={accountId} publicKeyHash={accountEvmAddress} />;
  } else {
    body = null;
  }

  return (
    <ContentBodyBaseContext value={{ onCryptoCardClick, account, filterChain: localFilterChain }}>
      {body}
    </ContentBodyBaseContext>
  );
};
