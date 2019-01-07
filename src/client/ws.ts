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
    const json = JSON.stringify(message);
    console.log('client --> ' + json);
    this.ws.send(json);
  }

  requestChange(
    vtag: string,
    patches: Patch[],
  ): Promise<AcceptMessage | RejectMessage> {
    this.nextRequestId += 1;
    const req = this.nextRequestId.toString(36);
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
    const message = JSON.parse(event.data) as ResponseMessage<Patch>;
    console.log('client <-- ' + event.data);
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
          this.promises.delete(message.req);
          promise.resolve(message);
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
