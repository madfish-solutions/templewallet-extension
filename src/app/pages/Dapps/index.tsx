import React, { FC, useCallback, useState } from 'react';

import clsx from 'clsx';

import { PageTitle } from 'app/atoms';
import { FireAnimatedEmoji } from 'app/atoms/fire-animated-emoji';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';
import { SearchBarField } from 'app/templates/SearchField';
import { DappEnum } from 'lib/apis/temple/endpoints/get-dapps-list';
import { T, t } from 'lib/i18n';

import { FeaturedDappItem } from './components/DappItem';
import { DappsList } from './components/DappsList';
import { Tag } from './components/Tag';
import { useDappsData } from './hooks/use-dapps-data';
import { useFilteredDapps } from './hooks/use-filtered-dapps';

const TAGS = Object.values(DappEnum);

const TRANSITION_CLASSNAMES = 'transition-all duration-300 ease-in-out';
const HIDDEN_OFFSCREEN_CLASSNAMES = 'h-0 opacity-0 overflow-hidden pointer-events-none';

export const Dapps: FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<DappEnum[]>([]);

  const { dApps, isLoading } = useDappsData();

  const { inSearch, shouldIncludeFeatured, featuredDApps, matchingDApps } = useFilteredDapps(
    dApps,
    searchValue,
    selectedTags
  );

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

  return (
    <PageLayout pageTitle={<PageTitle title={t('dApps')} />} contentClassName="pb-8!">
      {isLoading ? (
        <PageLoader stretch />
      ) : (
        <div className="flex flex-col flex-grow">
          <div className="mb-4">
            <SearchBarField
              value={searchValue}
              placeholder="Search dapps"
              defaultRightMargin={false}
              onValueChange={setSearchValue}
            />
          </div>

          <div
            className={clsx(
              'flex flex-wrap gap-2',
              TRANSITION_CLASSNAMES,
              inSearch ? clsx('mb-0', HIDDEN_OFFSCREEN_CLASSNAMES) : 'mb-4 h-[58px] opacity-100'
            )}
            aria-hidden={inSearch}
          >
            {TAGS.map(tag => (
              <Tag key={tag} name={tag} onClick={handleTagClick} selected={selectedTags.includes(tag)} />
            ))}
          </div>

          <div
            className={clsx(
              TRANSITION_CLASSNAMES,
              shouldIncludeFeatured ? HIDDEN_OFFSCREEN_CLASSNAMES : 'h-[164px] opacity-100'
            )}
            aria-hidden={shouldIncludeFeatured}
          >
            <div className="flex justify-start items-center mb-1">
              <div className="p-1">
                <FireAnimatedEmoji />
              </div>
              <span className="text-font-description-bold py-1">
                <T id="featured" />
              </span>
            </div>

            <div className="flex gap-x-2">
              {featuredDApps.map(dAppProps => (
                <FeaturedDappItem {...dAppProps} key={dAppProps.slug} />
              ))}
            </div>

            <p className="text-font-description-bold py-1 mt-4 mb-1">
              <T id="exploreAll" />
            </p>
          </div>

          <DappsList matchingDApps={matchingDApps} />
        </div>
      )}
    </PageLayout>
  );
};
