import WebSocket, { Server } from 'ws';
import uuidv4 from 'uuid/v4';
import { applyPatches } from 'immer';

import {
  MessageType,
  RequestChangeMessage,
  RequestMessage,
  ResponseMessage,
} from '../shared/messages';
import { initialModelState, ModelState } from '../shared/model';
import { formatAddress, WSCloseEvent, WSMessageEvent } from './wss';
import * as http from 'http';

export default class ServerHandler {
  private state: ModelState = initialModelState;
  private vtag: string = uuidv4();

  constructor(private wss: Server) {}

  onMessage = ({ data, type, target }: WSMessageEvent) => {
    try {
      if (typeof data !== 'string') {
        throw new Error('unexpected data type');
      }
      this.handleMessage(target, JSON.parse(data) as RequestMessage);
    } catch (e) {
      this.closeSocketWithError(target, e);
    }
  };

  onClose = (event: WSCloseEvent) => {
    console.log(`Lost connection from ${event.target}`);
  };

  onConnection = (socket: WebSocket, request: http.IncomingMessage) => {
    const address = formatAddress(request.socket.address());
    console.log(`Got connection from ${address}`);
    socket.onmessage = this.onMessage;
    socket.onclose = this.onClose;
    this.sendState(socket);
  };

  send(socket: WebSocket, response: ResponseMessage) {
    socket.send(JSON.stringify(response));
  }

  broadcast(skipSocket: WebSocket, response: ResponseMessage) {
    const message = JSON.stringify(response);
    this.wss.clients.forEach((client) => {
      if (client !== skipSocket) {
        client.send(message);
      }
    });
  }

  handleMessage(socket: WebSocket, request: RequestMessage) {
    switch (request.type) {
      case MessageType.change:
        return this.handleRequestChange(socket, request);

      case MessageType.getState:
        return this.sendState(socket);

      default:
        throw new Error('unknown');
    }
  }

  private sendState(socket: WebSocket) {
    const { state, vtag } = this;
    this.send(socket, {
      type: MessageType.state,
      vtag,
      state,
    });
  }

  private handleRequestChange(socket: WebSocket, { req, vtag, patches }: RequestChangeMessage) {
    if (vtag !== this.vtag) {
      this.send(socket, {
        type: MessageType.reject,
        req,
      });
    } else {
      this.state = applyPatches(this.state, patches);
      this.vtag = uuidv4();
      this.send(socket, {
        type: MessageType.accept,
        req,
        vtag: this.vtag,
      });
      this.broadcast(socket, {
        type: MessageType.change,
        vtag: this.vtag,
        patches,
      });
    }
  }

  closeSocketWithError(target: WebSocket, error: Error) {
    console.error(`Error handling connection: ${String(error)}`);
    this.send(target, {
      type: MessageType.error,
      message: String(error),
    });
    target.close();
  }
}
