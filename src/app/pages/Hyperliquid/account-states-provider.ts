import { useState, useEffect } from 'react';

import { PerpsClearinghouseState, SpotClearinghouseState, WsWebData2 } from '@nktkas/hyperliquid';
import constate from 'constate';

import { useClients } from './clients';
import { AccountStates } from './types';

const defaultPerpsState: PerpsClearinghouseState = {
  marginSummary: {
    accountValue: '0',
    totalNtlPos: '0',
    totalRawUsd: '0',
    totalMarginUsed: '0'
  },
  crossMarginSummary: {
    accountValue: '0',
    totalNtlPos: '0',
    totalRawUsd: '0',
    totalMarginUsed: '0'
  },
  crossMaintenanceMarginUsed: '0',
  withdrawable: '0',
  assetPositions: [],
  time: 0
};

const defaultSpotState: SpotClearinghouseState = {
  balances: []
};

export const [AccountStatesProvider, useAccountStates] = constate(() => {
  const { addWebData2Listener, removeWebData2Listener } = useClients();
  const [accountStates, setAccountStates] = useState<AccountStates>();
  useEffect(() => {
    const webData2Listener = ({
      clearinghouseState: perpsState = defaultPerpsState,
      spotState = defaultSpotState
    }: WsWebData2) => {
      setAccountStates({ spotState, perpsState });
    };

    addWebData2Listener(webData2Listener);

    return () => {
      removeWebData2Listener(webData2Listener);
    };
  }, [addWebData2Listener, removeWebData2Listener]);

  return { accountStates };
});
