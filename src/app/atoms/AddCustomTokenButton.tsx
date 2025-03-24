import React, { memo } from 'react';

import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { AddTokenModal } from 'app/pages/Home/OtherComponents/Tokens/components/AddTokenModal';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { Button } from './Button';
import { IconBase } from './IconBase';

export const AddCustomTokenButton = memo<{ forCollectibles: boolean }>(({ forCollectibles }) => {
  const [addTokenModalOpened, setAddTokenModalOpen, setAddTokenModalClosed] = useBooleanState(false);

  return (
    <>
      <Button
        className="flex justify-between items-center p-3 mb-4 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
        onClick={setAddTokenModalOpen}
      >
        <span className="text-font-medium-bold">
          <T id="addCustomToken" />
        </span>
        <IconBase Icon={PlusIcon} size={24} className="text-secondary" />
      </Button>

      <AddTokenModal
        forCollectible={forCollectibles}
        opened={addTokenModalOpened}
        onRequestClose={setAddTokenModalClosed}
      />
    </>
  );
});
