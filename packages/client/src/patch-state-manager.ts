import { jsonEqual, JSONObject } from 'json-diff3';
import { createPatch } from 'rfc6902';
import applyPatch from 'json-touch-patch';
import { Operation } from '@collabodux/messages';
import { Merger, Validate } from './index';

export class PatchStateManager<
  State extends RawState,
  RawState extends JSONObject
> {
  private _remote: State;
  constructor(
    private normalize: Validate<State, RawState>,
    private mergeState: Merger<State>,
    private _local: State = normalize(),
    private _rawRemote: RawState | undefined = undefined,
    private _vtag: string = 'ROOT',
  ) {
    this._remote = normalize(_rawRemote);
  }

  /**
   * Returns the current local state
   */
  get local(): State {
    return this._local;
  }

  /**
   * Returns whether remote has been set or not
   */
  get hasRemote(): boolean {
    return this._rawRemote !== undefined;
  }

  /**
   * Returns the latest server version tag
   */
  get vtag(): string {
    return this._vtag;
  }

  /**
   * Update the local state to a new local state
   */
  setLocal(local: State): boolean {
    if (!jsonEqual(this._local, local)) {
      this._local = local;
      return true;
    }
    return false;
  }

  /**
   * Update the remote state and merge into current local state
   *
   * Returns true if merge resulted in local state changes
   */
  mergeRemote(rawRemote: RawState, vtag: string): boolean {
    const remote = this.normalize(rawRemote);
    const changed = this.setLocal(
      this.mergeState(this._remote, this._local, remote),
    );
    this._setRawRemote(rawRemote, remote, vtag);
    return changed;
  }

  /**
   * Update remote state using patches and merge into local state
   *
   * Returns true if merge resulted in local state changes
   */
  patchRemote(patches: Operation[], vtag: string): boolean {
    const newServerState = applyPatch(this._rawRemote, patches, {
      strict: true,
      error: true,
    });
    if (newServerState === undefined) {
      throw new Error('patch results in undefined');
    }
    return this.mergeRemote(newServerState, vtag);
  }

  /**
   * Update remote state based on server-acceptance of local state changes
   * (does not merge)
   */
  acceptLocalChanges(state: State, vtag: string): void {
    this._setRawRemote(state, state, vtag);
  }

  /**
   * Returns a list of patches between remote to current local state
   */
  getLocalPatches(): Operation[] {
    return createPatch(this._rawRemote, this._local);
  }

  private _setRawRemote(rawRemote: RawState, remote, vtag: string) {
    this._rawRemote = rawRemote;
    this._remote = remote;
    this._vtag = vtag;
  }
}
