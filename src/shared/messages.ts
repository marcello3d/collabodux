export enum MessageType {
  error = 'error',
  state = 'state',
  reject = 'reject',
  accept = 'accept',
  change = 'change',
  getState = 'getState',
}

export type RequestMessage<Patch> = RequestChangeMessage<Patch> | GetStateMessage;

export type ResponseMessage<Patch> =
  | ErrorMessage
  | StateMessage
  | RejectMessage
  | AcceptMessage
  | ChangeMessage<Patch>;

export type RequestChangeMessage<Patch> = {
  type: MessageType.change;
  req: string;
  vtag: string;
  patch: Patch;
};
export type GetStateMessage = {
  type: MessageType.getState;
};

export type ErrorMessage = {
  type: MessageType.error;
  message: string;
};

export type StateMessage = {
  type: MessageType.state;
  vtag: string;
  state: any;
};

export type RejectMessage = {
  type: MessageType.reject;
  req: string;
};

export type AcceptMessage = {
  type: MessageType.accept;
  req: string;
  vtag: string;
};

export type ChangeMessage<Patch> = {
  type: MessageType.change;
  vtag: string;
  user: string;
  patch: Patch;
};
