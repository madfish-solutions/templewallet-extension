/*
  For the file format, see:
  https://developer.chrome.com/docs/extensions/mv3/manifest
*/

import type { Manifest } from 'webextension-polyfill';

import packageJSON from '../package.json';

import { envFilesData } from './dotenv';
import { Vendor, ALL_VENDORS, getManifestVersion } from './env';
import { IFRAMES } from './paths';

const WEB_ACCCESSIBLE_RESOURSES = [
  // For dynamic imports
  'scripts/*.chunk.js',
  // For `<script />` injection
  'scripts/*.embed.js',
  // For triggering extension page open from scripts
  'fullpage.html',
  // For ads' images
  'misc/ad-banners/*',
  // For iFrames access
  ...Object.keys(IFRAMES).map(name => `iframes/${name}.html`)
];

const isKnownVendor = (vendor: string): vendor is Vendor => ALL_VENDORS.includes(vendor as Vendor);

export const buildManifest = (vendor: string) => {
  if (!isKnownVendor(vendor)) throw new Error('Vendor is unknown');

  const manifestVersion = getManifestVersion(vendor);

  /* Remove this, if want to start building differently for the Brave */
  if (vendor === 'brave') vendor = 'chrome';

  if (manifestVersion === 3) return buildManifestV3(vendor);
  return buildManifestV2(vendor);
};

const buildManifestV3 = (vendor: string): Manifest.WebExtensionManifest => {
  const commons = buildManifestCommons(vendor);

  commons.content_scripts!.push({
    matches: [
      /* For all URLs from `HOST_PERMISSIONS` & active tabs (with `activeTab` permission) */
      '<all_urls>'
    ],
    js: ['scripts/keepBackgroundWorkerAlive.js'],
    run_at: 'document_start',
    all_frames: true,
    match_about_blank: true,
    // @ts-expect-error
    match_origin_as_fallback: true
  });

  return {
    manifest_version: 3,

    ...commons,

    web_accessible_resources: [
      {
        matches: ['https://*/*'],
        // Required for dynamic imports `import()`
        resources: WEB_ACCCESSIBLE_RESOURSES
      }
    ],

    permissions: PERMISSIONS,
    host_permissions: HOST_PERMISSIONS,

    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
    },

    action: buildBrowserAction(vendor),

    options_ui: OPTIONS_UI,

    background: {
      service_worker: 'background/index.js'
    }
  };
};

const buildManifestV2 = (vendor: string): Manifest.WebExtensionManifest => {
  const withVendors = makeWithVendors(vendor);

  return {
    manifest_version: 2,

    ...buildManifestCommons(vendor),

    permissions: [...PERMISSIONS, ...HOST_PERMISSIONS],

    /** `blob:` was added due to 3D-models not working in Firefox otherwise. See:
     * https://github.com/madfish-solutions/templewallet-extension/commit/7f170d058e9d628709f0da0759cfee44a0667480
     */
    content_security_policy: "script-src 'self' 'unsafe-eval' blob:; object-src 'self'",

    // Required for dynamic imports `import()`
    web_accessible_resources: WEB_ACCCESSIBLE_RESOURSES,

    browser_action: buildBrowserAction(vendor),

    options_ui: {
      ...OPTIONS_UI,
      ...withVendors('chrome')({ chrome_style: false })
    },

    background: {
      scripts: ['background/index.js'],
      ...withVendors('chrome', 'opera')({ persistent: true })
    }
  };
};

const AUTHOR_URL = 'https://madfish.solutions';

const PERMISSIONS = ['storage', 'unlimitedStorage', 'clipboardWrite', 'activeTab'];

const HOST_PERMISSIONS: string[] = ['http://localhost:8732/'];

const OPTIONS_UI = {
  page: 'options.html',
  open_in_tab: true
};

const buildManifestCommons = (vendor: string): Omit<Manifest.WebExtensionManifest, 'manifest_version'> => {
  const withVendors = makeWithVendors(vendor);

  return {
    version: packageJSON.version,

    // @ts-expect-error
    // Public key to fixate extension ID
    key: envFilesData._MANIFEST_KEY_,

    name: 'Temple - Tezos Wallet',
    short_name: 'Temple - Tezos Wallet',

    icons: {
      '16': 'misc/icon-16.png',
      '19': 'misc/icon-19.png',
      '38': 'misc/icon-38.png',
      '128': 'misc/icon-128.png'
    },

    description: '__MSG_appDesc__',

    default_locale: 'en',

    ...withVendors(
      'chrome',
      'firefox',
      'opera'
    )({
      homepage_url: 'https://github.com/madfish-solutions/templewallet-extension'
    }),

    ...withVendors('chrome', 'firefox')({ author: AUTHOR_URL }),
    ...withVendors('opera')({
      developer: { name: AUTHOR_URL }
    }),

    ...withVendors('firefox')({
      applications: {
        gecko: { id: '{34ac229e-1cf5-4e4c-8a77-988155c4360f}' }
      }
    }),

    ...withVendors('chrome')({ minimum_chrome_version: '103' }),
    ...withVendors('opera')({ minimum_opera_version: '36' }),

    ...withVendors('chrome', 'opera')({ options_page: 'options.html' }),

    content_scripts: [
      {
        matches: [
          'http://localhost/*',
          'http://127.0.0.1/*',
          /* For some URLs from `HOST_PERMISSIONS` & active tabs (with `activeTab` permission) */
          'https://*/*'
        ],
        js: ['scripts/contentScript.js'],
        run_at: 'document_start',
        all_frames: true
      },
      {
        matches: ['https://*/*'],
        js: ['scripts/replaceAds.js'],
        run_at: 'document_start',
        all_frames: false
      }
    ]
  };
};

const buildBrowserAction = (vendor: string) => {
  const withVendors = makeWithVendors(vendor);

  return {
    default_title: 'Temple - Tezos Wallet',
    ...withVendors('chrome', 'firefox', 'opera')({ default_popup: 'popup.html' }),
    default_icon: {
      '16': 'misc/icon-16.png',
      '19': 'misc/icon-19.png',
      '38': 'misc/icon-38.png',
      '128': 'misc/icon-128.png'
    },
    ...withVendors('chrome', 'opera')({ chrome_style: false }),
    ...withVendors('firefox')({ browser_style: false })
  };
};

const makeWithVendors = (vendor: string) => {
  return (...vendors: Vendor[]) => {
    return <T extends object>(obj: T) => (vendors.includes(vendor as Vendor) ? obj : null);
  };
};
