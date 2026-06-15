import React, { FC } from 'react';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useEthStakingDeposit } from 'lib/utils/eth-staking';
import { useAccountAddressForEvm } from 'temple/front';

import { getEthSavingOffer } from '../config';

import { EarnItem } from './EarnItem';

export const EthSavingItem: FC = () => {
  const evmAddress = useAccountAddressForEvm();

  if (evmAddress) {
    return <DepositContent evmAddress={evmAddress} />;
  }

  return null;
};

interface DepositContentProps {
  evmAddress: string;
}

const DepositContent: FC<DepositContentProps> = ({ evmAddress }) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const chainId = isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID;
  const deposit = useEthStakingDeposit(evmAddress, chainId);

  return <EarnItem offer={getEthSavingOffer(isTestnet)} deposit={deposit} />;
};
