import { Server } from 'ws';
import { formatAddress } from './wss';
import ServerHandler from './handlers';

const wss = new Server({
  port: 4000,
});

const handler = new ServerHandler(wss);

wss
  .on('listening', () => {
    console.log(`Listening on ${formatAddress(wss.address())}…`);
  })
  .on('connection', handler.onConnection);
