import { Undo } from '@collabodux/client';

export const NoUndo = undefined;

export type EditMetadata = {
  type: string;
  merge?: number;
};
export const mergeEdit = <State>(
  undo: Undo<State, EditMetadata>,
  { type, merge = 0 }: EditMetadata,
) => undo.metadata.type === type && undo.count < merge;
