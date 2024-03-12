import { useContext } from 'react';

import { CustomRpcContext } from './custom-rpc.context';

/** TODO: Do we need this context? Why not just take it from useNetwork hook? Because of 'ready' status?
 * If needed - accommodate for EVM RPC URL too
 */
export const useAnalyticsNetwork = () => useContext(CustomRpcContext);
