import React, { memo, useCallback } from 'react';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { dispatch } from 'app/store';
import { setTezosCollectibleStatusAction, setTezosTokenStatusAction } from 'app/store/tezos/assets/actions';
import { t, T } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';
import { navigate } from 'lib/woozie';
import { useAccountAddressForTezos } from 'temple/front';

interface Props {
  assetSlug: string;
  tezosChainId: string;
  isCollectible: boolean;
}

export const ScamTokenAlert = memo(({ assetSlug, tezosChainId, isCollectible }: Props) => {
  const confirm = useConfirm();
  const accountPkh = useAccountAddressForTezos();

  const removeToken = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          hasCancelButton: false,
          title: t('deleteScamTokenConfirmTitle'),
          description: t('deleteScamTokenConfirmDescription'),
          confirmButtonText: t('delete')
        });

        if (confirmed && accountPkh)
          if (isCollectible) {
            dispatch(
              setTezosCollectibleStatusAction({
                account: accountPkh,
                chainId: tezosChainId,
                slug: assetSlug,
                status: 'removed'
              })
            );
          } else {
            dispatch(
              setTezosTokenStatusAction({
                account: accountPkh,
                chainId: tezosChainId,
                slug,
                status: 'removed'
              })
            );
          }
        navigate(isCollectible ? '/?tab=collectibles' : '/?tab=tokens');
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [confirm, accountPkh, isCollectible, tezosChainId, assetSlug]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      removeToken(assetSlug);
    },
    [assetSlug, removeToken]
  );

  return (
    <Button
      onClick={handleClick}
      testID={AssetsSelectors.assetItemScamButton}
      className="p-4 rounded-md flex items-center justify-between bg-error-low"
    >
      <span className="flex items-center">
        <ErrorIcon className="w-6 h-6" />

        <p className="ml-1 text-font-description">
          <T id="scamTokenAlert" />
        </p>
      </span>
      <IconBase size={16} Icon={ChevronRightIcon} className="text-error" />
    </Button>
  );
});
