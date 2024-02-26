import React, { memo, useCallback, useState } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import { AssetsSelectors } from 'app/pages/Home/OtherComponents/Assets.selectors';
import { dispatch } from 'app/store';
import { setTokenStatusAction } from 'app/store/assets/actions';
import { SCAM_COLORS } from 'lib/assets/known-tokens';
import { t, T } from 'lib/i18n';
import { useAccount, useChainId } from 'lib/temple/front';
import { useConfirm } from 'lib/ui/dialog';

import modStyles from '../../Tokens.module.css';

interface Props {
  assetSlug: string;
}

export const ScamTag = memo<Props>(({ assetSlug }) => {
  const [hovered, setHovered] = useState(false);

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

  return (
    <Button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        removeToken(assetSlug);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      testID={AssetsSelectors.assetItemScamButton}
      className={clsx('uppercase ml-2 px-2 py-1', modStyles['apyTag'])}
      style={{ backgroundColor: hovered ? SCAM_COLORS.bgHover : SCAM_COLORS.bg }}
    >
      <T id="scam" />
    </Button>
  );
});
