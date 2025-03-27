import React, { memo } from 'react';

import { Button } from 'app/atoms';
import { ReactComponent as ExIcon } from 'app/icons/x.svg';
import { TestIDProps } from 'lib/analytics';

interface Props extends TestIDProps {
  onClick: EmptyFn;
}

export const OverlayCloseButton = memo<Props>(({ testID, testIDProperties, onClick }) => (
  <Button
    type="button"
    className="absolute z-1 top-3 right-3 p-2 flex items-center hover:bg-gray-100 rounded hover:opacity-90"
    onClick={onClick}
    testID={testID}
    testIDProperties={testIDProperties}
  >
    <ExIcon className="h-4 w-4 text-gray-600 stroke-current" />
  </Button>
));
