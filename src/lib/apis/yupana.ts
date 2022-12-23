import { gql } from '@apollo/client';
import { map, of, catchError } from 'rxjs';

import { getApolloConfigurableClient } from './apollo';

const YUPANA_API = 'https://mainnet-api.yupana.finance/v1/graphql/';

const apolloYupanaClient = getApolloConfigurableClient(YUPANA_API);

enum TOKENS_IDS {
  /** KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o_0 */
  'USDT' = 6,
  /** KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0 */
  'KUSD' = 2
}

interface GetApyFromYupanaResponse {
  asset: [{ rates: { supply_apy: string }[] }];
}

export const fetchApyFromYupana$ = (symbol: keyof typeof TOKENS_IDS) => {
  const request = buildGetApyFromYupanaGqlQuery(TOKENS_IDS[symbol]);

  return apolloYupanaClient.query<GetApyFromYupanaResponse>(request).pipe(
    map(data => {
      const { rates } = data.asset[0];
      const { supply_apy } = rates[0];
      const apy = Number(supply_apy) / 10000000000000000;

      return Number(apy.toFixed(2));
    }),
    catchError(() => of(0))
  );
};

const buildGetApyFromYupanaGqlQuery = (yId: number) => gql`
query GetTokenApy {
  asset(where: { ytoken: { _eq: ${yId} } }) {
    rates {
      supply_apy
    }
  }
}
`;
