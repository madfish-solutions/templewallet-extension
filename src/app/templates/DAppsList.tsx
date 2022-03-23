import React, { FC, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import { openInFullPage, useAppEnv } from 'app/env';
import DAppIcon from 'app/templates/DAppsList/DAppIcon';
import DAppItem from 'app/templates/DAppsList/DAppItem';
import SearchField from 'app/templates/SearchField';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { DappEnum, getDApps } from 'lib/custom-dapps-api';
import { t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';

import { DAppStoreSelectors } from './DAppsList.selectors';

const USED_TAGS = Object.values(DappEnum).filter(x => typeof x !== 'number') as DappEnum[];
const TOP_DAPPS_SLUGS = ['quipuswap', 'objkt.com', 'youves'];

const DAppsList = () => {
  const { trackEvent } = useAnalytics();
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

  const handleFeaturedClick = useCallback(
    (website: string, name: string) => {
      trackEvent(DAppStoreSelectors.DAppOpened, AnalyticsEventCategory.ButtonPress, { website, name, promoted: true });
    },
    [trackEvent]
  );

  return (
    <div
      className={classNames(
        popup ? 'px-1' : 'px-5',
        popup && matchingDApps.length > 3 ? 'pb-12' : 'pb-4',
        'w-full flex pt-2'
      )}
    >
      <div className="mx-auto flex flex-col items-center" style={{ maxWidth: '25rem' }}>
        <span className="text-sm text-gray-600 mb-2">{t('promoted')}</span>
        <div
          className={classNames(popup ? 'py-2 mb-4' : 'py-6 mb-6', 'rounded-lg bg-gray-100 w-full flex justify-center')}
        >
          {featuredDApps.slice(0, 3).map(({ slug, name, logo, dappUrl }) => (
            <a
              className="mx-4 py-1 flex flex-col items-center"
              key={slug}
              href={dappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleFeaturedClick(dappUrl, name)}
            >
              <DAppIcon className="mb-2" name={name} logo={logo} />
              <span
                className={classNames(!popup && 'w-20', 'text-center overflow-hidden text-gray-900')}
                style={{
                  textOverflow: 'ellipsis',
                  width: popup ? '4.5rem' : undefined
                }}
              >
                {name}
              </span>
            </a>
          ))}
        </div>
        <SearchField
          className={classNames(
            'py-2 pl-8 pr-4',
            'border border-gray-300',
            'transition ease-in-out duration-200',
            'rounded-lg',
            'text-gray-700 text-sm leading-tight',
            'placeholder-alphagray'
          )}
          containerClassName="mb-4"
          placeholder={t('searchDApps')}
          searchIconClassName="h-4 w-auto"
          searchIconWrapperClassName="px-2 text-gray-700"
          value={searchString}
          onValueChange={setSearchString}
        />
        <div className={classNames(popup ? 'mb-4' : 'mb-6', 'w-full flex justify-between')}>
          <div className={classNames(!popup && 'mr-2', 'flex-1 flex flex-wrap')}>
            {USED_TAGS.map(tag => (
              <Tag key={tag} name={tag} onClick={handleTagClick} selected={selectedTags.includes(tag)} />
            ))}
          </div>
        </div>
        {matchingDApps.slice(0, popup ? 3 : matchingDApps.length).map(dAppProps => (
          <DAppItem {...dAppProps} key={dAppProps.slug} />
        ))}
      </div>
      <div
        className={classNames(
          'absolute bottom-0 left-0 h-16 bg-gray-200 w-full',
          (!popup || matchingDApps.length <= 3) && 'hidden'
        )}
        style={{ padding: '0.625rem 1.25rem' }}
      >
        <button
          className={classNames(
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
      className={classNames(
        'mr-2 mb-2 h-6 inline-flex items-center rounded-full px-4',
        'border border-gray-300 text-xs text-gray-900 hover:bg-gray-200',
        selected && 'bg-gray-200'
      )}
      onClick={handleClick}
      type="button"
    >
      {t(name.toLowerCase()) || name}
    </button>
  );
};
