import React, { memo, useCallback } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { dispatch } from 'app/store';
import { setTokenStatusAction } from 'app/store/assets/actions';
import { t, T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';

import modStyles from '../../Tokens.module.css';

interface Props {
  assetSlug: string;
}

export const ScamTag = memo<Props>(({ assetSlug }) => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const confirm = useConfirm();

  const removeToken = useCallback(
    async (slug: string) => {
      try {
        const confirmed = await confirm({
          title: t('deleteScamTokenConfirmTitle'),
          titleClassName: 'font-bold',
          description: t('deleteScamTokenConfirmDescription'),
          comfirmButtonText: t('delete')
        });

        if (confirmed)
          dispatch(
            setTokenStatusAction({
              account: publicKeyHash,
              chainId,
              slug,
              status: 'removed'
            })
          );
      } catch (err: any) {
        console.error(err);
        alert(err.message);
      }
    },
    [chainId, publicKeyHash, confirm]
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
      className={clsx('uppercase ml-2 px-2 py-1', modStyles.tagBase, modStyles.scamTag)}
      testID={AssetsSelectors.assetItemScamButton}
    >
      <T id="scam" />
    </Button>
  );
});
