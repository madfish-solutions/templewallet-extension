import { NftAddressBalanceNftResponse, NftTokenContractBalanceItem } from 'lib/apis/temple/endpoints/evm';
import { EvmAssetStandard } from 'lib/evm/types';

import { inventoryFromGoldrush, withoutProvenUnowned } from './goldrush-inventory';

const CONTRACT = '0x02f6653457df91c92a2357460181f619299db793';

const contract = (nftData: NftTokenContractBalanceItem['nft_data']): NftTokenContractBalanceItem => ({
  contract_name: 'Goldrush',
  contract_ticker_symbol: 'GR',
  contract_address: CONTRACT,
  supports_erc: [EvmAssetStandard.ERC1155],
  is_spam: false,
  last_transfered_at: new Date(0),
  balance: null,
  balance_24h: '0',
  type: 'nft',
  floor_price_quote: 0,
  pretty_floor_price_quote: '0',
  floor_price_native_quote: 0,
  nft_data: nftData
});

const response = (items: NftTokenContractBalanceItem[]): NftAddressBalanceNftResponse => ({
  address: '0x4D85A924B1b137abf7acb9B0c07355a97460637E',
  updated_at: new Date(0),
  items
});

describe('inventoryFromGoldrush', () => {
  it('keeps a token that has an id and no metadata document', () => {
    const inventory = inventoryFromGoldrush(
      response([
        contract([
          {
            token_id: '877',
            token_url: '',
            original_owner: '',
            current_owner: '',
            external_data: null,
            asset_cached: false,
            image_cached: false
          }
        ])
      ])
    );

    expect(inventory.collected.slugs).toHaveLength(1);
    expect(inventory.collected.slugs[0]?.endsWith('_877')).toBe(true);
    expect(inventory.contracts[0]).toMatchObject({ distinctTokensOwned: 1, name: 'Goldrush' });
  });
});

describe('withoutProvenUnowned', () => {
  it('removes the proven token and the contract whose count reaches zero', () => {
    const inventory = inventoryFromGoldrush(
      response([
        contract([
          {
            token_id: '1',
            token_url: '',
            original_owner: '',
            current_owner: '',
            external_data: null,
            asset_cached: false,
            image_cached: false
          },
          {
            token_id: '2',
            token_url: '',
            original_owner: '',
            current_owner: '',
            external_data: null,
            asset_cached: false,
            image_cached: false
          }
        ])
      ])
    );
    const unowned = inventory.collected.slugs[0]!;
    const trimmed = withoutProvenUnowned(inventory.collected, inventory.contracts, [unowned]);

    expect(trimmed.removed).toBe(1);
    expect(trimmed.collected.slugs).toEqual([inventory.collected.slugs[1]]);
    expect(trimmed.contracts[0]?.distinctTokensOwned).toBe(1);
    expect(trimmed.collected.records[unowned]).toBeUndefined();
  });

  it('removes every token of a contract whose balance is zero', () => {
    const inventory = inventoryFromGoldrush(
      response([
        contract([
          {
            token_id: '1',
            token_url: '',
            original_owner: '',
            current_owner: '',
            external_data: null,
            asset_cached: false,
            image_cached: false
          },
          {
            token_id: '2',
            token_url: '',
            original_owner: '',
            current_owner: '',
            external_data: null,
            asset_cached: false,
            image_cached: false
          }
        ])
      ])
    );
    const trimmed = withoutProvenUnowned(inventory.collected, inventory.contracts, [], [CONTRACT]);

    expect(trimmed.collected.loaded).toEqual([]);
    expect(trimmed.contracts).toEqual([]);
    expect(trimmed.removed).toBe(2);
    expect(trimmed.droppedContracts).toBe(1);
  });
});
