export function moveArrayItem(array: any[], index: number, newIndex: number) {
  if (index === newIndex || index >= array.length || newIndex >= array.length) {
    return;
  }
  const item = array[index];
  if (newIndex < index) {
    array.splice(index, 1);
    array.splice(newIndex, 0, item);
  } else {
    array.splice(newIndex + 1, 0, item);
    array.splice(index, 1);
  }
}
