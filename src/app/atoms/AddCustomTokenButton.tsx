import React, { memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { ReactComponent as PlusCircleIcon } from 'app/icons/base/plus_circle.svg';
import { AddTokenModal } from 'app/pages/Home/OtherComponents/Tokens/components/AddTokenModal';
import { T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains } from 'temple/front';

import { Button } from './Button';
import { IconBase } from './IconBase';

interface Props {
  forCollectibles: boolean;
  manageActive: boolean;
  network?: OneOfChains;
  className?: string;
}

export const AddCustomTokenButton = memo<Props>(({ forCollectibles, manageActive, network, className }) => {
  const [addTokenModalOpened, setAddTokenModalOpen, setAddTokenModalClosed] = useBooleanState(false);

  const Component = manageActive ? Manage : Default;

  return (
    <>
      <Component onClick={setAddTokenModalOpen} className={className} />

      <AddTokenModal
        forCollectible={forCollectibles}
        opened={addTokenModalOpened}
        initialNetwork={network}
        onRequestClose={setAddTokenModalClosed}
      />
    </>
  );
});

interface CommonProps {
  onClick: EmptyFn;
  className?: string;
}

const Manage = memo<CommonProps>(({ onClick, className }) => (
  <Button
    className={clsx(
      'flex justify-between items-center p-3 rounded-8 border-0.5 bg-white border-lines hover:bg-grey-4',
      className
    )}
    onClick={onClick}
  >
    <span className="text-font-medium-bold">
      <T id="addTokenNonCapitalize" />
    </span>
    <IconBase Icon={PlusIcon} size={24} className="text-secondary" />
  </Button>
));

const Default = memo<CommonProps>(({ onClick, className }) => (
  <Button
    className={clsx(
      'w-fit flex flex-row mb-8 px-2 py-1 bg-secondary-low rounded-md text-font-description-bold text-secondary',
      className
    )}
    onClick={onClick}
  >
    <IconBase Icon={PlusCircleIcon} size={12} className="stroke-current" />
    <T id="addTokenNonCapitalize" />
  </Button>
));
