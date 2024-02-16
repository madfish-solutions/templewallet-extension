import { gql } from '@apollo/client';
import { map, of, catchError } from 'rxjs';

import { buildApolloClient } from './apollo';

/** TODO: Track the changes of this URL */
const YUPANA_API = 'https://preproduction-api.yupana.finance/v1/graphql/';

const apolloYupanaClient = buildApolloClient(YUPANA_API);

enum TOKENS_IDS {
  /** KT1UpeXdK6AJbX58GJ92pLZVCucn2DR8Nu4b_0 */
  'WTEZ' = 0,
  /** KT1SjXiUX63QvdNMcM2m492f7kuf8JxXRLp4_0 */
  'CTEZ' = 1,
  /** KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0 */
  'KUSD' = 2,
  /** KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_0 */
  'UUSD' = 3,
  /** KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn_0 */
  'TZBTC' = 4,
  /** KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_2 */
  'UBTC' = 5,
  /** KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o_0 */
  'USDT' = 6,
  /** KT1AafHA1C1vk959wvHWBispY9Y2f3fxBUUo_0 */
  'SIRS' = 7
}

interface GetApyFromYupanaResponse {
  asset: [{ rates: { supply_apy: string }[] }];
}

export const fetchApyFromYupana$ = (symbol: keyof typeof TOKENS_IDS) => {
  const request = buildGetApyFromYupanaGqlQuery(TOKENS_IDS[symbol]);

  return apolloYupanaClient.fetch$<GetApyFromYupanaResponse>(request).pipe(
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
