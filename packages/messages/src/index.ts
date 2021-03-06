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

export type RequestMessage = RequestChangeMessage | GetStateMessage;

export type ResponseMessage =
  | ErrorMessage
  | StateMessage
  | JoinMessage
  | LeaveMessage
  | RejectMessage
  | AcceptMessage
  | ChangeMessage;

export enum RejectCode {
  outdated = 'outdated',
  badRequest = 'badRequest',
  permission = 'permission',
  internal = 'internal',
}

export type RequestChangeMessage = {
  type: MessageType.change;
  req: string;
  vtag: string;
  patches: Operation[];
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

export type ChangeMessage = {
  type: MessageType.change;
  vtag: string;
  user: string;
  patches: Operation[];
};

// From https://github.com/chbrown/rfc6902 (MIT license)
export interface AddOperation {
  op: 'add';
  path: string;
  value: any;
}
export interface RemoveOperation {
  op: 'remove';
  path: string;
}
export interface ReplaceOperation {
  op: 'replace';
  path: string;
  value: any;
}
export interface MoveOperation {
  op: 'move';
  from: string;
  path: string;
}
export interface CopyOperation {
  op: 'copy';
  from: string;
  path: string;
}
export interface TestOperation {
  op: 'test';
  path: string;
  value: any;
}
export declare type Operation =
  | AddOperation
  | RemoveOperation
  | ReplaceOperation
  | MoveOperation
  | CopyOperation
  | TestOperation;
