import { memo, useCallback, useEffect } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { PageModal } from 'app/atoms/PageModal';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { NetworkSelectContent } from 'app/templates/NetworkSelectContent';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { OneOfChains } from 'temple/front';

import { OptionsContent } from './OptionsContent';

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const AssetsFilterOptionsModal = memo<Props>(({ opened, onRequestClose }) => {
  const { filterChain } = useAssetsFilterOptionsSelector();

  const [isNetworkSelectOpened, openNetworkSelect, closeNetworkSelect] = useBooleanState(false);

  useEffect(() => {
    if (!opened) closeNetworkSelect();
  }, [closeNetworkSelect, opened]);

  const handleClose = useCallback(() => {
    closeNetworkSelect();
    onRequestClose();
  }, [closeNetworkSelect, onRequestClose]);

  const handleFilterChainSelect = useCallback(
    (chain: OneOfChains | null) => {
      dispatch(setAssetsFilterChain(chain));
      closeNetworkSelect();
    },
    [closeNetworkSelect]
  );

  return (
    <PageModal
      opened={opened}
      title={t(isNetworkSelectOpened ? 'selectNetwork' : 'filters')}
      onGoBack={isNetworkSelectOpened ? closeNetworkSelect : undefined}
      onRequestClose={handleClose}
    >
      {isNetworkSelectOpened ? (
        <FadeTransition>
          <NetworkSelectContent opened selectedNetwork={filterChain} handleNetworkSelect={handleFilterChainSelect} />
        </FadeTransition>
      ) : (
        <OptionsContent onNetworkSelectClick={openNetworkSelect} />
      )}
    </PageModal>
  );
});
