import { connectToDevTools, initialize } from 'react-devtools-core/backend';

initialize();
connectToDevTools({
  host: 'localhost',
  port: 8097
});
