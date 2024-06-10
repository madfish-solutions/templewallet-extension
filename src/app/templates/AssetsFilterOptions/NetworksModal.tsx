import React, { memo, useEffect, useState } from 'react';

import { IconButton } from 'app/atoms/IconButton';
import { PageModal } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { SearchBarField } from 'app/templates/SearchField';
import { navigate } from 'lib/woozie';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const NetworksModal = memo<Props>(({ opened, onRequestClose }) => {
  const [searchValue, setSearchValue] = useState('');

  const [attractSelectedAccount, setAttractSelectedAccount] = useState(true);

  useEffect(() => {
    if (searchValue) setAttractSelectedAccount(false);
    else if (!opened) setAttractSelectedAccount(true);
  }, [opened, searchValue]);

  return (
    <PageModal title="Select Network" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">networks...</div>

      <div className="p-4 pb-6 flex flex-col bg-white">
        <StyledButton size="L" color="primary-low" onClick={onRequestClose}>
          Cancel
        </StyledButton>
      </div>
    </PageModal>
  );
});
