import { TokenMetadataResponse } from 'lib/apis/temple';
import { rxJsTestingHelper } from 'lib/utils/testing.utils';

import { loadTokenMetadata$ } from './utils';

const mockTezosMetadataApi = {
  get: jest.fn()
};

jest.mock('./api.service', () => ({
  tezosMetadataApi: mockTezosMetadataApi
}));

describe('loadTokenMetadata$', () => {
  const mockAddress = 'mockAddress';
  const mockId = 777;
  const mockApiResponse: TokenMetadataResponse = {
    decimals: 88,
    symbol: 'TST',
    name: 'Mocked Token',
    thumbnailUri: 'https://pepe-the-frogerenko.com'
  };

  beforeAll(() => {
    mockTezosMetadataApi.get.mockReturnValue(Promise.resolve({ data: mockApiResponse }));
  });

  it('should return correct TokenMetadataInterface structure', done =>
    void loadTokenMetadata$(mockAddress, mockId).subscribe(
      rxJsTestingHelper(tokenMetadata => {
        expect(tokenMetadata.id).toEqual(mockId);
        expect(tokenMetadata.address).toEqual(mockAddress);
        expect(tokenMetadata.decimals).toEqual(mockApiResponse.decimals);
        expect(tokenMetadata.symbol).toEqual(mockApiResponse.symbol);
        expect(tokenMetadata.name).toEqual(mockApiResponse.name);
        expect(tokenMetadata.thumbnailUri).toEqual(mockApiResponse.thumbnailUri);
      }, done)
    ));

  it('should set default id if it was not provided', done =>
    void loadTokenMetadata$(mockAddress).subscribe(
      rxJsTestingHelper(tokenMetadata => {
        expect(tokenMetadata.id).toEqual(0);
      }, done)
    ));

  it('should set symbol from name first 8 symbols if token has no symbol', done => {
    const mockApiResponseWithoutSymbol = {
      ...mockApiResponse,
      symbol: undefined
    };

    mockTezosMetadataApi.get.mockReturnValue(Promise.resolve({ data: mockApiResponseWithoutSymbol }));

    loadTokenMetadata$(mockAddress).subscribe(
      rxJsTestingHelper(tokenMetadata => {
        expect(tokenMetadata.symbol).toEqual('Mocked T');
      }, done)
    );
  });

  it('should set name from symbol if token has no name', done => {
    const mockApiResponseWithoutName = {
      ...mockApiResponse,
      name: undefined
    };

    mockTezosMetadataApi.get.mockReturnValue(Promise.resolve({ data: mockApiResponseWithoutName }));

    loadTokenMetadata$(mockAddress).subscribe(
      rxJsTestingHelper(tokenMetadata => {
        expect(tokenMetadata.name).toEqual(mockApiResponseWithoutName.symbol);
      }, done)
    );
  });

  it('should set default name and symbol if token has not them', done => {
    const mockApiResponseWithoutSymbolAndName = {
      ...mockApiResponse,
      symbol: undefined,
      name: undefined
    };

    mockTezosMetadataApi.get.mockReturnValue(Promise.resolve({ data: mockApiResponseWithoutSymbolAndName }));

    loadTokenMetadata$(mockAddress).subscribe(
      rxJsTestingHelper(tokenMetadata => {
        expect(tokenMetadata.symbol).toEqual('???');
        expect(tokenMetadata.name).toEqual('Unknown Token');
      }, done)
    );
  });
});
