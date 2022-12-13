import { gql } from '@apollo/client';
import { map, of, catchError } from 'rxjs';

import { getApolloConfigurableClient } from 'lib/apollo';

const KORD_FI_API = 'https://back-mainnet.kord.fi/v1/graphql';

interface GetTzBtcApy {
  contractInfo: [{ tzbtcDepositRate: number }];
}

const apolloKordFiClient = getApolloConfigurableClient(KORD_FI_API);

export const fetchKordFiTzBtcApy$ = () => {
  const request = getTzBtcApyQuery;

  return apolloKordFiClient.query<GetTzBtcApy>(request).pipe(
    map(data => {
      const { tzbtcDepositRate = 0 } = data?.contractInfo?.[0] ?? {};

      return Number(tzbtcDepositRate.toFixed(2));
    }),
    catchError(() => of(0))
  );
};

const getTzBtcApyQuery = gql`
  query GetTzBtcApy {
    contractInfo {
      tzbtcDepositRate
    }
  }
`;
