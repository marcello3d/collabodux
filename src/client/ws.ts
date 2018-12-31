import {
  AcceptMessage,
  ChangeMessage,
  MessageType,
  RejectMessage,
  RequestMessage,
  ResponseMessage, StateMessage,
} from '../shared/messages';
import { Patch } from 'immer';
import uuidv4 from 'uuid/v4';


type Responder = {
  resolve: (message: AcceptMessage | RejectMessage) => void;
  reject: (error: Error) => void;
}
export class Connection {
  constructor(private ws: WebSocket) {
    ws.onmessage = this.onMessage;
    ws.onclose = this.onClose;
    ws.onerror = this.onError;
  }
  public onStateMessage?: (message: StateMessage) => void;
  public onChangeMessage?: (message: ChangeMessage) => void;

  private promises = new Map<string, Responder>();
  private nextRequestId: number = 1;

  send(message: RequestMessage) {
    console.log('sending message', message);
    this.ws.send(JSON.stringify(message));
  }

  requestChange(vtag: string, patches: Patch[]): Promise<AcceptMessage | RejectMessage> {
    const req = (this.nextRequestId++).toString(36);
    this.send({
      type: MessageType.change,
      req,
      vtag,
      patches,
    });
    return new Promise<AcceptMessage | RejectMessage>((resolve, reject) => {
      this.promises.set(req, { resolve, reject });
    });
  }

  private onMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as ResponseMessage;
    console.log('got message', message);
    switch (message.type) {
      case MessageType.state:
        if (this.onStateMessage) {
          this.onStateMessage(message);
        }
        break;
      case MessageType.change:
        if (this.onChangeMessage) {
          this.onChangeMessage(message);
        }
        break;

      case MessageType.accept:
      case MessageType.reject:
        const promise = this.promises.get(message.req);
        if (promise) {
          promise.resolve(message);
          this.promises.delete(message.req)
        }
        break;
    }
  };

  private onClose = (event: CloseEvent) => {
    const e = new Error(`connection closed (${event.code}: ${event.reason})`);
    this.promises.forEach((promise) => promise.reject(e));
    this.promises.clear();
  };

  private onError = (event: Event) => {
    const e = new Error('connection error');
    this.promises.forEach((promise) => promise.reject(e));
    this.promises.clear();
  };
}
