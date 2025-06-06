import { EtherlinkChainId, fetchAllAccountNfts, fetchGetAccountInfo, fetchGetTokensBalances } from 'lib/apis/etherlink';
import { isErc20TokenBalance } from 'lib/apis/etherlink/types';
import { fetchTezExchangeRate } from 'lib/apis/temple';
import { BalanceItem, BalancesResponse } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { DEFAULT_NATIVE_TOKEN_ADDRESS } from 'lib/apis/temple/endpoints/evm/api.utils';
import { getEvmNativeAssetIcon } from 'lib/images-uri';
import { DEFAULT_EVM_CHAINS_SPECS } from 'lib/temple/chains-specs';
import { atomsToTokens } from 'lib/temple/helpers';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { groupByToEntries } from 'lib/utils/group-by-to-entries';

export interface EtherlinkBalancesResponse extends Omit<BalancesResponse, 'chain_id'> {
  chain_id: EtherlinkChainId;
}

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
    chainId === COMMON_MAINNET_CHAIN_IDS.etherlink ? fetchTezExchangeRate() : Promise.resolve(null),
    fetchAllAccountNfts(undefined, chainId, walletAddress)
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

  return {
    address: walletAddress,
    chain_id: chainId,
    chain_name: '',
    quote_currency: 'USD',
    updated_at: updatedAt.toISOString(),
    items: [gasTokenBalanceItem].concat(
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
      groupByToEntries(nftBalances, ({ token }) => token.address_hash).map(([, nftInstances]) => {
        const value = String(nftInstances.reduce((acc, instance) => acc + Number(instance.value), 0));
        const { token } = nftInstances[0];
        const { decimals, name, symbol, address_hash, icon_url, exchange_rate, type: tokenType } = token;
        const supportsErc = tokenType === 'ERC-721' ? ['erc721'] : ['erc1155'];

        const result: BalanceItem = {
          contract_decimals: decimals ? Number(decimals) : null,
          contract_name: name,
          contract_ticker_symbol: symbol,
          contract_address: address_hash,
          contract_display_name: symbol,
          supports_erc: supportsErc,
          logo_url: icon_url ?? '',
          logo_urls: {
            token_logo_url: icon_url ?? '',
            protocol_logo_url: '',
            chain_logo_url: gasTokenIcon
          },
          last_transferred_at: updatedAt,
          native_token: false,
          type: 'nft',
          is_spam: false,
          balance: value,
          balance_24h: null,
          quote_rate: exchange_rate ? Number(exchange_rate) : null,
          quote_rate_24h: exchange_rate ? Number(exchange_rate) : 0,
          quote: 0,
          quote_24h: 0,
          pretty_quote: '$0.00',
          pretty_quote_24h: '',
          protocol_metadata: null,
          nft_data: nftInstances.map(({ id, value, metadata, image_url, animation_url, external_app_url }) => ({
            token_id: id,
            token_balance: value,
            token_url: '',
            supports_erc: supportsErc,
            token_price_wei: null,
            token_quote_rate_eth: '',
            original_owner: walletAddress,
            external_data: {
              name: metadata?.name ?? '',
              description: metadata?.description ?? '',
              image: metadata?.image ?? image_url ?? '',
              image_256: '',
              image_512: '',
              image_1024: '',
              animation_url: animation_url ?? '',
              external_url: external_app_url ?? '',
              attributes: metadata?.attributes ?? [],
              owner: walletAddress
            },
            owner: walletAddress,
            owner_address: walletAddress,
            burned: false
          }))
        };

        return result;
      })
    )
  };
};
