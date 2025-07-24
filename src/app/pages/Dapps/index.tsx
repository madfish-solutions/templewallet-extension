import React, { useCallback, useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import { PageTitle } from 'app/atoms';
import { PageLoader } from 'app/atoms/Loader';
import PageLayout from 'app/layouts/PageLayout';
import { PartnersPromotion, PartnersPromotionVariant } from 'app/templates/partners-promotion';
import { SearchBarField } from 'app/templates/SearchField';
import { getDAppsList, DappEnum } from 'lib/apis/temple/endpoints/get-dapps-list';
import { DAPPS_LIST_SYNC_INTERVAL } from 'lib/fixed-times';
import { T, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { Lottie } from 'lib/ui/react-lottie';
import { isSearchStringApplicable } from 'lib/utils/search-items';

import { DappItem, FeaturedDappItem } from './components/DappItem';
import { Tag } from './components/Tag';
import { DAPPS_PAGE_NAME } from './constants';
import fireAnimation from './fire-animation.json';

const USED_TAGS = Object.values(DappEnum);
const TOP_DAPPS_SLUGS = ['quipuswap', 'objkt.com', 'youves'];

const fireAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: fireAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

export const Dapps = () => {
  const { data, isLoading } = useRetryableSWR('dapps-list', getDAppsList, {
    revalidateOnFocus: false,
    refreshInterval: DAPPS_LIST_SYNC_INTERVAL
  });

  const dApps = useMemo(() => {
    if (!data || isLoading) return [];

    return data.dApps.map(({ categories: rawCategories, ...restProps }) => {
      const categories = rawCategories.filter(name => name !== DappEnum.Other);
      if (categories.length !== rawCategories.length) {
        categories.push(DappEnum.Other);
      }
      return {
        categories,
        ...restProps
      };
    });
  }, [data, isLoading]);

  const [searchValue, setSearchValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<DappEnum[]>([]);

  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);
  console.log(inSearch);

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
        name.toLowerCase().includes(searchValueDebounced.toLowerCase()) &&
        selectedTags.every(selectedTag => categories.includes(selectedTag))
    );
  }, [dApps, searchValueDebounced, selectedTags]);

  const allDappsView = useMemo(() => {
    const dappsJsx = matchingDApps.map(dAppProps => <DappItem {...dAppProps} key={dAppProps.slug} />);

    const promoJsx = (
      <PartnersPromotion
        id="promo-dapp-item"
        key="promo-dapp-item"
        variant={PartnersPromotionVariant.Text}
        pageName={DAPPS_PAGE_NAME}
      />
    );

    if (matchingDApps.length < 5) {
      dappsJsx.push(promoJsx);
    } else {
      dappsJsx.splice(1, 0, promoJsx);
    }

    return dappsJsx;
  }, [matchingDApps]);

  return (
    <PageLayout pageTitle={<PageTitle title={t('dApps')} />} contentClassName="!pb-4">
      {isLoading ? (
        <PageLoader stretch />
      ) : (
        <div className="flex flex-col">
          <SearchBarField
            value={searchValue}
            placeholder="Search dapps"
            defaultRightMargin={false}
            onValueChange={setSearchValue}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {USED_TAGS.map(tag => (
              <Tag key={tag} name={tag} onClick={handleTagClick} selected={selectedTags.includes(tag)} />
            ))}
          </div>

          <div className="flex justify-start items-center gap-x-1 mt-4 mb-1">
            <Lottie
              isClickToPauseDisabled
              options={fireAnimationOptions}
              height={16}
              width={16}
              style={{ margin: 0, cursor: 'default' }}
            />
            <span className="text-font-description-bold py-1">
              <T id="featured" />
            </span>
          </div>

          <div className="flex gap-x-2">
            {featuredDApps.slice(0, 3).map(dAppProps => (
              <FeaturedDappItem {...dAppProps} key={dAppProps.slug} />
            ))}
          </div>

          <p className="text-font-description-bold py-1 mt-4 mb-1">
            <T id="exploreAll" />
          </p>

          <div className="flex flex-col gap-y-3">{allDappsView}</div>
        </div>
      )}
    </PageLayout>
  );
};
