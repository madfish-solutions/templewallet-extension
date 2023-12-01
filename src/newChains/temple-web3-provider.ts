import { ethers } from 'ethers';
import { EventEmitter } from 'events';

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
  private readonly _chainId: string;

  constructor() {
    super();
    this._BaseProvider = new ethers.JsonRpcProvider('https://ethereum-sepolia.publicnode.com');
    this._isConnected = false;
    this._accounts = [];
    //sepolia
    this._chainId = '0xaa36a7';

    this.connect = this.connect.bind(this);
    this.request = this.request.bind(this);
  }

  connect() {
    if (!this._isConnected) {
      this._isConnected = true;
      this.emit('connect', { chainId: this._chainId });
    }
  }

  async request(args: EvmRequestArguments) {
    if (args.method === 'eth_requestAccounts' || args.method === 'eth_sendTransaction') {
      window.dispatchEvent(
        new CustomEvent('passToBackground', {
          detail: { args, origin: window.origin, sourcePkh: this._accounts[0] }
        })
      );

      return new Promise(resolve => {
        const listener = (evt: Event) => {
          window.removeEventListener('responseFromBackground', listener);
          if (!this._isConnected) {
            this.connect();
          }
          if (args.method === 'eth_requestAccounts') {
            //@ts-ignore
            this._accounts = evt.detail;
          }
          //@ts-ignore
          console.log('inpage got response from bg', evt.detail);
          //@ts-ignore
          resolve(evt.detail);
        };
        window.addEventListener('responseFromBackground', listener);
      });
    }

    if (args.method === 'eth_accounts') {
      return this._accounts;
    }

    // @ts-ignore
    return this._BaseProvider.send(args.method, args.params);
  }
}
