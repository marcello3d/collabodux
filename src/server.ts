import { Server } from 'ws';
import { formatAddress } from './server/wss';
import ServerHandler from './server/handlers';
import { applyPatches, Patch } from 'immer';

const wss = new Server({
  port: 4000,
});

const handler = new ServerHandler(wss, (state: any, patches: Patch[]) =>
  applyPatches(state, patches),
);

wss
  .on('listening', () => {
    console.log(`Listening on ${formatAddress(wss.address())}…`);
  })
  .on('connection', handler.onConnection);
