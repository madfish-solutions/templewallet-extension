export {};

// @ts-expect-error
const port = __PAGE_LIVE_RELOAD_PORT__;

const socket = new WebSocket('ws://localhost:' + port);

socket.onmessage = event => {
  if (event.data === 'RELOAD') {
    window.location.reload();
  }
};
