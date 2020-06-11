import * as React from "react";
import classNames from "clsx";
import { useStorage, ThanosSharedStorageKey } from "lib/thanos/front";
import FormCheckbox from "app/atoms/FormCheckbox";

const DAppSettings: React.FC = () => {
  const [dAppEnabled, setDAppEnabled] = useStorage(
    ThanosSharedStorageKey.DAppEnabled,
    false
  );

  const changingRef = React.useRef(false);
  const [error, setError] = React.useState<any>(null);

  const handleChange = React.useCallback(
    async (evt) => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      try {
        setDAppEnabled(evt.target.checked);
      } catch (err) {
        setError(err);
      }

      changingRef.current = false;
    },
    [setError, setDAppEnabled]
  );

  return (
    <div className="my-8 w-full mx-auto max-w-sm">
      <h2
        className={classNames("w-full mb-4", "leading-tight", "flex flex-col")}
      >
        <span
          className={classNames("text-xs font-light text-gray-600")}
          style={{ maxWidth: "90%" }}
        >
          Click on the checkmark to {dAppEnabled ? "disable" : "enable"} DApps
          interaction feature. It’s still in Alpha, but it can be used for
          testing and development purposes.
        </span>
      </h2>

      <FormCheckbox
        checked={dAppEnabled}
        onChange={handleChange}
        name="dAppEnabled"
        label={dAppEnabled ? "Enabled" : "Disabled"}
        labelDescription="DApps interaction"
        errorCaption={error?.message}
        containerClassName="mb-6"
      />
    </div>
  );
};

export default DAppSettings;
