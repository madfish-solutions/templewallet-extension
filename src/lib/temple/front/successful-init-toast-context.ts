import { createContext, Dispatch, SetStateAction } from 'react';

import { noop } from 'lodash';

type SuccessfulInitToastContextType = [string | undefined, Dispatch<SetStateAction<string | undefined>>];

export const SuccessfulInitToastContext = createContext<SuccessfulInitToastContextType>([undefined, noop]);
