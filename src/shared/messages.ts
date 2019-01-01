import { Patch } from 'immer';

export enum MessageType {
  error = 'error',
  state = 'state',
  reject = 'reject',
  accept = 'accept',
  change = 'change',
  getState = 'getState',
}

export type RequestMessage = RequestChangeMessage | GetStateMessage;

export type ResponseMessage =
  | ErrorMessage
  | StateMessage
  | RejectMessage
  | AcceptMessage
  | ChangeMessage;

export type RequestChangeMessage = {
  type: MessageType.change;
  req: string;
  vtag: string;
  patches: Patch[];
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

export type ChangeMessage = {
  type: MessageType.change;
  vtag: string;
  user: string;
  patches: Patch[];
};
