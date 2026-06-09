import { useTempleDealsSettings } from 'app/hooks/use-temple-deals-settings';
import { T } from 'lib/i18n';

import { EnablingSetting } from '../enabling-setting';

import { AdvancedFeaturesSelectors } from './selectors';

export const DealsSettings = () => {
  const { isEnabled, setEnabled } = useTempleDealsSettings();

  return (
    <EnablingSetting
      title={<T id="deals" />}
      description={<T id="dealsDescription" />}
      enabled={isEnabled}
      onChange={setEnabled}
      testID={AdvancedFeaturesSelectors.deals}
    />
  );
};
