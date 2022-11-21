import packageJSON from '../package.json';

/** From lodash */
type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T;

export const isTruthy = <T>(value: T): value is Truthy<T> => Boolean(value);

type Manifest = Record<string, any>;

export const buildManifest = (manifestDraft: Manifest, vendor: string): Manifest => {
  const manifest = transformManifestKeys(manifestDraft, vendor);
  delete manifest.version;

  return {
    version: packageJSON.version,
    ...manifest
  };
};

/**
 *  Fork of `wext-manifest`
 */
const browserVendors = ['chrome', 'firefox', 'opera', 'edge', 'safari'];
const vendorRegExp = new RegExp(`^__((?:(?:${browserVendors.join('|')})\\|?)+)__(.*)`);

const transformManifestKeys = (manifest: Manifest, vendor: string): Manifest => {
  if (Array.isArray(manifest)) {
    return manifest.map(newManifest => {
      return transformManifestKeys(newManifest, vendor);
    });
  }

  if (typeof manifest === 'object') {
    const newManifest: Manifest = {};
    return Object.entries(manifest).reduce((newManifest, [key, value]) => {
      const match = key.match(vendorRegExp);

      if (match) {
        const vendors = match[1].split('|');

        // Swap key with non prefixed name
        if (vendors.indexOf(vendor) > -1) {
          newManifest[match[2]] = value;
        }
      } else {
        newManifest[key] = transformManifestKeys(value, vendor);
      }

      return newManifest;
    }, newManifest);
  }

  return manifest;
};
