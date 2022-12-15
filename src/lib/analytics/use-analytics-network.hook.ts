import { useContext } from 'react';

import { CustomRpcContext } from './custom-rpc.context';

export const useAnalyticsNetwork = () => useContext(CustomRpcContext);
