import { createMutatorFactory } from '../../dux/use-mutate';
import { ModelStateType, ShapeType } from './model';

const createMutator = createMutatorFactory<ModelStateType>();

export const setTitle = createMutator<{
  title: string;
}>(
  (draft, { title }) => {
    draft.title = title;
  },
  true,
  true,
);

export const createCanvas = createMutator<{
  width: number;
  height: number;
}>(
  (draft, { width, height }) => {
    draft.canvas = { width, height, shapes: [] };
  },
  true,
  true,
);

export const addShape = createMutator<{
  shape: ShapeType;
}>(
  (draft, { shape }) => {
    if (draft.canvas) {
      draft.canvas.shapes.push(shape);
    }
  },
  true,
  true,
);

export const updateShape = createMutator<{
  key: string;
  shape: Partial<ShapeType>;
}>(
  (draft, { key, shape }) => {
    if (draft.canvas) {
      const existingShape = draft.canvas.shapes.find(
        ({ key: _key }) => key === _key,
      );
      if (existingShape) {
        Object.assign(existingShape, shape);
      }
    }
  },
  true,
  true,
);
