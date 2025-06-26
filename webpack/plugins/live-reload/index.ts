// import fs from 'fs';
import path from 'path';
import type { Compiler } from 'webpack';
import WebPack from 'webpack';
import WebSocket, { Server as WebSocketServer } from 'ws';

/**
 * (i) Reloads all pages (entries) at once.
 */
const usePagesLiveReload = (port: number) => ({
  plugins: [
    new WebPack.DefinePlugin({
      __PAGE_LIVE_RELOAD_PORT__: String(port)
    }),
    new ServerPlugin(port)
  ],
  client_entry: path.resolve(__dirname, 'client')
});

export default usePagesLiveReload;

class ServerPlugin {
  private reloadDelay: number;
  private clients: { id: number; ws: WebSocket }[] = [];

  /**
   * @param delay // ms // Emit the RELOAD events `reloadDelay` ms after the webpack `done` hook
   */
  constructor(port: number, reloadDelay = 100) {
    this.reloadDelay = reloadDelay;

    const server = new WebSocketServer({ port });
    server.on('connection', ws => {
      const wsId = Date.now();
      this.clients.push({ id: wsId, ws });
      ws.onclose = () => {
        const index = this.clients.findIndex(({ id }) => id === wsId);
        if (index > -1) this.clients.splice(index, 1);
      };
    });
  }

  apply(compiler: Compiler) {
    compiler.hooks.done.tap(
      'PageLiveReload',
      (_stats /* stats is passed as an argument when done hook is tapped */) => {
        setTimeout(() => {
          this.broadcast();
        }, this.reloadDelay);
      }
    );
  }

  private broadcast() {
    for (const { ws } of this.clients) {
      ws.send('RELOAD');
    }
  }
}
