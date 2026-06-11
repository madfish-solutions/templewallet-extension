import { FC } from 'react';

import { useEthDepositChangeChart } from 'app/hooks/deposits/use-eth-deposit-change-chart';
import { useTezosDepositChangeChart } from 'app/hooks/deposits/use-tezos-deposit-change-chart';
import { useFiatCurrency } from 'lib/fiat-currency';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { EarnCardContent } from './content';

export const EarnCard = () => {
  const tezosPkh = useAccountAddressForTezos();
  const evmPkh = useAccountAddressForEvm();

  if (tezosPkh && evmPkh) {
    return <CombinedEarnCard tezosAccountPkh={tezosPkh} evmAccountPkh={evmPkh} />;
  }

  if (tezosPkh) {
    return <TezosEarnCard tezosAccountPkh={tezosPkh} />;
  }

  if (evmPkh) {
    return <EvmEarnCard evmAccountPkh={evmPkh} />;
  }

  return null;
};

interface CombinedEarnCardProps {
  tezosAccountPkh: string;
  evmAccountPkh: HexString;
}

const CombinedEarnCard: FC<CombinedEarnCardProps> = ({ tezosAccountPkh, evmAccountPkh }) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading: isTezosChartLoading,
    isError: isTezosChartError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  const {
    data: ethChartData,
    isLoading: isEthChartLoading,
    isError: isEthChartError
  } = useEthDepositChangeChart(evmAccountPkh);

  const isChartLoading = isTezosChartLoading || isEthChartLoading;
  const isChartError = isTezosChartError || isEthChartError;

  return (
    <EarnCardContent
      tezosChartData={tezosChartData}
      ethChartData={ethChartData}
      isChartLoading={isChartLoading}
      isChartError={isChartError}
      selectedFiatCurrency={selectedFiatCurrency}
    />
  );
};

interface TezosEarnCardProps {
  tezosAccountPkh: string;
}

const TezosEarnCard: FC<TezosEarnCardProps> = ({ tezosAccountPkh }) => {
  const {
    data: tezosChartData,
    selectedFiatCurrency,
    isLoading: isTezosChartLoading,
    isError: isTezosChartError
  } = useTezosDepositChangeChart(tezosAccountPkh);

  return (
    <EarnCardContent
      tezosChartData={tezosChartData}
      ethChartData={undefined}
      isChartLoading={isTezosChartLoading}
      isChartError={isTezosChartError}
      selectedFiatCurrency={selectedFiatCurrency}
    />
  );
};

interface EvmEarnCardProps {
  evmAccountPkh: HexString;
}

const EvmEarnCard: FC<EvmEarnCardProps> = ({ evmAccountPkh }) => {
  const { selectedFiatCurrency } = useFiatCurrency();
  const {
    data: ethChartData,
    isLoading: isEthChartLoading,
    isError: isEthChartError
  } = useEthDepositChangeChart(evmAccountPkh);

  return (
    <EarnCardContent
      tezosChartData={undefined}
      ethChartData={ethChartData}
      isChartLoading={isEthChartLoading}
      isChartError={isEthChartError}
      selectedFiatCurrency={selectedFiatCurrency}
    />
  );
};
