import React, { FC, useCallback, useState } from 'react';

import clsx from 'clsx';

import { PageTitle } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';
import { SearchBarField } from 'app/templates/SearchField';
import { DappEnum } from 'lib/apis/temple/endpoints/get-dapps-list';
import { T, t } from 'lib/i18n';
import { Lottie } from 'lib/ui/react-lottie';

import { FeaturedDappItem } from './components/DappItem';
import { DappsList } from './components/DappsList';
import { Tag } from './components/Tag';
import fireAnimation from './fire-animation.json';
import { useDappsData } from './hooks/use-dapps-data';
import { useFilteredDapps } from './hooks/use-filtered-dapps';

const TAGS = Object.values(DappEnum);

const FIRE_ANIMATION_OPTIONS = {
  loop: true,
  autoplay: true,
  animationData: fireAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
} as const;

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
    <PageLayout pageTitle={<PageTitle title={t('dApps')} />} contentClassName="!pb-8">
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
              'flex flex-wrap gap-2 overflow-hidden transition-all duration-300 ease-in-out',
              inSearch ? 'h-0 mb-0 opacity-0' : 'h-[58px] mb-4 opacity-100'
            )}
          >
            {TAGS.map(tag => (
              <Tag key={tag} name={tag} onClick={handleTagClick} selected={selectedTags.includes(tag)} />
            ))}
          </div>

          <div
            className={clsx(
              'overflow-hidden transition-all duration-300 ease-in-out',
              shouldIncludeFeatured ? 'h-0 opacity-0' : 'h-[164px] opacity-100'
            )}
          >
            <div className="flex justify-start items-center gap-x-1 mb-1">
              <Lottie
                isClickToPauseDisabled
                options={FIRE_ANIMATION_OPTIONS}
                height={16}
                width={16}
                style={{ margin: 0, cursor: 'default' }}
              />
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
