import * as React from "react";
import classNames from "clsx";
import useSWR from "swr";
import {
  resolveReverseName,
  usePassiveStorage,
  useTezosDomains,
} from "lib/thanos/front";
import HashChip from "app/templates/HashChip";
import { ReactComponent as LanguageIcon } from "app/icons/language.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";

type AddressChipProps = {
  pkh: string;
  className?: string;
};

const AddressChip: React.FC<AddressChipProps> = ({ pkh, className }) => {
  const tezosDomains = useTezosDomains();
  const { data: reverseName } = useSWR(
    () => ["resolve-reverse-name", pkh, tezosDomains],
    resolveReverseName,
    { shouldRetryOnError: false }
  );

  const [domainDisplayed, setDomainDisplayed] = usePassiveStorage(
    "domain-displayed",
    true
  );

  const handleToggleDomainClick = React.useCallback(() => {
    setDomainDisplayed((d) => !d);
  }, [setDomainDisplayed]);

  const Icon = domainDisplayed ? HashIcon : LanguageIcon;

  return (
    <div className={classNames("flex items-center", className)}>
      {reverseName && domainDisplayed ? (
        <HashChip hash={reverseName} firstCharsCount={5} lastCharsCount={8} />
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
