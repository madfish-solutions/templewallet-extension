import React, { FC, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import axios from 'axios';
import clsx from 'clsx';

import { TID } from '../../../lib/i18n';
import { useAccount } from '../../../lib/temple/front';
import { Image } from '../../../lib/ui/Image';
import { getAllBitcoinAddressesForCurrentMnemonic } from '../../../newChains/bitcoin';
import Spinner from '../../atoms/Spinner/Spinner';
import { useTabSlug } from '../../atoms/useTabSlug';
import { useAppEnv } from '../../env';
import PageLayout from '../../layouts/PageLayout';
import { TabsBar } from '../../templates/TabBar';
import EditableTitle from '../Home/OtherComponents/EditableTitle';
import { ReceiveTab } from './ReceiveTab';
import { SendTab } from './SendTab';

export interface NonTezosToken {
  token_address: string;
  symbol: string;
  name: string;
  logo: string;
  thumbnail: string;
  decimals: number;
  balance: string;
  chainName: string;
  nativeToken: boolean;
  possible_spam: boolean;
}

interface TabData {
  name: string;
  titleI18nKey: TID;
  Component: FC;
}

interface Props {
  tokenAddress: string | null;
}
export const TokenPage: FC<Props> = ({ tokenAddress }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();
  const { evmPublicKeyHash } = useAccount();
  const isBitcoin = tokenAddress === 'btc';

  const [nonTezosTokens, setNonTezosTokens] = useState<NonTezosToken[]>([]);

  const getAllNonTezosTokens = async () => {
    if (!evmPublicKeyHash) {
      setNonTezosTokens([]);
      return;
    }

    const evmTokens = await getEvmTokensWithBalances(evmPublicKeyHash);

    setNonTezosTokens(evmTokens);
  };

  useEffect(() => {
    getAllNonTezosTokens();
  }, []);

  const currentToken = useMemo(() => {
    return nonTezosTokens.find(token => tokenAddress === token.token_address);
  }, [nonTezosTokens, tokenAddress]);

  const tabs: TabData[] = useMemo(
    () => [
      {
        name: 'Receive',
        titleI18nKey: 'receive',
        Component: () => <ReceiveTab address={evmPublicKeyHash} />
      },
      {
        name: 'Send',
        titleI18nKey: 'send',
        Component: () => <SendTab isBitcoin={isBitcoin} token={currentToken} accountPkh={evmPublicKeyHash} />
      }
    ],
    [currentToken, evmPublicKeyHash, isBitcoin]
  );

  const { name, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find(currentTab => currentTab.name === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <PageLayout
      pageTitle={
        <span className="font-normal">
          {isBitcoin ? 'Bitcoin' : isDefined(currentToken) ? currentToken.name : 'Token page'}
        </span>
      }
    >
      {fullPage && (
        <div className="w-full max-w-sm mx-auto">
          <EditableTitle />
          <hr className="mb-4" />
        </div>
      )}
      <div className="h-24">
        {isDefined(currentToken) ? (
          <div className="flex flex-row justify-between items-center py-4 px-24">
            <div className="flex flex-row gap-2 items-center">
              <Image src={currentToken.logo} alt={currentToken.name} height={50} width={50} />
              <div className="flex flex-col">
                <div className="font-bold">
                  {currentToken.symbol}
                  <span className="text-green-700">{' (' + currentToken.chainName + ')'}</span>
                </div>
                <div>{currentToken.name}</div>
              </div>
            </div>
            <div className="text-xl font-bold">
              {(Number(currentToken.balance) / 10 ** currentToken.decimals).toFixed(6) + ' ' + currentToken.symbol}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div>
              <Spinner theme="gray" className="w-20" />
            </div>
          </div>
        )}
      </div>

      <div className={clsx('-mx-4 shadow-top-light', fullPage && 'rounded-t-md')}>
        <TabsBar tabs={tabs} activeTabName={name} />
        <Component />
      </div>
    </PageLayout>
  );
};

export const getBitcoinWithBalance = async () => {
  const addresses = getAllBitcoinAddressesForCurrentMnemonic().join(';');

  const response = await axios.get<NonTezosToken>(`http://localhost:3000/api/bitcoin?addresses=${addresses}`);

  return response.data;
};

export const getEvmTokensWithBalances = async (pkh: string) => {
  const response = await axios.get<NonTezosToken[]>(`http://localhost:3000/api/evm-tokens?address=${pkh}`);

  return response.data;
};
