import WebSocket, { Server } from 'ws';
import uuidv4 from 'uuid/v4';

import { MessageType, RejectCode, RequestChangeMessage, RequestMessage, ResponseMessage } from '../shared/messages';
import { formatAddress, WSCloseEvent, WSMessageEvent } from './wss';
import * as http from 'http';

export default class ServerHandler<Patch> {
  private state: any = {};
  private vtag: string = uuidv4();
  private sessions = new Map<WebSocket, string>();

  constructor(
    private wss: Server,
    private applyPatch: (state: any, patch: Patch, user: string) => any,
  ) {}

  onMessage = ({ data, type, target }: WSMessageEvent) => {
    try {
      if (typeof data !== 'string') {
        throw new Error('unexpected data type');
      }
      this.handleMessage(target, JSON.parse(data) as RequestMessage<Patch>);
    } catch (e) {
      this.closeSocketWithError(target, e);
    }
  };

  onConnection = (socket: WebSocket, request: http.IncomingMessage) => {
    // TODO: multiple documents by using request.url
    const session = uuidv4();
    console.log(
      `[${session}] New connection from ${formatAddress(request.socket.address())}`,
    );
    socket.onmessage = this.onMessage;
    socket.onclose = this.onClose;
    this.sessions.set(socket, session);
    this.sendState(socket, session);
    this.broadcast(socket, {
      type: MessageType.join,
      session,
    })
  };

  onClose = (event: WSCloseEvent) => {
    const session = this.sessions.get(event.target);
    if (!session) {
      throw new Error('unexpected connection closed');
    }
    this.sessions.delete(event.target);
    console.log(`[${session}] Connection lost`);
    this.broadcast(event.target, {
      type: MessageType.leave,
      session,
    });
  };

  send(socket: WebSocket, response: ResponseMessage<Patch>) {
    try {
      socket.send(JSON.stringify(response));
    } catch (ex) {
      console.error('error sending', ex);
    }
  }

  broadcast(skipSocket: WebSocket, response: ResponseMessage<Patch>) {
    const message = JSON.stringify(response);
    this.wss.clients.forEach((client) => {
      if (client !== skipSocket) {
        client.send(message);
      }
    });
  }

  handleMessage(socket: WebSocket, request: RequestMessage<Patch>) {
    const session = this.sessions.get(socket);
    // TODO: validate session?
    if (!session) {
      this.closeSocketWithError(socket, new Error('invalid session'));
      return;
    }
    switch (request.type) {
      case MessageType.change:
        return this.handleRequestChange(socket, session, request);

      case MessageType.getState:
        return this.sendState(socket, session);

      default:
        throw new Error('unknown');
    }
  }

  private sendState(socket: WebSocket, session: string) {
    const { state, vtag } = this;
    this.send(socket, {
      type: MessageType.state,
      vtag,
      state,
      session,
      sessions: Array.from(this.sessions.values()),
    });
  }

  private handleRequestChange(
    socket: WebSocket,
    user: string,
    { req, vtag, patch }: RequestChangeMessage<Patch>,
  ) {
    if (vtag !== this.vtag) {
      this.send(socket, {
        type: MessageType.reject,
        req,
        code: RejectCode.outdated,
      });
    } else {
      try {
        this.state = this.applyPatch(this.state, patch, user);
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
          patch,
        });
      } catch (e) {
        if (e.code === RejectCode.permission) {
          this.send(socket, {
            type: MessageType.reject,
            req,
            code: RejectCode.permission,
          });
        } else {
          this.send(socket, {
            type: MessageType.reject,
            req,
            code: RejectCode.internal,
            reason: String(e),
          });
        }
      }
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
