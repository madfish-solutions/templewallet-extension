import { gql } from '@apollo/client';
import { map, of, catchError } from 'rxjs';

import { getApolloConfigurableClient } from 'lib/apollo';
import { KNOWN_TOKENS_SLUGS } from 'lib/temple/assets';

export const YUPANA_LEND_LINK = 'https://app.yupana.finance/lending';
export const KORDFI_LEND_LINK = 'https://kord.fi/lend';

// YUPANA API

const YUPANA_API = 'https://mainnet-api.yupana.finance/v1/graphql/';

const apolloYupanaClient = getApolloConfigurableClient(YUPANA_API);

interface GetApyFromYupanaResponse {
  asset: [{ rates: { supply_apy: string }[] }];
}

export const fetchKUSDApy$ = () => fetchYupanaApy$(KNOWN_TOKENS_SLUGS.KUSD, 'KUSD', 2);

export const fetchUSDTApy$ = () => fetchYupanaApy$(KNOWN_TOKENS_SLUGS.USDT, 'USDT', 6);

const fetchYupanaApy$ = (slug: string, yName: string, yId: number) =>
  apolloYupanaClient.query<GetApyFromYupanaResponse>(buildGetApyFromYupanaGqlQuery(yName, yId)).pipe(
    map(data => {
      const { rates } = data.asset[0];
      const { supply_apy } = rates[0];
      const apy = Number(supply_apy) / 10000000000000000;

      return {
        [slug]: Number(apy.toFixed(2))
      };
    }),
    catchError(() => of({ [slug]: 0 }))
  );

const buildGetApyFromYupanaGqlQuery = (yName: string, yId: number) => gql`
query Get${yName}Apy {
  asset(where: { ytoken: { _eq: ${yId} } }) {
    rates {
      supply_apy
    }
  }
}
`;

// KORD-FI API

const KORD_FI_API = 'https://back-mainnet.kord.fi/v1/graphql';

interface GetTzBtcApy {
  contractInfo: [{ tzbtcDepositRate: number }];
}

const apolloKordFiClient = getApolloConfigurableClient(KORD_FI_API);

export const fetchTzBtcApy$ = () =>
  apolloKordFiClient.query<GetTzBtcApy>(getTzBtcApyQuery).pipe(
    map(data => {
      const { tzbtcDepositRate = 0 } = data?.contractInfo?.[0] ?? {};

      return { [KNOWN_TOKENS_SLUGS.tzBTC]: Number(tzbtcDepositRate.toFixed(2)) };
    }),
    catchError(() => of({ [KNOWN_TOKENS_SLUGS.tzBTC]: 0 }))
  );

const getTzBtcApyQuery = gql`
  query GetTzBtcApy {
    contractInfo {
      tzbtcDepositRate
    }
  }
`;
