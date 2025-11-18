import {
  EtherlinkAddressNftInstance,
  EtherlinkChainId,
  fetchAllAccountNfts,
  fetchGetAccountInfo,
  fetchGetTokensBalances,
  isErc20TokenBalance
} from 'lib/apis/etherlink';
import { fetchTezExchangeRate } from 'lib/apis/temple';
import {
  BalanceItem,
  BalancesResponse,
  NftTokenContractBalanceItem
} from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from 'lib/apis/temple/endpoints/evm/api.utils';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { DEFAULT_EVM_CHAINS_SPECS } from 'lib/temple/chains-specs';
import { atomsToTokens } from 'lib/temple/helpers';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';

export interface EtherlinkBalancesResponse
  extends Omit<BalancesResponse, 'chain_id' | 'items' | 'chain_tip_signed_at'> {
  chain_id: EtherlinkChainId;
  balanceItems: BalanceItem[];
  nftItems: NftTokenContractBalanceItem[];
}

const makeCommonExternalData = ({
  metadata,
  image_url,
  animation_url,
  external_app_url
}: EtherlinkAddressNftInstance) => ({
  name: metadata?.name ?? '',
  description: metadata?.description ?? '',
  image: metadata?.image ?? image_url ?? '',
  image_256: '',
  image_512: '',
  image_1024: '',
  animation_url: animation_url ?? '',
  external_url: external_app_url ?? '',
  attributes: metadata?.attributes ?? []
});

