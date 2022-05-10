import { useCallback, useEffect } from 'react';

import { useRetryableSWR } from 'lib/swr';
import { usePassiveStorage } from 'lib/temple/front';
import { getQuipuWhitelist, TokenListItem } from 'lib/templewallet-api/token-list';

export const useQuipuTokenlist = () => {
  const getQuipuStaking = useCallback(async () => {
    return await getQuipuWhitelist();
  }, []);
  const { data: quipuStakingInfo, isValidating: loadingQuipuStaking } = useRetryableSWR(
    ['quipu-tokenlist'],
    getQuipuStaking,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  const [quipuTokenList, setQuipuTokenList] = usePassiveStorage<Array<TokenListItem>>('quipu_whitelist', []);

  useEffect(() => {
    if (!loadingQuipuStaking && quipuStakingInfo && quipuStakingInfo.tokens) {
      setQuipuTokenList(quipuStakingInfo.tokens.filter(x => x.contractAddress !== 'tez'));
    }
  }, [quipuStakingInfo, loadingQuipuStaking, setQuipuTokenList]);

  return quipuTokenList;
};

export const tokenListItemToSlug = (token: TokenListItem): string =>
  token.contractAddress === 'tez' ? 'tez' : `${token.contractAddress}_${token.fa2TokenId || 0}`;
