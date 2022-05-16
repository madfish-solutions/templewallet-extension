import React, { FC, useCallback, useEffect } from 'react';

import classNames from 'clsx';

import { T } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import { usePassiveStorage } from 'lib/temple/front';
import { getQuipuStakingInfo } from 'lib/templewallet-api/quipu-staking';

import styles from './Tokens.module.css';

const QUIPU_DEFAULT_PERCENTAGE = '13.5';

export const QuipuToken: FC = () => {
  const getQuipuStaking = useCallback(async () => {
    return await getQuipuStakingInfo();
  }, []);
  const { data: quipuStakingInfo, isValidating: loadingQuipuStaking } = useRetryableSWR(
    ['baking-history'],
    getQuipuStaking,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const [quipuApy, setQuipuApy] = usePassiveStorage('quipu_apy', QUIPU_DEFAULT_PERCENTAGE);

  useEffect(() => {
    if (!loadingQuipuStaking && quipuStakingInfo && quipuStakingInfo.item) {
      setQuipuApy(quipuStakingInfo.item.apy.toFixed(2));
    }
  }, [quipuStakingInfo, loadingQuipuStaking, setQuipuApy]);

  return (
    <a
      className={classNames('ml-1 px-2 py-1', styles['apyBadge'])}
      href="https://quipuswap.com/farming/3"
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
    >
      <T id="tokenApy">
        {message => (
          <span>
            {message}: {quipuApy}%{' '}
          </span>
        )}
      </T>
    </a>
  );
};
