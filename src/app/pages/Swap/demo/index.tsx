import {
  createConfig,
  getRoutes,
  RoutesRequest,
  executeRoute,
  RouteExtended,
  getConnections,
  getChains,
  ChainType,
  getTools,
  getTokens,
  getToken,
  getTokenBalance,
  getTokenBalances,
  ChainId,
  EVM,
  getQuote,
  QuoteRequest,
  convertQuoteToRoute
} from '@lifi/sdk';
import { createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  arbitrum,
  mainnet,
  optimism,
  polygon,
  scroll,
  avalanche,
  goerli,
  fantom,
  cronos,
  moonbeam,
  fuse,
  metis,
  polygonZkEvm,
  bsc
} from 'viem/chains';

const walletAddress = 'ADDRESS';
const fromTokenAddress = '0x0000000000000000000000000000000000000000';
const toTokenAddress = '0x0000000000000000000000000000000000000000';

export const routesRequest: RoutesRequest = {
  fromChainId: ChainId.AVA,
  toChainId: ChainId.ETH,
  fromTokenAddress: fromTokenAddress,
  toTokenAddress: toTokenAddress,
  fromAmount: parseUnits('0.1', 18).toString(),
  fromAddress: walletAddress
};

export const quoteRequest: QuoteRequest = {
  fromChain: ChainId.AVA,
  toChain: ChainId.ETH,
  fromToken: fromTokenAddress,
  toToken: toTokenAddress,
  fromAmount: parseUnits('0.1', 18).toString(),
  fromAddress: walletAddress
};

const ViemChains = [
  arbitrum,
  mainnet,
  optimism,
  polygon,
  scroll,
  avalanche,
  goerli,
  fantom,
  cronos,
  moonbeam,
  fuse,
  metis,
  polygonZkEvm,
  bsc
];

class LiFiWrapper {
  private readonly integrator: string;
  private readonly apiKey: string;

  constructor(integrator: string, apiKey: string) {
    this.integrator = integrator;
    this.apiKey = apiKey;

    const account = privateKeyToAccount('PRIVATE KEY');

    const client = createWalletClient({
      account,
      chain: mainnet,
      transport: http()
    });

    createConfig({
      integrator: this.integrator,
      apiKey: this.apiKey,
      routeOptions: {
        fee: 0.0035, // 0.35% + 0.25% lifi = 0.6%
        maxPriceImpact: 0.03, // 3%
        order: 'CHEAPEST',
        slippage: 0.005, // 0.05%
        allowSwitchChain: true,
        allowDestinationCall: true
      },
      providers: [
        EVM({
          // @ts-expect-error
          getWalletClient: async () => client,
          // @ts-expect-error
          switchChain: async chainId =>
            createWalletClient({
              account,
              chain: ViemChains.find(chain => chain.id == chainId),
              transport: http()
            })
        })
      ]
    });
  }

  // ----------- Token, Chain, Tool Management -----------

  async getChains() {
    try {
      return await getChains({ chainTypes: [ChainType.EVM] });
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getTools() {
    try {
      return await getTools();
    } catch (error) {
      console.error(error);
      return {};
    }
  }

  async getConnections() {
    try {
      return await getConnections({
        fromChain: ChainId.ETH,
        fromToken: '0x0000000000000000000000000000000000000000',
        toChain: ChainId.AVA,
        toToken: '0x0000000000000000000000000000000000000000'
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getTokens() {
    try {
      return await getTokens({ chainTypes: [ChainType.EVM] });
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getTokenBalance(walletAddress: string, chainId: number, tokenAddress: string) {
    try {
      const token = await getToken(chainId, tokenAddress);
      return await getTokenBalance(walletAddress, token);
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  async getTokenBalances(walletAddress: string) {
    try {
      const tokensResponse = await getTokens({ chainTypes: [ChainType.EVM] });
      const avaTokens = tokensResponse.tokens[ChainId.AVA];
      return await getTokenBalances(walletAddress, avaTokens);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // ----------- Route & Quote Management -----------

  async getRoutes(routesRequest: RoutesRequest) {
    try {
      const result = await getRoutes(routesRequest);
      return result.routes;
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getQuoteOnly(quoteRequest: QuoteRequest) {
    try {
      const quote = await getQuote(quoteRequest);
      return quote;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  // ----------- Execution & Monitoring -----------

  async executeRouteFlow(route: RouteExtended) {
    console.log('started execution');

    const getTransactionLinks = (route: RouteExtended) => {
      route.steps.forEach((step, index) => {
        step.execution?.process.forEach(process => {
          if (process.txHash) {
            console.log(`Transaction Hash for Step ${index + 1}`, process);
          }
        });
      });
      // const stoppedRoute = stopRouteExecution(route);
      // console.log(stoppedRoute);
    };

    try {
      const executedRoute = await executeRoute(route, {
        updateRouteHook(updatedRoute) {
          getTransactionLinks(updatedRoute);
        },
        async acceptExchangeRateUpdateHook({ toToken, oldToAmount, newToAmount }) {
          console.log(
            'rate changes, continue transaction',
            'toToken:',
            toToken,
            'oldToAmount:',
            oldToAmount,
            'newToAmount:',
            newToAmount
          );
          return true;
        }
      });

      return executedRoute;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async convertQuoteToExecutableRoute(quote: any) {
    try {
      return convertQuoteToRoute(quote);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async executeQuoteFlow(quoteRequest: QuoteRequest) {
    const quote = await this.getQuoteOnly(quoteRequest);
    console.log('Quote to execute', quote);
    if (!quote) return null;

    const route = await this.convertQuoteToExecutableRoute(quote);
    if (!route) return null;

    return this.executeRouteFlow(route);
  }
}

// Usage
export const lifi = new LiFiWrapper('integration string', 'api key');
