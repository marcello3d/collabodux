import { jsonEqual, JSONObject } from 'json-diff3';
import { createPatch } from 'rfc6902';
import applyPatch from 'json-touch-patch';
import { Operation } from '@collabodux/messages';

export type Merger<State, RawState> = (
  base: RawState | undefined,
  local: State,
  remote: RawState,
) => State;

export class PatchStateManager<
  State extends RawState,
  RawState extends JSONObject
> {
  constructor(
    private mergeState: Merger<State, RawState>,
    private _local: State,
    private _remote: RawState | undefined = undefined,
    private _vtag: string = 'ROOT',
  ) {}

  get local(): State {
    return this._local;
  }

  get remote(): RawState | undefined {
    return this._remote;
  }

  get vtag(): string {
    return this._vtag;
  }

  setLocal(local: State): boolean {
    if (!jsonEqual(this._local, local)) {
      this._local = local;
      return true;
    }
    return false;
  }

  setRemote(remote: RawState, vtag: string): boolean {
    const changed = this.setLocal(
      this.mergeState(this._remote, this._local, remote),
    );
    this._remote = remote;
    this._vtag = vtag;
    return changed;
  }

  patchRemote(patches: Operation[], vtag: string): boolean {
    const newServerState = applyPatch(this._remote, patches, {
      strict: true,
      error: true,
    });
    if (newServerState === undefined) {
      throw new Error('patch results in undefined');
    }
    return this.setRemote(newServerState, vtag);
  }

  getLocalPatches(): Operation[] {
    return createPatch(this._remote, this._local);
  }
}
