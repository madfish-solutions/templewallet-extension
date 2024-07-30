import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import { ReactComponent as EmptySearchIcon } from 'app/icons/search_empty.svg';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { AddTokenModal } from './AddTokenModal';

export const EmptySection = memo(() => {
  const [addTokenModalOpened, setAddTokenModalOpen, setAddTokenModalClosed] = useBooleanState(false);

  return (
    <>
      <div className="w-full h-full flex flex-col items-center">
        <div className="flex-1 py-7 flex flex-col items-center justify-center text-grey-2">
          <EmptySearchIcon />

          <p className="mt-2 text-center text-font-medium-bold">
            <T id="notFound" />
          </p>
        </div>
        <Button
          className="w-fit flex flex-row mb-8 px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary"
          onClick={setAddTokenModalOpen}
        >
          <IconBase Icon={AddIcon} size={12} className="stroke-current" />
          <T id="addCustomToken" />
        </Button>
      </div>

      <AddTokenModal opened={addTokenModalOpened} onRequestClose={setAddTokenModalClosed} />
    </>
  );
});
