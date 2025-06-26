import { buildApolloClient } from '../apollo';

const OBJKT_API = 'https://data.objkt.com/v3/graphql/';

export const apolloObjktClient = buildApolloClient(OBJKT_API);

/** See: https://data.objkt.com/docs/#limits
 *
 * Although, API sets limit of 500 items, there is also an implicit byte-size payload limit.
 * Which can be reached easily, if passing large token IDs in items, resulting in error 413.
 */
export const MAX_OBJKT_QUERY_RESPONSE_ITEMS = 250;
