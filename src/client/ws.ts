import {
  AcceptMessage,
  MessageType,
  RejectMessage,
  RequestMessage,
  ResponseMessage,
} from '../shared/messages';

type Responder = {
  resolve: (message: AcceptMessage | RejectMessage) => void;
  reject: (error: Error) => void;
};
export class Connection<Patch> {
  constructor(private ws: WebSocket) {
    ws.onmessage = this.onMessage;
    ws.onclose = this.onClose;
    ws.onerror = this.onError;
  }
  public onResponseMessage?: (message: ResponseMessage<Patch>) => void;

  private promises = new Map<string, Responder>();
  private nextRequestId: number = 1;

  send(message: RequestMessage<Patch>) {
    console.log('sending message', message);
    this.ws.send(JSON.stringify(message));
  }

  requestChange(
    vtag: string,
    patch: Patch,
  ): Promise<AcceptMessage | RejectMessage> {
    const req = (this.nextRequestId++).toString(36);
    this.send({
      type: MessageType.change,
      req,
      vtag,
      patch,
    });
    return new Promise<AcceptMessage | RejectMessage>((resolve, reject) => {
      this.promises.set(req, { resolve, reject });
    });
  }

  private onMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data) as ResponseMessage<Patch>;
    console.log('got message', message);
    switch (message.type) {
      case MessageType.state:
      case MessageType.change:
      case MessageType.join:
      case MessageType.leave:
        if (this.onResponseMessage) {
          this.onResponseMessage(message);
        }
        break;

      case MessageType.accept:
      case MessageType.reject:
        const promise = this.promises.get(message.req);
        if (promise) {
          promise.resolve(message);
          this.promises.delete(message.req);
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
