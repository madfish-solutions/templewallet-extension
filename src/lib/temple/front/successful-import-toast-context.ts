import { createContext, Dispatch, SetStateAction } from 'react';

import { noop } from 'lodash';

type SuccessfulImportToastContextType = [boolean, Dispatch<SetStateAction<boolean>>];

export const SuccessfulImportToastContext = createContext<SuccessfulImportToastContextType>([false, noop]);
