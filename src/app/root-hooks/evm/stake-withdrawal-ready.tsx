import React, { FC, useEffect } from 'react';

import { IconBase } from 'app/atoms';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { makeEthereumToolkit } from 'app/pages/EarnEth/utils';
import { dispatch } from 'app/store';
import { setStakeWithdrawalReadyNotified } from 'app/store/evm/stake-withdrawal-ready-notifications/actions';
import { useStakeWithdrawalReadyNotificationsSelector } from 'app/store/evm/stake-withdrawal-ready-notifications/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { toastInfo } from 'app/toaster';
import { MIN_ETH_EVERSTAKE_CLAIMABLE_AMOUNT } from 'lib/constants';
import { getEvmNewBlockListener } from 'lib/evm/on-chain/evm-transfer-subscriptions/evm-new-block-listener';
import { T, t } from 'lib/i18n';
import { ETHEREUM_HOODI_CHAIN_ID, ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useUpdatableRef } from 'lib/ui/hooks';
import { Link } from 'lib/woozie';
import { EvmChain, useAllEvmChains } from 'temple/front';

export const StakeWithdrawalReadyNotifications: FC<{ publicKeyHash: HexString }> = ({ publicKeyHash }) => {
  const isTestnet = useTestnetModeEnabledSelector();
  const allEvmChains = useAllEvmChains();
  const chain = allEvmChains[isTestnet ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID];

  return chain && !chain.disabled ? <NotificationsLogic chain={chain} publicKeyHash={publicKeyHash} /> : null;
};

const NotificationsLogic: FC<{ chain: EvmChain; publicKeyHash: HexString }> = ({ chain, publicKeyHash }) => {
  const isNotified = useStakeWithdrawalReadyNotificationsSelector(chain.chainId, publicKeyHash);
  const isNotifiedRef = useUpdatableRef(isNotified);

  useEffect(() => {
    const blockListener = getEvmNewBlockListener(chain);
    const ethereumToolkit = makeEthereumToolkit(chain);

    const listenFn = async () => {
      try {
        const { readyForClaim } = await ethereumToolkit.withdrawRequest(publicKeyHash);
        const claimableAmountIsVisible = readyForClaim.gte(MIN_ETH_EVERSTAKE_CLAIMABLE_AMOUNT);

        if (!claimableAmountIsVisible && isNotifiedRef.current) {
          dispatch(
            setStakeWithdrawalReadyNotified({ chainId: chain.chainId, address: publicKeyHash, notified: false })
          );
        } else if (claimableAmountIsVisible && !isNotifiedRef.current) {
          toastInfo(
            t('everstakeWithdrawalReady'),
            true,
            <Link to="/earn-eth" className="text-secondary flex items-center text-font-num-bold-12">
              <T id="claim" />
              <IconBase size={12} Icon={ChevronRightIcon} />
            </Link>
          );
          dispatch(setStakeWithdrawalReadyNotified({ chainId: chain.chainId, address: publicKeyHash, notified: true }));
        }
      } catch (error) {
        console.error(error);
      }
    };

    blockListener.subscribe(listenFn);

    return () => blockListener.unsubscribe(listenFn);
  }, [chain, isNotifiedRef, publicKeyHash]);

  return null;
};
