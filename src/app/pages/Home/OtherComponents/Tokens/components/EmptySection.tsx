import React, { memo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { EmptyState } from 'app/atoms/EmptyState';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import { T, TID } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains } from 'temple/front';

import { AddTokenModal } from './AddTokenModal';

interface Props {
  forCollectibles: boolean;
  textI18n?: TID;
  network?: OneOfChains;
}

export const EmptySection = memo<Props>(({ forCollectibles, textI18n, network }) => {
  const [addTokenModalOpened, setAddTokenModalOpen, setAddTokenModalClosed] = useBooleanState(false);

  return (
    <>
      <div className="w-full h-full flex flex-col items-center">
        <EmptyState textI18n={textI18n} stretch />

        <Button
          className="w-fit flex flex-row mb-8 px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary"
          onClick={setAddTokenModalOpen}
        >
          <IconBase Icon={AddIcon} size={12} className="stroke-current" />
          <T id="addCustomToken" />
        </Button>
      </div>

      <AddTokenModal
        forCollectible={forCollectibles}
        opened={addTokenModalOpened}
        onRequestClose={setAddTokenModalClosed}
        initialNetwork={network}
      />
    </>
  );
});
