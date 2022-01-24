const { browser } = jest.createMockFromModule('webextension-polyfill-ts');

let MOCK_STORAGE_OBJECT: any = {};

export const mockBrowserStorageLocal = {
  get: jest.fn((key: any) => {
    console.log('get mock store', MOCK_STORAGE_OBJECT, MOCK_STORAGE_OBJECT[key]);
    return MOCK_STORAGE_OBJECT[key];
  }),
  set: jest.fn(x => {
    console.log('before assign', MOCK_STORAGE_OBJECT);
    MOCK_STORAGE_OBJECT = {
      ...MOCK_STORAGE_OBJECT,
      ...Object.keys(x).reduce((newObj: any, key: keyof typeof x) => {
        newObj[key] = x[key];
        return newObj;
      }, {})
    };
    console.log('after assign', MOCK_STORAGE_OBJECT);
  }),
  remove: jest.fn(key => delete MOCK_STORAGE_OBJECT[key])
};

// browser.storage.local = mockBrowserStorageLocal;

// jest.mock('./beacon', () => mockBrowserStorageLocal);

// jest.mock('webextension-polyfill-ts', () => ({
//   browser: jest.fn(() => ({
//     storage: jest.fn(() => ({
//       local: jest.fn(() => mockBrowserStorageLocal)
//     }))
//   }))
// }));

// browser.storage.local = mockBrowserStorageLocal;
// browser.storage.local.set = jest.fn(() => console.log('data'));
