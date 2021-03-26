import React, { useMemo, useCallback, FC } from "react";

import classNames from "clsx";
import { browser } from "webextension-polyfill-ts";

import Flag from "app/atoms/Flag";
import { T } from "lib/i18n/react";
import {
  BlockExplorer,
  BLOCK_EXPLORERS,
  useBlockExplorer,
} from "lib/temple/front";

import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "./IconifiedSelect";

type BlockExplorerSelectProps = {
  className?: string;
};

const getBlockExplorerId = ({ id }: BlockExplorer) => id;

const BlockExplorerSelect: FC<BlockExplorerSelectProps> = ({ className }) => {
  const { explorer, setExplorerId } = useBlockExplorer();

  const title = useMemo(
    () => (
      <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
        <span className="text-base font-semibold text-gray-700">
          <T id="blockExplorer" />
        </span>
      </h2>
    ),
    []
  );

  const handleBlockExplorerChange = useCallback(
    (option: BlockExplorer) => {
      setExplorerId(option.id);
    },
    [setExplorerId]
  );

  return (
    <IconifiedSelect
      Icon={BlockExplorerIcon}
      OptionSelectedIcon={BlockExplorerIcon}
      OptionInMenuContent={BlockExplorerInMenuContent}
      OptionSelectedContent={BlockExplorerSelectContent}
      getKey={getBlockExplorerId}
      options={BLOCK_EXPLORERS}
      value={explorer}
      onChange={handleBlockExplorerChange}
      title={title}
      className={className}
    />
  );
};

export default BlockExplorerSelect;

const BlockExplorerIcon: FC<
  IconifiedSelectOptionRenderProps<BlockExplorer>
> = ({ option: { id, name } }) => (
  <Flag
    alt={name}
    className="ml-2 mr-3"
    src={browser.runtime.getURL(`/misc/explorer-logos/${id}.ico`)}
  />
);

const BlockExplorerInMenuContent: FC<
  IconifiedSelectOptionRenderProps<BlockExplorer>
> = ({ option: { name } }) => {
  return (
    <div className={classNames("relative w-full text-lg text-gray-700")}>
      {name}
    </div>
  );
};

const BlockExplorerSelectContent: FC<
  IconifiedSelectOptionRenderProps<BlockExplorer>
> = ({ option }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{option.name}</span>
    </div>
  );
};
