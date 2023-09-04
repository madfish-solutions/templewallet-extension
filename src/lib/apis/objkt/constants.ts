import { getApolloConfigurableClient } from '../apollo';

const OBJKT_API = 'https://data.objkt.com/v3/graphql/';

export const apolloObjktClient = getApolloConfigurableClient(OBJKT_API);
