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
  'src/lib/ads-constants.ts',
  'src/lib/ads/index.ts',
  'src/lib/ads/persona.ts',
  'src/app/load-hypelab-script/component.ts',
  'src/app/pages/Home/OtherComponents/Tokens/components/NotificationBanner/enable-ads-banner',
  'src/lib/apis/ads-api/ads-api.ts'
].forEach(file => {
  try {
    fs.rmSync(file, { force: true, recursive: true });
  } catch {}
});
