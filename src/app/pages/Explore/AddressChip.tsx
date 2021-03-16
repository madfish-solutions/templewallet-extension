import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import {
  useTezos,
  useTezosDomainsClient,
  fetchFromStorage,
  putToStorage,
} from "lib/temple/front";
import HashChip from "app/templates/HashChip";
import { ReactComponent as LanguageIcon } from "app/icons/language.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";

type AddressChipProps = {
  pkh: string;
  className?: string;
};

const AddressChip: React.FC<AddressChipProps> = ({ pkh, className }) => {
  const tezos = useTezos();
  const { resolver: domainsResolver } = useTezosDomainsClient();

  const resolveDomainReverseName = React.useCallback(
    (_k: string, pkh: string) => domainsResolver.resolveAddressToName(pkh),
    [domainsResolver]
  );

  const { data: reverseName } = useSWR(
    () => ["tzdns-reverse-name", pkh, tezos.checksum],
    resolveDomainReverseName,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  const [domainDisplayed, setDomainDisplayed] = React.useState(false);
  const domainDisplayedKey = React.useMemo(() => "domain-displayed", []);

  React.useEffect(() => {
    (async () => {
      try {
        const val = await fetchFromStorage(domainDisplayedKey);
        setDomainDisplayed(val ?? true);
      } catch {}
    })();
  }, [domainDisplayedKey, setDomainDisplayed]);

  const handleToggleDomainClick = React.useCallback(() => {
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
        <HashChip hash={reverseName} firstCharsCount={7} lastCharsCount={10} />
      ) : (
        <HashChip hash={pkh} />
      )}

      {reverseName && (
        <button
          type="button"
          className={classNames(
            "ml-2",
            "bg-gray-100 hover:bg-gray-200",
            "rounded-sm shadow-xs",
            "text-sm",
            "text-gray-500 leading-none select-none",
            "transition ease-in-out duration-300",
            "inline-flex items-center justify-center"
          )}
          style={{
            padding: 3,
          }}
          onClick={handleToggleDomainClick}
        >
          <Icon className="w-auto h-4 stroke-current" />
        </button>
      )}
    </div>
  );
};

export default AddressChip;
