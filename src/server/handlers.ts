import WebSocket, { Server } from 'ws';
import uuidv4 from 'uuid/v4';
import chalk from 'chalk';

import {
  MessageType,
  RejectCode,
  RequestChangeMessage,
  RequestMessage,
  ResponseMessage,
} from '../shared/messages';
import { formatAddress, WSCloseEvent, WSMessageEvent } from './wss';
import * as http from 'http';

export default class ServerHandler<Patch> {
  private state: any = {};
  private vtag: string = uuidv4();
  private sessions = new Map<WebSocket, string>();

  constructor(
    private wss: Server,
    private applyPatches: (state: any, patches: Patch[], user: string) => any,
  ) {}

  onMessage = ({ data, type, target }: WSMessageEvent) => {
    try {
      if (typeof data !== 'string') {
        throw new Error('unexpected data type');
      }
      const session = this.sessions.get(target);
      // TODO: validate session?
      if (!session) {
        this.closeSocketWithError(target, new Error('invalid session'));
        return;
      }
      console.log(
        `${chalk.gray(`[${session}]`)} ${chalk.magenta(`--> ${data}`)}`,
      );
      this.handleMessage(target, session, JSON.parse(data) as RequestMessage<
        Patch
      >);
    } catch (e) {
      this.closeSocketWithError(target, e);
    }
  };

  onConnection = (socket: WebSocket, request: http.IncomingMessage) => {
    // TODO: multiple documents by using request.url
    const session = uuidv4();
    console.log(
      `${chalk.gray(`[${session}]`)} ${chalk.green(
        `New connection from ${formatAddress(request.socket.address())}`,
      )}`,
    );
    socket.onmessage = this.onMessage;
    socket.onclose = this.onClose;
    this.sessions.set(socket, session);
    this.sendState(socket, session);
    this.broadcast(socket, {
      type: MessageType.join,
      session,
    });
  };

  onClose = (event: WSCloseEvent) => {
    const session = this.sessions.get(event.target);
    if (!session) {
      throw new Error('unexpected connection closed');
    }
    this.sessions.delete(event.target);
    console.log(
      `${chalk.gray(`[${session}]`)} ${chalk.red('Connection lost')}`,
    );
    this.broadcast(event.target, {
      type: MessageType.leave,
      session,
    });
  };

  send(socket: WebSocket, response: ResponseMessage<Patch> | string) {
    try {
      const session = this.sessions.get(socket);
      if (!session) {
        throw new Error('Invalid socket');
      }
      const json =
        typeof response === 'string' ? response : JSON.stringify(response);
      console.log(`${chalk.gray(`[${session}]`)} ${chalk.blue(`<-- ${json}`)}`);
      socket.send(json);
    } catch (ex) {
      console.error('error sending', ex);
    }
  }

  broadcast(skipSocket: WebSocket, response: ResponseMessage<Patch>) {
    const message = JSON.stringify(response);
    this.wss.clients.forEach((client) => {
      if (client !== skipSocket) {
        this.send(client, message);
      }
    });
  }

  handleMessage(
    socket: WebSocket,
    session: string,
    request: RequestMessage<Patch>,
  ) {
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
    { req, vtag, patches }: RequestChangeMessage<Patch>,
  ) {
    if (vtag !== this.vtag) {
      this.send(socket, {
        type: MessageType.reject,
        req,
        code: RejectCode.outdated,
      });
    } else {
      try {
        try {
          this.state = this.applyPatches(this.state, patches, user);
        } catch (e) {
          this.send(socket, {
            type: MessageType.reject,
            req,
            code: RejectCode.badRequest,
            reason: e.toString(),
          });
        }
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
