import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { decodeFunctionData, encodeFunctionData } from 'viem';

import { IconBase } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { useOperationConfirmationCardRowsPropsPart } from 'app/hooks/use-operation-confirmation-card-rows-props-part';
import { ReactComponent as EditIcon } from 'app/icons/base/edit.svg';
import { OperationConfirmationCard, OperationConfirmationCardRow } from 'app/templates/operation-confirmation-card';
import { erc20AllowanceAbi, erc20ApproveAbi, erc20IncreaseAllowanceAbi } from 'lib/abi/erc20';
import { erc721ApproveAbi } from 'lib/abi/erc721';
import { toEvmAssetSlug } from 'lib/assets/utils';
import { MAX_EVM_ALLOWANCE } from 'lib/constants';
import { dataMatchesAbis } from 'lib/evm/on-chain/transactions';
import { detectEvmTokenStandard } from 'lib/evm/on-chain/utils/common.utils';
import { EvmAssetStandard } from 'lib/evm/types';
import { T, t, toLocalFixed } from 'lib/i18n';
import { useEvmAssetMetadata, useGetEvmChainCollectibleMetadata, useGetEvmChainTokenOrGasMetadata } from 'lib/metadata';
import { useTypedSWR } from 'lib/swr';
import { EvmTransactionRequestWithSender, TempleEvmDAppTransactionPayload } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { toBigInt, toBigNumber } from 'lib/utils/numbers';
import { getReadOnlyEvmForNetwork } from 'temple/evm';
import { EvmChain } from 'temple/front';

import { EditModal } from './edit-modal';

interface ApproveLayoutProps {
  chain: EvmChain;
  payload: TempleEvmDAppTransactionPayload;
  setFinalEvmTransaction: ReactSetStateFn<EvmTransactionRequestWithSender>;
}

const unlimitedAtomicAmountThreshold = toBigNumber(MAX_EVM_ALLOWANCE);

export const ApproveLayout = memo<ApproveLayoutProps>(({ chain, payload, setFinalEvmTransaction }) => {
  const tokenAddress = payload.req.to!;
  const txData = payload.req.data!;
  const { from } = payload.req;

  const [editModalIsVisible, openEditModal, closeEditModal] = useBooleanState(false);
  const knownAssetMetadata = useEvmAssetMetadata(toEvmAssetSlug(tokenAddress), chain.chainId);

  const isErc20IncreaseAllowance = useMemo(() => dataMatchesAbis(txData, [erc20IncreaseAllowanceAbi]), [txData]);
  const evmToolkit = useMemo(() => getReadOnlyEvmForNetwork(chain), [chain]);

  const getAssetsAmountsContext = useCallback(async () => {
    if (isErc20IncreaseAllowance) {
      const [spender] = decodeFunctionData({ abi: [erc20IncreaseAllowanceAbi], data: txData }).args;

      try {
        const onChainAllowance = await evmToolkit.readContract({
          address: tokenAddress,
          abi: [erc20AllowanceAbi],
          functionName: 'allowance',
          args: [from, spender]
        });

        return { onChainAllowance: onChainAllowance, isErc20: true };
      } catch (err) {
        return { onChainAllowance: BigInt(0), isErc20: true };
      }
    }

    if (knownAssetMetadata) {
      return { onChainAllowance: BigInt(0), isErc20: knownAssetMetadata.standard === EvmAssetStandard.ERC20 };
    }

    try {
      return {
        onChainAllowance: BigInt(0),
        isErc20: (await detectEvmTokenStandard(evmToolkit, toEvmAssetSlug(tokenAddress))) === EvmAssetStandard.ERC20
      };
    } catch (e) {
      return { onChainAllowance: BigInt(0), isErc20: false };
    }
  }, [evmToolkit, isErc20IncreaseAllowance, knownAssetMetadata, from, tokenAddress, txData]);
  const { data: assetsAmountsContext } = useTypedSWR(
    ['isErc20Approve', chain.disabled, tokenAddress, txData],
    getAssetsAmountsContext,
    {
      suspense: true,
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );
  const { onChainAllowance, isErc20 } = assetsAmountsContext!;

  const assetsAmounts = useMemo(() => {
    if (isErc20IncreaseAllowance) {
      const [, increaseAmount] = decodeFunctionData({ abi: [erc20IncreaseAllowanceAbi], data: txData }).args;

      return {
        [toEvmAssetSlug(tokenAddress)]: {
          atomicAmount: toBigNumber(increaseAmount + onChainAllowance),
          isNft: false
        }
      };
    }

    if (isErc20) {
      const [, amount] = decodeFunctionData({ abi: [erc20ApproveAbi], data: txData }).args;

      return {
        [toEvmAssetSlug(tokenAddress)]: { atomicAmount: toBigNumber(amount), isNft: false }
      };
    }

    const [, tokenId] = decodeFunctionData({ abi: [erc721ApproveAbi], data: txData }).args;

    return {
      [toEvmAssetSlug(tokenAddress, tokenId.toString())]: { atomicAmount: new BigNumber(1), isNft: true }
    };
  }, [isErc20IncreaseAllowance, isErc20, txData, tokenAddress, onChainAllowance]);
  const [{ assetSlug, variant, volume, symbol }] = useOperationConfirmationCardRowsPropsPart(
    chain,
    assetsAmounts,
    useGetEvmChainTokenOrGasMetadata,
    useGetEvmChainCollectibleMetadata,
    unlimitedAtomicAmountThreshold
  );

  const setAllowance = useCallback(
    (newValue: BigNumber) => {
      let data: HexString;
      if (isErc20IncreaseAllowance) {
        const [spender] = decodeFunctionData({ abi: [erc20IncreaseAllowanceAbi], data: txData }).args;
        data = encodeFunctionData({
          abi: [erc20IncreaseAllowanceAbi],
          functionName: 'increaseAllowance',
          args: [spender, toBigInt(newValue) - onChainAllowance]
        });
      } else {
        const [spender] = decodeFunctionData({ abi: [erc20ApproveAbi], data: txData }).args;
        data = encodeFunctionData({
          abi: [erc20ApproveAbi],
          functionName: 'approve',
          args: [spender, toBigInt(newValue)]
        });
      }
      setFinalEvmTransaction(prev => ({ ...prev, data }));
    },
    [onChainAllowance, isErc20IncreaseAllowance, setFinalEvmTransaction, txData]
  );

  const initialAllowance = useMemo(() => Object.values(assetsAmounts)[0].atomicAmount, [assetsAmounts]);

  return (
    <>
      <OperationConfirmationCard title={<T id="approve" />}>
        <OperationConfirmationCardRow
          chain={chain}
          assetSlug={assetSlug}
          variant={variant}
          volume={volume.isFinite() ? toLocalFixed(volume) : t('unlimited')}
          symbol={symbol}
          rightContent={
            isErc20 ? (
              <StyledButton size="S" color="secondary-low" className="flex items-center" onClick={openEditModal}>
                <T id="edit" />
                <IconBase size={12} Icon={EditIcon} />
              </StyledButton>
            ) : undefined
          }
        />
      </OperationConfirmationCard>

      {editModalIsVisible && (
        <EditModal
          assetSlug={assetSlug}
          chain={chain}
          from={from}
          initialAllowance={initialAllowance}
          minAllowance={onChainAllowance}
          minInclusive={!isErc20IncreaseAllowance}
          onClose={closeEditModal}
          setAllowance={setAllowance}
        />
      )}
    </>
  );
});
