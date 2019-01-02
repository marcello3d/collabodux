export enum MessageType {
  error = 'error',
  state = 'state',
  join = 'join',
  leave = 'leave',
  reject = 'reject',
  accept = 'accept',
  change = 'change',
  getState = 'getState',
}

export type RequestMessage<Patch> = RequestChangeMessage<Patch> | GetStateMessage;

export type ResponseMessage<Patch> =
  | ErrorMessage
  | StateMessage
  | JoinMessage
  | LeaveMessage
  | RejectMessage
  | AcceptMessage
  | ChangeMessage<Patch>;

export enum RejectCode {
  outdated = 'outdated',
  permission = 'permission',
  internal = 'internal',
}

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
  session: string;
  sessions: string[];
};

export type JoinMessage = {
  type: MessageType.join;
  session: string;
};

export type LeaveMessage = {
  type: MessageType.leave;
  session: string;
};

export type RejectMessage = {
  type: MessageType.reject;
  req: string;
  code: RejectCode;
  reason?: string;
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
