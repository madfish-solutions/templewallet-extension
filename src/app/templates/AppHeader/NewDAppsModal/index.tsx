import { memo, useMemo } from 'react';

import clsx from 'clsx';

import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { DAPPS_FOR_DEPOSITS } from 'lib/dapps-for-deposit';
import { T } from 'lib/i18n';
import { useDidMount } from 'lib/ui/hooks';
import { useStyledButtonClassName } from 'lib/ui/use-styled-button-or-link-props';
import { Link } from 'lib/woozie';

import { UpdateModalProps } from '../types';

import { NewDAppsModalSelectors } from './selectors';

const dAppsLogoComponents = [2, 0, 1].map(index => ({
  Icon: DAPPS_FOR_DEPOSITS[index].icon,
  id: DAPPS_FOR_DEPOSITS[index].id
}));

export const NewDAppsModal = memo(({ onClose, onShown }: UpdateModalProps) => {
  useDidMount(onShown);

  const styledButtonClassName = useStyledButtonClassName({ size: 'L', color: 'primary' });
  const goToEarnButtonClassName = useMemo(
    () => clsx(styledButtonClassName, 'w-full cursor-pointer text-center'),
    [styledButtonClassName]
  );

  return (
    <MiniPageModal opened onRequestClose={onClose}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex gap-3 justify-center">
          {dAppsLogoComponents.map(({ Icon, id }) => (
            <div className="p-2 rounded-8 bg-white border-0.5 border-lines" key={id}>
              <Icon className="size-9" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 text-center">
          <p className="text-font-regular-bold">
            <T id="newDAppsModalHeadline" />
          </p>
          <p className="text-font-description text-grey-1">
            <T id="newDAppsModalDescription" />
          </p>
        </div>
      </div>
      <ActionsButtonsBox className="pt-3">
        <Link
          to="/earn"
          className={goToEarnButtonClassName}
          onClick={onClose}
          testID={NewDAppsModalSelectors.goToEarnButton}
        >
          <T id="goToEarnPage" />
        </Link>
      </ActionsButtonsBox>
    </MiniPageModal>
  );
});
