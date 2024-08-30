import React, { memo } from 'react';

import { EmojiInlineIcon } from 'lib/icons/emoji';

import { Banner } from './Banner';

interface Props {
  popup?: boolean;
  updateApp: EmptyFn;
}

export const UpdateAppBanner = memo<Props>(({ popup, updateApp }) => (
  <Banner
    title="Update your Temple Wallet extension!"
    description={
      <>
        <EmojiInlineIcon key="emoji" name="party-popper-1f389" className="align-sub" />
        {
          ' Great news! The newest version of Temple Wallet is available in the store. Please, update your extension to unlock all the latest improvements.'
        }
      </>
    }
    actionName="Update now"
    popup={popup}
    onActionClick={updateApp}
  />
));
