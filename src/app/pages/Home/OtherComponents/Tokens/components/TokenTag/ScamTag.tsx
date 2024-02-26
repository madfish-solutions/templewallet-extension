import React, { memo, useCallback } from 'react';

import { Button } from 'app/atoms/Button';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { dispatch } from 'app/store';
import { setTokenStatusAction } from 'app/store/assets/actions';
import { t, T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';

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
          title: t('deleteTokenConfirm')
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

  return (
    <Button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        removeToken(assetSlug);
      }}
      testID={AssetsSelectors.assetItemScamButton}
      className="ml-2 px-2 py-1"
    >
      <T id="scam" />
    </Button>
  );
});
