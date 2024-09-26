import { useCallback } from 'react';

import { isEqual, omit } from 'lodash';
import { nanoid } from 'nanoid';

import { ArtificialError } from 'app/defaults';
import { toastError } from 'app/toaster';
import { t } from 'lib/i18n';
import { COLORS } from 'lib/ui/colors';
import { loadEvmChainId } from 'temple/evm';
import { useTempleNetworksActions } from 'temple/front';
import { useBlockExplorers } from 'temple/front/block-explorers';
import { useEvmChainsSpecs, useTezosChainsSpecs } from 'temple/front/chains-specs';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { AddNetworkFormValues, ViemChain } from './types';
import { NUMERIC_CHAIN_ID_REGEX, generateEntityNameFromUrl, makeFormValues } from './utils';

export const useAddNetwork = (
  setSubmitError: SyncFn<string>,
  lastSelectedChain: ViemChain | null,
  onClose: EmptyFn
) => {
  const [, setTezosChainsSpecs] = useTezosChainsSpecs();
  const [, setEvmChainsSpecs] = useEvmChainsSpecs();
  const { addEvmNetwork, addTezosNetwork } = useTempleNetworksActions();
  const { addBlockExplorer } = useBlockExplorers();

  return useCallback(
    async (values: AddNetworkFormValues) => {
      const { name, rpcUrl, chainId, symbol, explorerUrl, isTestnet } = values;

      try {
        const isEvm = chainId.match(NUMERIC_CHAIN_ID_REGEX);
        const expectedChainId = isEvm ? Number(chainId) : chainId;
        const actualChainId = isEvm ? await loadEvmChainId(rpcUrl) : await loadTezosChainId(rpcUrl);

        if (expectedChainId !== actualChainId) {
          throw new ArtificialError(t('rpcDoesNotMatchChain'));
        }
      } catch (e) {
        toastError(e instanceof ArtificialError ? e.message : t('rpcDoesNotRespond'));
        setSubmitError(t('wrongAddress'));

        return;
      }

      const { currencyDecimals, currencyName } =
        lastSelectedChain &&
        isEqual(omit(values, 'symbol', 'explorerUrl'), omit(makeFormValues(lastSelectedChain), 'symbol', 'explorerUrl'))
          ? {
              currencyName: lastSelectedChain.nativeCurrency.name,
              currencyDecimals: lastSelectedChain.nativeCurrency.decimals
            }
          : { currencyName: symbol, currencyDecimals: 18 };
      const rpcName = generateEntityNameFromUrl(rpcUrl) || name;

      try {
        const commonNetworkProps = {
          id: nanoid(),
          rpcBaseURL: rpcUrl,
          name: rpcName,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        const blockExplorerInput = explorerUrl
          ? {
              name: generateEntityNameFromUrl(explorerUrl) || name,
              url: explorerUrl
            }
          : undefined;
        const commonChainSpecs = { name, mainnet: !isTestnet };

        if (chainId.match(NUMERIC_CHAIN_ID_REGEX)) {
          await Promise.all([
            setEvmChainsSpecs(prev => ({
              ...prev,
              [Number(chainId)]: {
                ...commonChainSpecs,
                currency: {
                  symbol,
                  name: currencyName,
                  decimals: currencyDecimals
                }
              }
            })),
            addEvmNetwork({
              ...commonNetworkProps,
              chain: TempleChainKind.EVM,
              chainId: Number(chainId)
            }),
            blockExplorerInput
              ? addBlockExplorer(TempleChainKind.EVM, Number(chainId), blockExplorerInput)
              : Promise.resolve(null)
          ]);
        } else {
          await Promise.all([
            setTezosChainsSpecs(prev => ({
              ...prev,
              [chainId]: commonChainSpecs
            })),
            addTezosNetwork({
              ...commonNetworkProps,
              chain: TempleChainKind.Tezos,
              chainId
            }),
            blockExplorerInput
              ? addBlockExplorer(TempleChainKind.Tezos, chainId, blockExplorerInput)
              : Promise.resolve(null)
          ]);
        }
        onClose();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        toastError(errorMessage);
        setSubmitError(errorMessage);
      }
    },
    [
      addBlockExplorer,
      addEvmNetwork,
      addTezosNetwork,
      lastSelectedChain,
      onClose,
      setEvmChainsSpecs,
      setSubmitError,
      setTezosChainsSpecs
    ]
  );
};
