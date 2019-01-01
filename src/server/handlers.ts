import WebSocket, { Server } from 'ws';
import uuidv4 from 'uuid/v4';
import { applyPatches } from 'immer';

import { MessageType, RequestChangeMessage, RequestMessage, ResponseMessage } from '../shared/messages';
import { formatAddress, WSCloseEvent, WSMessageEvent } from './wss';
import * as http from 'http';

export default class ServerHandler {
  private state: any = {};
  private vtag: string = uuidv4();
  private users = new Map<WebSocket, string>();

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
    const id = this.users.get(event.target);
    this.users.delete(event.target);
    console.log(`[${id}] Connection lost`);
  };

  onConnection = (socket: WebSocket, request: http.IncomingMessage) => {
    const id = uuidv4();
    console.log(`[${id}] New connection from ${formatAddress(request.socket.address())}`);
    socket.onmessage = this.onMessage;
    socket.onclose = this.onClose;
    this.users.set(socket, id);
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

  private handleRequestChange(
    socket: WebSocket,
    { req, vtag, patches }: RequestChangeMessage,
  ) {
    if (vtag !== this.vtag) {
      this.send(socket, {
        type: MessageType.reject,
        req,
      });
    } else {
      const user = this.users.get(socket);
      // TODO: validate user?
      if (!user) {
        this.closeSocketWithError(socket, new Error('invalid user'));
        return;
      }
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
        user,
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
