import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';

import { ChainId } from '@lifi/sdk';

import { IconBase } from 'app/atoms';
import { PageTitle } from 'app/atoms/PageTitle';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import PageLayout from 'app/layouts/PageLayout';
import { lifi, quoteRequest, routesRequest } from 'app/pages/Swap/demo';
import { SwapForm } from 'app/pages/Swap/form';
import { dispatch } from 'app/store';
import { resetSwapParamsAction } from 'app/store/swap/actions';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { useAccountAddressForTezos } from 'temple/front';

import SwapSettingsModal, { Inputs } from './modals/SwapSettings';

const Swap = memo(() => {
  const publicKeyHash = useAccountAddressForTezos();

  const [slippageTolerance, setSlippageTolerance] = useState<number>(0.5);

  useEffect(() => {
    dispatch(resetSwapParamsAction());
  }, []);

  const [settingsModalOpened, setSettingsModalOpen, setSettingsModalClosed] = useBooleanState(false);

  const handleConfirmSlippageTolerance = useCallback(
    ({ slippageTolerance }: Inputs) => {
      setSlippageTolerance(slippageTolerance ?? 0.5);
      setSettingsModalClosed();
    },
    [setSettingsModalClosed]
  );

  const walletAddress = 'ADDRESS'; // TEST EVM address
  const nativeTokenAddress = '0x0000000000000000000000000000000000000000'; // ETHEREUM

  const handleGetChains = async () => {
    const chains = await lifi.getChains();
    console.log('EVM Chains:', chains);
  };

  const handleGetTools = async () => {
    const tools = await lifi.getTools();
    console.log('Tools:', tools);
  };

  const handleGetMockConnections = async () => {
    const tools = await lifi.getConnections();
    console.log('Mock Connection between native tokens of Ethereum mainnet and AVAX mainnet:', tools);
  };

  const handleGetTokens = async () => {
    const tokens = await lifi.getTokens();
    console.log('EVM Tokens:', tokens);
  };

  const handleGetTokenBalance = async () => {
    const balance = await lifi.getTokenBalance(walletAddress, ChainId.ETH, nativeTokenAddress);
    console.log('ETH Token Balance:', balance);
  };

  const handleGetTokenBalances = async () => {
    const balances = await lifi.getTokenBalances(walletAddress);
    console.log('All Token Balances:', balances);
  };

  const getRoutes = async () => {
    const routes = await lifi.getRoutes(routesRequest);
    console.log('Routes to transfer 0.1 AVAX to ETH', routes);
  };
  const getQuote = async () => {
    const routes = await lifi.getQuoteOnly(quoteRequest);
    console.log('Quote to transfer 0.1 AVAX to ETH', routes);
  };

  const executeQuoteFlowRequest = async () => {
    const executedRoute = await lifi.executeQuoteFlow(quoteRequest);
    console.log('executedRoute final', executedRoute);
  };

  useEffect(() => {
    // handleGetChains();
    // handleGetTools();
    // handleGetMockConnections();
    // handleGetTokens();
    //
    // handleGetTokenBalance();
    // handleGetTokenBalances();
    //
    // getRoutes();
    // getQuote();
    //
    // executeQuoteFlowRequest();
  }, []);

  return (
    <PageLayout
      pageTitle={<PageTitle title={t('swap')} />}
      contentPadding={false}
      noScroll
      headerRightElem={
        <IconBase Icon={ManageIcon} className="text-primary cursor-pointer" onClick={setSettingsModalOpen} />
      }
    >
      <div className="flex-1 flex-grow w-full max-w-sm mx-auto">
        <Suspense fallback={null}>
          {publicKeyHash ? (
            <>
              <SwapForm publicKeyHash={publicKeyHash} slippageTolerance={slippageTolerance} />
            </>
          ) : (
            <p className="text-center text-sm">
              <T id="noExchangersAvailable" />
            </p>
          )}
        </Suspense>

        <SwapSettingsModal
          onSubmit={handleConfirmSlippageTolerance}
          opened={settingsModalOpened}
          onRequestClose={setSettingsModalClosed}
        />
      </div>
    </PageLayout>
  );
});

export default Swap;
