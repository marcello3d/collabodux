import WebSocket, { AddressInfo, Data } from 'ws';

export type WSMessageEvent = {
  data: Data;
  type: string;
  target: WebSocket;
};

export type WSCloseEvent = {
  wasClean: boolean;
  code: number;
  reason: string;
  target: WebSocket;
};

export function formatAddress(address: AddressInfo | string): string {
  if (typeof address === 'string') {
    return address;
  }
  return `[${address.address}:${address.port}]`;
}
