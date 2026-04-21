import { connectToDevTools, initialize } from 'react-devtools-core/backend';

const REACT_DEVTOOLS_PORT = Number(process.env.REACT_DEVTOOLS_PORT);

initialize();
connectToDevTools({
  host: 'localhost',
  port: REACT_DEVTOOLS_PORT ?? 8097
});
