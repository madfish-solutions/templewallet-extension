import { ethers } from 'ethers';
import { EventEmitter } from 'events';

const SEPOLIA_RPC_URL = 'https://ethereum-sepolia.publicnode.com';
const SEPOLIA_CHAIN_ID = '0xaa36a7';

export interface EvmRequestArguments {
  /** The RPC method to request. */
  method: string;

  /** The params of the RPC method, if any. */
  params?: unknown[] | Record<string, unknown>;
}

export class TempleWeb3Provider extends EventEmitter {
  private _BaseProvider: ethers.JsonRpcProvider;
  private _isConnected: boolean;
  private _accounts: string[];
  private _chainId: string;

  private _handleConnect(args: EvmRequestArguments) {
    window.dispatchEvent(
      new CustomEvent('passToBackground', {
        detail: { args, origin: window.origin, chainId: this._chainId }
      })
    );

    return new Promise(resolve => {
      const listener = (evt: Event) => {
        window.removeEventListener('responseFromBackground', listener);
        if (!this._isConnected) {
          this._isConnected = true;
          this.emit('connect', { chainId: this._chainId });
        }
        //@ts-ignore
        this._accounts = evt.detail;
        //@ts-ignore
        console.log('inpage got response from bg', evt.detail);
        //@ts-ignore
        resolve(evt.detail);
      };
      window.addEventListener('responseFromBackground', listener);
    });
  }

  private _handleSign(args: EvmRequestArguments) {
    window.dispatchEvent(
      new CustomEvent('passToBackground', {
        detail: { args, origin: window.origin, chainId: this._chainId, sourcePkh: this._accounts[0] }
      })
    );

    return new Promise(resolve => {
      const listener = (evt: Event) => {
        window.removeEventListener('responseFromBackground', listener);
        //@ts-ignore
        console.log('inpage got response from bg', evt.detail);
        //@ts-ignore
        resolve(evt.detail);
      };
      window.addEventListener('responseFromBackground', listener);
    });
  }

  private _handleChainChange(args: EvmRequestArguments) {
    window.dispatchEvent(
      new CustomEvent('passToBackground', {
        detail: { args, origin: window.origin }
      })
    );

    return new Promise(resolve => {
      const listener = (evt: Event) => {
        window.removeEventListener('responseFromBackground', listener);
        //@ts-ignore
        console.log('inpage got response from bg', evt.detail);
        //@ts-ignore
        this._chainId = evt.detail.chainId;
        //@ts-ignore
        this._BaseProvider = new ethers.JsonRpcProvider(evt.detail.rpcUrl);
        resolve(null);
      };
      window.addEventListener('responseFromBackground', listener);
    });
  }

  constructor() {
    super();
    this._BaseProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    this._isConnected = false;
    this._accounts = [];
    this._chainId = SEPOLIA_CHAIN_ID;

    this.request = this.request.bind(this);
  }

  async enable() {
    return this._handleConnect({ method: 'eth_requestAccounts' });
  }

  async request(args: EvmRequestArguments) {
    switch (args.method) {
      case 'eth_accounts':
        return this._accounts;
      case 'eth_requestAccounts':
        if (this._accounts.length === 0) {
          return this._handleConnect(args);
        } else {
          return this._accounts;
        }
      case 'wallet_switchEthereumChain':
        return this._handleChainChange(args);
      case 'eth_sendTransaction':
      case 'eth_signTypedData_v4':
        return this._handleSign(args);
      default:
        // @ts-ignore
        return this._BaseProvider.send(args.method, args.params);
    }
  }
}
