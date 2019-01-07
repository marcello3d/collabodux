import { diff3MergeStringRanges } from './merge-edits';

export function updateInputValueMovingSelection(
  value: string,
  input: HTMLInputElement | HTMLTextAreaElement,
): boolean {
  const priorValue = input.value;
  if (value === priorValue) {
    return false;
  }
  const { selectionStart, selectionEnd } = input;
  input.value = value;
  if (selectionStart === null || selectionEnd === null) {
    return false;
  }
  const startCursor = {
    start: selectionStart,
    end: selectionEnd,
    value: 'cursor',
  };
  const { ranges } = diff3MergeStringRanges(
    priorValue,
    priorValue,
    value,
    [startCursor],
    [startCursor],
    [],
  );
  if (ranges.length > 0) {
    const [{ start, end }] = ranges;
    input.selectionStart = start;
    input.selectionEnd = end;
  }
  return true;
}
