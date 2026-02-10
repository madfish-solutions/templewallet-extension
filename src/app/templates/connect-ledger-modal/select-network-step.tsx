import React, { ReactNode, memo, useCallback, useEffect, useState } from 'react';

import { DerivationType } from '@taquito/ledger-signer';
import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Button, FormField } from 'app/atoms';
import { RadioButton } from 'app/atoms/RadioButton';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { ToggleSwitch } from 'app/atoms/ToggleSwitch';
import { Tooltip } from 'app/atoms/Tooltip';
import { setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { validateDerivationPath } from 'lib/temple/front';
import { TempleChainKind } from 'temple/types';

import { ChainKindLabel } from '../chain-kind-label';
import { PageModalScrollViewWithActions } from '../page-modal-scroll-view-with-actions';

import { ConnectLedgerModalSelectors } from './selectors';
import { LedgerConnectionConfig } from './types';

interface SelectNetworkStepProps {
  onSelect: SyncFn<LedgerConnectionConfig>;
  initialSelection?: LedgerConnectionConfig;
}

const derivationTypesCharacteristics = {
  [DerivationType.ED25519]: {
    name: 'ED25519',
    accountPrefix: 'tz1'
  },
  [DerivationType.BIP32_ED25519]: {
    name: 'BIP32_ED25519',
    accountPrefix: 'tz1'
  },
  [DerivationType.SECP256K1]: {
    name: 'SECP256K1',
    accountPrefix: 'tz2'
  },
  [DerivationType.P256]: {
    name: 'P256',
    accountPrefix: 'tz3'
  }
};

const allDerivationTypes = [
  DerivationType.ED25519,
  DerivationType.BIP32_ED25519,
  DerivationType.SECP256K1,
  DerivationType.P256
];

export const SelectNetworkStep = memo<SelectNetworkStepProps>(({ onSelect, initialSelection }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<TempleChainKind>(
    initialSelection?.chainKind ?? TempleChainKind.EVM
  );
  const [customSettingsEnabled, setCustomSettingsEnabled] = useState<boolean>(Boolean(initialSelection?.tezosSettings));
  const [derivationType, setDerivationType] = useState<DerivationType>(
    initialSelection?.tezosSettings?.derivationType ?? DerivationType.ED25519
  );
  const [customIndexOrPath, setCustomIndexOrPath] = useState(
    initialSelection?.tezosSettings?.indexOrDerivationPath ?? ''
  );
  const [customIndexOrPathError, setCustomIndexOrPathError] = useState<string>();

  useEffect(() => {
    if (!initialSelection) {
      setSelectedNetwork(TempleChainKind.EVM);
      setCustomSettingsEnabled(false);
      setDerivationType(DerivationType.ED25519);
      setCustomIndexOrPath('');
      setCustomIndexOrPathError(undefined);
      return;
    }

    setSelectedNetwork(initialSelection.chainKind);
    setCustomSettingsEnabled(Boolean(initialSelection.tezosSettings));
    setDerivationType(initialSelection.tezosSettings?.derivationType ?? DerivationType.ED25519);
    setCustomIndexOrPath(initialSelection.tezosSettings?.indexOrDerivationPath ?? '');
    setCustomIndexOrPathError(undefined);
  }, [initialSelection]);

  const validateIndexOrDerivationPath = useCallback((rawValue: string) => {
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      return true;
    }

    if (trimmedValue.includes('/')) {
      return validateDerivationPath(trimmedValue);
    }

    const parsedIndex = Number(trimmedValue);

    if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
      return t('invalidIndexError');
    }

    return true;
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedNetwork === TempleChainKind.Tezos && customSettingsEnabled) {
      const validationResult = validateIndexOrDerivationPath(customIndexOrPath);

      if (validationResult !== true) {
        setCustomIndexOrPathError(validationResult);
        return;
      }

      const trimmedIndexOrPath = customIndexOrPath.trim();

      onSelect({
        chainKind: TempleChainKind.Tezos,
        tezosSettings: {
          derivationType,
          ...(trimmedIndexOrPath ? { indexOrDerivationPath: trimmedIndexOrPath } : {})
        }
      });
      return;
    }

    onSelect({ chainKind: selectedNetwork });
  }, [
    customIndexOrPath,
    customSettingsEnabled,
    derivationType,
    onSelect,
    selectedNetwork,
    validateIndexOrDerivationPath
  ]);

  const handleToggleCustomSettings = useCallback((nextValue: boolean) => {
    setCustomSettingsEnabled(nextValue);
    if (!nextValue) {
      setCustomIndexOrPathError(undefined);
    }
  }, []);

  const handleIndexOrPathChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCustomIndexOrPath(event.target.value);
      if (customIndexOrPathError) {
        setCustomIndexOrPathError(undefined);
      }
    },
    [customIndexOrPathError]
  );

  return (
    <FadeTransition>
      <PageModalScrollViewWithActions
        className="px-0!"
        actionsBoxProps={{
          shouldChangeBottomShift: false,
          children: (
            <StyledButton
              size="L"
              className="w-full"
              color="primary"
              onClick={handleContinue}
              testID={ConnectLedgerModalSelectors.continueButton}
            >
              <T id="continue" />
            </StyledButton>
          )
        }}
      >
        <div className="flex flex-col gap-1 p-4">
          <span className="text-font-description-bold m-1">{t('selectNetwork')}</span>
          <div className="flex flex-col gap-3">
            <NetworkOption
              chainKind={TempleChainKind.EVM}
              tooltipText={t('evmLedgerTooltip')}
              selected={selectedNetwork === TempleChainKind.EVM}
              onSelectClick={setSelectedNetwork}
            />

            <NetworkOption
              chainKind={TempleChainKind.Tezos}
              tooltipText={t('tezosLedgerTooltip')}
              selected={selectedNetwork === TempleChainKind.Tezos}
              onSelectClick={setSelectedNetwork}
            >
              <TezosCustomSettings
                enabled={customSettingsEnabled}
                derivationType={derivationType}
                onToggle={handleToggleCustomSettings}
                onDerivationTypeChange={setDerivationType}
                indexOrPath={customIndexOrPath}
                onIndexOrPathChange={handleIndexOrPathChange}
                error={customIndexOrPathError}
              />
            </NetworkOption>
          </div>
        </div>
      </PageModalScrollViewWithActions>
    </FadeTransition>
  );
});

