import React, { FC, useCallback } from 'react';

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

interface DappsState {
  searchValue: string;
  selectedTags: DappEnum[];
}

export const Dapps: FC = () => {
  const { dApps, isLoading } = useDappsData();
  const [state, setState] = React.useState<DappsState>({
    searchValue: '',
    selectedTags: []
  });

  const handleSearchChange = useCallback((value: string) => {
    setState(prev => ({ ...prev, searchValue: value }));
  }, []);

  const handleTagClick = useCallback((name: DappEnum) => {
    setState(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(name)
        ? prev.selectedTags.filter(tag => tag !== name)
        : [...prev.selectedTags, name]
    }));
  }, []);

  const { inSearch, shouldIncludeFeatured, featuredDApps, matchingDApps } = useFilteredDapps(
    dApps,
    state.searchValue,
    state.selectedTags
  );

  return (
    <PageLayout pageTitle={<PageTitle title={t('dApps')} />} contentClassName="!pb-8">
      {isLoading ? (
        <PageLoader stretch />
      ) : (
        <div className="flex flex-col flex-grow">
          <div className="mb-4">
            <SearchBarField
              value={state.searchValue}
              placeholder="Search dapps"
              defaultRightMargin={false}
              onValueChange={handleSearchChange}
            />
          </div>

          <div
            className={clsx(
              'flex flex-wrap gap-2 overflow-hidden transition-all duration-300 ease-in-out',
              inSearch ? 'h-0 mb-0 opacity-0' : 'mb-4 opacity-100'
            )}
          >
            {TAGS.map(tag => (
              <Tag key={tag} name={tag} onClick={handleTagClick} selected={state.selectedTags.includes(tag)} />
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
