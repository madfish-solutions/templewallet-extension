import React, { useState } from 'react';

import { FormField } from 'app/atoms';
import { T } from 'lib/i18n';

import { FeeOptions, OptionLabel } from './components/FeeOptions';

export const FeeTab = () => {
  const [selectedOption, setSelectedOption] = useState<OptionLabel>('mid');

  return (
    <>
      <FeeOptions activeOptionName={selectedOption} onOptionClick={setSelectedOption} />

      <div className="mt-4 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">Gas Price</p>
        <p className="text-grey-2 text-font-description">
          <T id="optional" />
        </p>
      </div>

      <FormField
        type="number"
        name="gas-price"
        id="gas-price"
        placeholder="1.0"
        rightSideComponent={<div className="text-font-description-bold text-grey-2">GWEI</div>}
      />
    </>
  );
};
