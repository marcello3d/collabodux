import { createMutatorFactory } from '../../dux/use-mutate';
import { ModelStateType, ShapeType } from './model';
import { EditMetadata } from '../../dux/edit-merge';

const createMutator = createMutatorFactory<ModelStateType, EditMetadata>();

export const setTitle = createMutator<{
  title: string;
}>((draft, { title }) => {
  draft.title = title;
  return { type: 'edit-title', merge: 10 };
});

export const createCanvas = createMutator<{
  width: number;
  height: number;
}>((draft, { width, height }) => {
  draft.canvas = { width, height, shapes: [] };
  return { type: 'create-canvas' };
});

export const addShape = createMutator<{
  shape: ShapeType;
}>((draft, { shape }) => {
  if (draft.canvas) {
    draft.canvas.shapes.push(shape);
  }
  return { type: 'add-shape' };
});

export const updateShape = createMutator<{
  key: string;
  shape: Partial<ShapeType>;
}>((draft, { key, shape }) => {
  if (draft.canvas) {
    const existingShape = draft.canvas.shapes.find(
      ({ key: _key }) => key === _key,
    );
    if (existingShape) {
      Object.assign(existingShape, shape);
    }
  }
  return { type: 'update-shape', merge: 20 };
});
