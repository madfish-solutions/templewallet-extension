import React, { FC, useCallback, useMemo, useState } from 'react';

import clsx from 'clsx';

import { Anchor } from 'app/atoms/Anchor';
import { openInFullPage, useAppEnv } from 'app/env';
import { DAppIcon } from 'app/templates/DAppsList/DAppIcon';
import DAppItem from 'app/templates/DAppsList/DAppItem';
import SearchField from 'app/templates/SearchField';
import { DappEnum, getDApps } from 'lib/apis/temple';
import { TID, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';

import { DAppStoreSelectors } from './DAppsList.selectors';

const USED_TAGS = Object.values(DappEnum).filter(x => typeof x !== 'number') as DappEnum[];
const TOP_DAPPS_SLUGS = ['quipuswap', 'objkt.com', 'youves'];

const DAppsList = () => {
  const { popup } = useAppEnv();
  const { data } = useRetryableSWR('dapps-list', getDApps, { suspense: true });

  const dApps = useMemo(() => {
    return data!.dApps.map(({ categories: rawCategories, ...restProps }) => {
      const categories = rawCategories.filter(name => name !== DappEnum.Other);
      if (categories.length !== rawCategories.length) {
        categories.push(DappEnum.Other);
      }
      return {
        categories,
        ...restProps
      };
    });
  }, [data]);

  const [searchString, setSearchString] = useState('');
  const [selectedTags, setSelectedTags] = useState<DappEnum[]>([]);

  const handleTagClick = useCallback((name: DappEnum) => {
    setSelectedTags(prevSelectedTags => {
      const tagIndex = prevSelectedTags.indexOf(name);
      const newSelectedTags = [...prevSelectedTags];
      if (tagIndex === -1) {
        newSelectedTags.push(name);
      } else {
        newSelectedTags.splice(tagIndex, 1);
      }
      return newSelectedTags;
    });
  }, []);

  const featuredDApps = useMemo(() => {
    const topDApps = dApps.filter(({ slug }) => TOP_DAPPS_SLUGS.some(topDAppSlug => topDAppSlug === slug));
    const otherDApps = dApps.filter(({ slug }) => !TOP_DAPPS_SLUGS.some(topDAppSlug => topDAppSlug === slug));
    return [...topDApps, ...otherDApps.slice(0, 3 - topDApps.length)];
  }, [dApps]);

  const matchingDApps = useMemo(() => {
    return dApps.filter(
      ({ name, categories }) =>
        name.toLowerCase().includes(searchString.toLowerCase()) &&
        selectedTags.every(selectedTag => categories.includes(selectedTag))
    );
  }, [dApps, searchString, selectedTags]);

  return (
    <div className={clsx('flex flex-col', popup && matchingDApps.length > 3 && 'pb-12')}>
      <span className="self-center text-sm text-gray-600 mb-2">{t('promoted')}</span>

      <div className={clsx(popup ? 'py-2 mb-4' : 'py-6 mb-6', 'rounded-lg bg-gray-100 flex justify-center')}>
        {featuredDApps.slice(0, 3).map(({ slug, name, logo, dappUrl }) => (
          <Anchor
            className="mx-4 py-1 flex flex-col items-center"
            key={slug}
            href={dappUrl}
            rel="noreferrer"
            testID={DAppStoreSelectors.DAppOpened}
            testIDProperties={{ website: dappUrl, name, promoted: true }}
          >
            <DAppIcon className="mb-2" name={name} logo={logo} />
            <span
              className={clsx(!popup && 'w-20', 'text-center overflow-hidden text-gray-900')}
              style={{
                textOverflow: 'ellipsis',
                width: popup ? '4.5rem' : undefined
              }}
            >
              {name}
            </span>
          </Anchor>
        ))}
      </div>

      <SearchField
        className={clsx(
          'bg-input-low rounded-lg placeholder-grey-1 hover:placeholder-text caret-primary',
          'transition ease-in-out duration-200'
        )}
        placeholder={t('searchDApps')}
        value={searchString}
        onValueChange={setSearchString}
      />

      <div className={clsx('mt-4', popup ? 'mb-4' : 'mb-6', 'flex justify-between')}>
        <div className={clsx(!popup && 'mr-2', 'flex-1 flex flex-wrap')}>
          {USED_TAGS.map(tag => (
            <Tag key={tag} name={tag} onClick={handleTagClick} selected={selectedTags.includes(tag)} />
          ))}
        </div>
      </div>

      {matchingDApps.slice(0, popup ? 3 : matchingDApps.length).map(dAppProps => (
        <DAppItem {...dAppProps} key={dAppProps.slug} />
      ))}

      <div
        className={clsx(
          'absolute bottom-0 left-0 h-16 bg-gray-200 w-full',
          (!popup || matchingDApps.length <= 3) && 'hidden'
        )}
        style={{ padding: '0.625rem 1.25rem' }}
      >
        <button
          className={clsx(
            'bg-white w-full h-full border border-blue-500 rounded flex shadow-sm',
            'justify-center items-center font-medium text-sm text-blue-500 leading-tight'
          )}
          type="button"
          onClick={openInFullPage}
        >
          {t('viewAll')}
        </button>
      </div>
    </div>
  );
};

export default DAppsList;

type TagProps = {
  name: DappEnum;
  onClick: (name: DappEnum) => void;
  selected: boolean;
};

const Tag: FC<TagProps> = ({ name, onClick, selected }) => {
  const handleClick = useCallback(() => onClick(name), [onClick, name]);

  return (
    <button
      className={clsx(
        'mr-2 mb-2 h-6 inline-flex items-center rounded-full px-4',
        'border border-gray-300 text-xs text-gray-900 hover:bg-gray-200',
        selected && 'bg-gray-200'
      )}
      onClick={handleClick}
      type="button"
    >
      {t(name.toLowerCase() as TID) || name}
    </button>
  );
};