/** Contains tokens metadata and exchange rates too */
export const getEtherlinkBalances = async (
  walletAddress: string,
  chainId: EtherlinkChainId
): Promise<EtherlinkBalancesResponse> => {
  const updatedAt = new Date();
  const {
    decimals: gasTokenDecimals,
    name: gasTokenName,
    symbol: gasTokenSymbol
  } = DEFAULT_EVM_CHAINS_SPECS[chainId].currency!;
  const gasTokenIcon = getEvmNativeAssetIcon(chainId, undefined, 'llamao') ?? '';
  const [accountInfo, tokensBalancesWithIncompleteNFT, gasTokenExchangeRate, nftBalances] = await Promise.all([
    fetchGetAccountInfo(chainId, walletAddress),
    fetchGetTokensBalances(chainId, walletAddress),
    chainId === ETHERLINK_MAINNET_CHAIN_ID ? fetchTezExchangeRate() : Promise.resolve(null),
    fetchAllAccountNfts({ chainId, address: walletAddress })
  ]);
  const tokensBalances = tokensBalancesWithIncompleteNFT.filter(isErc20TokenBalance);
  const gasTokenQuote = atomsToTokens(accountInfo.coin_balance ?? '0', gasTokenDecimals).decimalPlaces(2);
  const gasTokenBalanceItem: BalanceItem = {
    contract_decimals: gasTokenDecimals,
    contract_name: gasTokenName,
    contract_ticker_symbol: gasTokenSymbol,
    contract_address: DEFAULT_NATIVE_TOKEN_ADDRESS,
    contract_display_name: gasTokenName,
    supports_erc: [],
    logo_url: gasTokenIcon,
    logo_urls: {
      token_logo_url: gasTokenIcon,
      /** * The protocol logo URL. */
      protocol_logo_url: '',
      /** * The chain logo URL. */
      chain_logo_url: gasTokenIcon
    },
    last_transferred_at: updatedAt,
    native_token: true,
    type: 'cryptocurrency',
    is_spam: false,
    balance: accountInfo.coin_balance,
    balance_24h: null,
    quote_rate: gasTokenExchangeRate,
    quote_rate_24h: gasTokenExchangeRate ?? 0,
    /** * The current balance converted to fiat in `quote-currency`. */
    quote: gasTokenQuote.toNumber(),
    /** * The 24h balance converted to fiat in `quote-currency`. */
    quote_24h: gasTokenQuote.toNumber(),
    /** * A prettier version of the quote for rendering purposes. */
    pretty_quote: `$${gasTokenQuote.toFixed()}`,
    /** * A prettier version of the 24h quote for rendering purposes. */
    pretty_quote_24h: '',
    protocol_metadata: null,
    nft_data: null
  };
  const groupedNftBalances = groupByToEntries(nftBalances, ({ token }) => token.address_hash).map(([, value]) => value);
  const commonNftItemsProps = groupedNftBalances.map(nftInstances => {
    const balance = String(nftInstances.reduce((acc, instance) => acc + Number(instance.value), 0));
    const { token } = nftInstances[0];
    const { name, symbol, address_hash, type: tokenType } = token;
    const supportsErc = tokenType === 'ERC-721' ? ['erc721'] : ['erc1155'];

    return {
      type: 'nft',
      contract_name: name,
      contract_ticker_symbol: symbol,
      contract_address: address_hash,
      supports_erc: supportsErc,
      is_spam: false,
      balance,
      balance_24h: balance,
      nft_data: nftInstances.map(({ id }) => ({
        token_id: id,
        token_url: '',
        original_owner: walletAddress
      }))
    };
  });

  return {
    address: walletAddress,
    chain_id: chainId,
    chain_name: '',
    quote_currency: 'USD',
    updated_at: updatedAt.toISOString(),
    balanceItems: [gasTokenBalanceItem].concat(
      tokensBalances.map(({ token, value }) => {
        const { decimals, name, symbol, address_hash, icon_url, exchange_rate } = token;
        const logoUrl = icon_url ?? '';
        const quote = atomsToTokens(value ?? '0', Number(decimals ?? 0)).decimalPlaces(2);

        return {
          contract_decimals: decimals ? Number(decimals) : null,
          contract_name: name,
          contract_ticker_symbol: symbol,
          contract_address: address_hash,
          contract_display_name: symbol,
          supports_erc: ['erc20'],
          logo_url: logoUrl,
          logo_urls: {
            token_logo_url: logoUrl,
            protocol_logo_url: '',
            chain_logo_url: gasTokenIcon
          },
          last_transferred_at: updatedAt,
          native_token: false,
          type: 'cryptocurrency',
          is_spam: false,
          balance: value,
          balance_24h: null,
          quote_rate: exchange_rate ? Number(exchange_rate) : null,
          quote_rate_24h: exchange_rate ? Number(exchange_rate) : 0,
          quote: quote.toNumber(),
          quote_24h: quote.toNumber(),
          pretty_quote: `$${quote.toFixed()}`,
          pretty_quote_24h: '',
          protocol_metadata: null,
          nft_data: null
        };
      }),
      groupedNftBalances.map((nftInstances, i) => {
        const { token } = nftInstances[0];
        const { decimals, symbol, icon_url, exchange_rate, type: tokenType } = token;
        const supportsErc = tokenType === 'ERC-721' ? ['erc721'] : ['erc1155'];

        return {
          ...commonNftItemsProps[i],
          contract_decimals: decimals ? Number(decimals) : null,
          contract_display_name: symbol,
          logo_url: icon_url ?? '',
          logo_urls: {
            token_logo_url: icon_url ?? '',
            protocol_logo_url: '',
            chain_logo_url: gasTokenIcon
          },
          last_transferred_at: updatedAt,
          native_token: false,
          quote_rate: exchange_rate ? Number(exchange_rate) : null,
          quote_rate_24h: exchange_rate ? Number(exchange_rate) : 0,
          quote: 0,
          quote_24h: 0,
          pretty_quote: '$0.00',
          pretty_quote_24h: '',
          protocol_metadata: null,
          nft_data: nftInstances.map((instance, j) => ({
            ...commonNftItemsProps[i].nft_data[j],
            token_balance: instance.value,
            supports_erc: supportsErc,
            token_price_wei: null,
            token_quote_rate_eth: '',
            external_data: {
              ...makeCommonExternalData(instance),
              owner: walletAddress
            },
            owner: walletAddress,
            owner_address: walletAddress,
            burned: false
          }))
        };
      })
    ),
    nftItems: groupedNftBalances.map((nftInstances, i) => ({
      ...commonNftItemsProps[i],
      last_transfered_at: updatedAt,
      floor_price_quote: 0,
      pretty_floor_price_quote: '',
      floor_price_native_quote: 0,
      contract_name: commonNftItemsProps[i].contract_name ?? '',
      contract_ticker_symbol: commonNftItemsProps[i].contract_ticker_symbol ?? '',
      nft_data: nftInstances.map((instance, j) => ({
        ...commonNftItemsProps[i].nft_data[j],
        current_owner: walletAddress,
        external_data: {
          ...makeCommonExternalData(instance),
          asset_url: '',
          asset_file_extension: '',
          asset_mime_type: instance.media_type ?? 'application/octet-stream',
          asset_size_bytes: ''
        },
        asset_cached: false,
        image_cached: false
      }))
    }))
  };
};
