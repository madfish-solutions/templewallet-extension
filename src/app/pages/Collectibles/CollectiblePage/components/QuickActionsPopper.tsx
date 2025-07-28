import React, { FC, memo, useMemo } from 'react';

import { Button, IconBase } from 'app/atoms';
import { ActionListItem, ActionListItemProps } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as MenuCircleIcon } from 'app/icons/base/menu_circle.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { useCopyText } from 'lib/ui/hooks/use-copy-text';
import Popper, { PopperRenderProps } from 'lib/ui/Popper';
import { OneOfChains } from 'temple/front';
import { useBlockExplorerHref } from 'temple/front/use-block-explorers';

import { CollectiblesSelectors } from '../selectors';

interface DropdownProps {
  assetSlug: string;
  network: OneOfChains;
}

export const QuickActionsPopper: FC<DropdownProps> = dropdownProps => (
  <Popper placement="bottom-end" strategy="fixed" popup={props => <Dropdown {...props} {...dropdownProps} />}>
    {({ ref, toggleOpened }) => (
      <Button ref={ref} onClick={toggleOpened} testID={CollectiblesSelectors.quickActions}>
        <IconBase Icon={MenuCircleIcon} className="text-primary" />
      </Button>
    )}
  </Popper>
);

interface Action extends ActionListItemProps {
  key: string;
}

const Dropdown = memo<PopperRenderProps & DropdownProps>(({ opened, setOpened, assetSlug, network }) => {
  const { contract, id } = fromFa2TokenSlug(assetSlug);

  const exploreContractUrl = useBlockExplorerHref(network.kind, network.chainId, 'address', contract);

  const handleCopyTokenId = useCopyText(id);

  const actions = useMemo<Action[]>(
    () => [
      {
        key: 'copy-token-id',
        children: t('copyTokenId'),
        Icon: CopyIcon,
        onClick: handleCopyTokenId,
        testID: CollectiblesSelectors.copyTokenId
      },
      {
        key: 'view-in-explorer',
        children: t('viewInBlockExplorer'),
        Icon: OutLinkIcon,
        externalLink: exploreContractUrl ?? '#',
        testID: CollectiblesSelectors.viewInExplorer
      }
    ],
    [exploreContractUrl, handleCopyTokenId]
  );

  return (
    <ActionsDropdownPopup title={t('quickActions')} opened={opened} style={{ minWidth: 154 }}>
      {actions.map(action => (
        <ActionListItem {...action} key={action.key} setOpened={setOpened} />
      ))}
    </ActionsDropdownPopup>
  );
});
