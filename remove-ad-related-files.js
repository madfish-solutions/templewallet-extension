const fs = require('node:fs');

[
  'src/hypelab.embed.js',
  'src/replaceAds.ts',
  'src/replaceReferrals.ts',
  'src/content-scripts/replace-ads',
  'src/content-scripts/utils.ts',
  'src/lib/ads/configure-ads.ts',
  'src/lib/ads/evm-chains-names.json',
  'src/lib/ads/update-rules-storage.ts',
  'src/app/templates/partners-promotion/components',
  'src/app/templates/partners-promotion/partners-promotion.tsx',
  'src/app/templates/partners-promotion/selectors.ts',
  'src/app/templates/partners-promotion/types.ts',
  'src/app/templates/partners-promotion/utils.ts',
  'src/app/hooks/ads',
  'src/lib/ads-constants/ads-constants.ts',
  'src/lib/ads/index.ts',
  'src/lib/ads/persona.ts',
  'src/app/load-hypelab-script/component.ts',
  'src/app/pages/Home/notification-banner/enable-ads-banner/component.tsx',
  'src/app/pages/Home/notification-banner/enable-ads-banner/rewards-animation.json',
  'src/app/pages/Home/notification-banner/enable-ads-banner/rewards-cover-card.tsx',
  'src/app/pages/Home/notification-banner/enable-ads-banner/rewards-modal.tsx',
  'src/lib/apis/ads-api/ads-api.ts',
  'src/content-scripts/web-widgets.ts',
  'src/lib/web-widgets',
  'src/lib/temple/back/web-widgets'
].forEach(file => {
  try {
    fs.rmSync(file, { force: true, recursive: true });
  } catch (e) {
    console.error(e);
  }
});
