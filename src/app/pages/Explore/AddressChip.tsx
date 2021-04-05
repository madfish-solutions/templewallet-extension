import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import classNames from "clsx";
import useSWR from "swr";

import { ReactComponent as HashIcon } from "app/icons/hash.svg";
import { ReactComponent as LanguageIcon } from "app/icons/language.svg";
import HashChip from "app/templates/HashChip";
import {
  useTezos,
  useTezosDomainsClient,
  fetchFromStorage,
  putToStorage,
} from "lib/temple/front";

type AddressChipProps = {
  pkh: string;
  className?: string;
  small?: boolean;
};

const AddressChip: FC<AddressChipProps> = ({ pkh, className, small }) => {
  const tezos = useTezos();
  const { resolver: domainsResolver } = useTezosDomainsClient();

  const resolveDomainReverseName = useCallback(
    (_k: string, pkh: string) => domainsResolver.resolveAddressToName(pkh),
    [domainsResolver]
  );

  const { data: reverseName } = useSWR(
    () => ["tzdns-reverse-name", pkh, tezos.checksum],
    resolveDomainReverseName,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const [domainDisplayed, setDomainDisplayed] = useState(false);
  const domainDisplayedKey = useMemo(() => "domain-displayed", []);

  useEffect(() => {
    (async () => {
      try {
        const val = await fetchFromStorage(domainDisplayedKey);
        setDomainDisplayed(val ?? true);
      } catch {}
    })();
  }, [domainDisplayedKey, setDomainDisplayed]);

  const handleToggleDomainClick = useCallback(() => {
    setDomainDisplayed((d) => {
      const newValue = !d;
      putToStorage(domainDisplayedKey, newValue);
      return newValue;
    });
  }, [setDomainDisplayed, domainDisplayedKey]);

  const Icon = domainDisplayed ? HashIcon : LanguageIcon;

  return (
    <div className={classNames("flex items-center", className)}>
      {reverseName && domainDisplayed ? (
        <HashChip
          hash={reverseName}
          firstCharsCount={7}
          lastCharsCount={10}
          small={small}
        />
      ) : (
        <HashChip hash={pkh} small={small} />
      )}

      {reverseName && (
        <button
          type="button"
          className={classNames(
            "ml-2",
            "bg-gray-100 hover:bg-gray-200",
            "rounded-sm shadow-xs",
            small ? "text-xs" : "text-sm",
            "text-gray-500 leading-none select-none",
            "transition ease-in-out duration-300",
            "inline-flex items-center justify-center"
          )}
          style={{
            padding: 3,
          }}
          onClick={handleToggleDomainClick}
        >
          <Icon
            className={classNames(
              "w-auto stroke-current",
              small ? "h-3" : "h-4"
            )}
          />
        </button>
      )}
    </div>
  );
};

export default AddressChip;