interface NetworkOptionProps {
  chainKind: TempleChainKind;
  tooltipText: ReactNode;
  selected: boolean;
  onSelectClick: SyncFn<TempleChainKind>;
  children?: ReactNode;
}

const NetworkOption = memo<NetworkOptionProps>(({ chainKind, tooltipText, selected, onSelectClick, children }) => {
  const handleClick = useCallback(() => onSelectClick(chainKind), [chainKind, onSelectClick]);

  return (
    <SettingsCellGroup className={clsx('transition-all cursor-pointer', selected && 'border-1! border-primary!')}>
      <div onClick={handleClick}>
        <SettingsCellSingle
          isLast
          cellName={<ChainKindLabel chainKind={chainKind} tooltipText={tooltipText} />}
          Component={Button}
          testID={ConnectLedgerModalSelectors.selectNetworkButton}
          testIDProperties={{ chainKind }}
        />
        {children}
      </div>
    </SettingsCellGroup>
  );
});

interface TezosCustomSettingsProps {
  enabled: boolean;
  derivationType: DerivationType;
  onToggle: SyncFn<boolean>;
  onDerivationTypeChange: SyncFn<DerivationType>;
  indexOrPath: string;
  onIndexOrPathChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
}

const TezosCustomSettings = memo<TezosCustomSettingsProps>(
  ({ enabled, derivationType, onToggle, onDerivationTypeChange, indexOrPath, onIndexOrPathChange, error }) => {
    const handleToggleChange = useCallback(() => onToggle(!enabled), [enabled, onToggle]);

    return (
      <div className="flex flex-col px-4 py-3 bg-background rounded-b-lg">
        <div className="flex items-center justify-between">
          <span className="text-font-description">
            <T id="customSettings" />
          </span>
          <ToggleSwitch
            small={true}
            checked={enabled}
            onChange={handleToggleChange}
            testID={ConnectLedgerModalSelectors.customSettingsToggle}
          />
        </div>

        {enabled && (
          <div className="flex flex-col gap-3 mt-7 mb-1">
            <div className="flex flex-col">
              <span className="text-font-description-bold">
                <T id="derivationType" />
              </span>

              <div className="flex flex-col mt-1 bg-white rounded-lg border-0.5 border-lines">
                {allDerivationTypes.map((type, index) => {
                  const { name, accountPrefix } = derivationTypesCharacteristics[type];
                  const active = type === derivationType;

                  return (
                    <button
                      type="button"
                      key={type}
                      className={clsx(
                        'flex items-center justify-between p-3 border-lines bg-transparent cursor-pointer',
                        index !== 0 && 'border-t-0.5'
                      )}
                      onClick={() => onDerivationTypeChange(type)}
                      {...setTestID(ConnectLedgerModalSelectors.derivationTypeOptionButton)}
                    >
                      <div className="flex">
                        <span className="text-font-medium">
                          {name} {`(${accountPrefix}...)`}
                        </span>
                      </div>
                      <RadioButton active={active} variant="dot" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-font-description-bold">
                  <T id="indexOrDerivationPath" />
                </span>
                <Tooltip
                  content={
                    <span className="font-normal">
                      <T id="indexOrDerivationPathDescription" />
                    </span>
                  }
                  size={16}
                  className="text-grey-3"
                  wrapperClassName="max-w-60"
                />
              </div>
              <FormField
                value={indexOrPath}
                onChange={onIndexOrPathChange}
                id="tezos-custom-derivation"
                type="text"
                placeholder={t('indexOrDerivationPathPlaceholder')}
                errorCaption={error}
                reserveSpaceForError={false}
                testID={ConnectLedgerModalSelectors.customSettingsInput}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);
