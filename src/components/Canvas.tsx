import React, { ChangeEvent, useState } from 'react';
import { collabodux } from '../dux/connection';
import { useMappedLocalState, useSession } from '../client/collabodux-hooks';
import { IShape } from '../dux/model';
import { useDispatch } from '../dux/collabodux-fsa-hooks';
import { reducer } from '../dux/reducer';
import {
  addShape,
  createCanvas,
  setUserSelectedShape,
  updateShape,
} from '../dux/actions';
import uuid from 'uuid/v4';
import { useUserMap } from '../dux/use-user-map';
import toMaterialStyle from 'material-color-hash';
import useEventEffect from '../utils/useEventEffect';
import FocusInput from './FocusInput';

function SvgShape({
  shape: { key, type, x, y, w, h, fillColor, strokeColor, strokeWidth },
  users,
}: {
  shape: IShape;
  users: string[] | undefined;
}) {
  const session = useSession(collabodux);
  const dispatchSelectShape = useDispatch(
    collabodux,
    reducer,
    setUserSelectedShape,
  );
  const dispatchUpdateShape = useDispatch(collabodux, reducer, updateShape);
  const selectShape = (key?: string) =>
    session && dispatchSelectShape({ session, key });

  const [pressing, setPressing] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [startPoint, setStartPoint] = useState({
    mouseX: 0,
    mouseY: 0,
  });
  useEventEffect(document, 'mouseup', () => setPressing(false), {
    enabled: pressing,
  });
  useEventEffect(
    document,
    'mousemove',
    (event: MouseEvent) => {
      dispatchUpdateShape({
        key,
        shape: {
          x: x + event.clientX - startPoint.mouseX,
          y: y + event.clientY - startPoint.mouseY,
        },
      });
      setStartPoint({
        mouseX: event.clientX,
        mouseY: event.clientY,
      });
    },
    { enabled: pressing },
  );
  const style = {
    onMouseOver: () => setHovering(true),
    onMouseOut: () => setHovering(false),
    onMouseDown: (event: React.MouseEvent) => {
      selectShape(key);
      setPressing(true);
      setStartPoint({
        mouseX: event.clientX,
        mouseY: event.clientY,
      });
    },
    stroke: strokeColor,
    strokeWidth: strokeWidth || 0,
    fill: fillColor,
  };
  const highlights = users
    ? users.map((user, index) => (
        <rect
          key={index}
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          fill="none"
          stroke={toMaterialStyle(user, 500).backgroundColor}
          strokeWidth={user === session ? 2 : 1}
          strokeDasharray={user === session && pressing ? '4 2' : '4'}
        />
      ))
    : undefined;
  const userHighlight =
    hovering || pressing ? (
      <rect
        x={x - 2}
        y={y - 2}
        width={w + 4}
        height={h + 4}
        fill="none"
        stroke="#00f"
        strokeWidth={2}
        strokeDasharray={pressing ? '4 2' : '4'}
      />
    ) : (
      undefined
    );
  switch (type) {
    case 'ellipse':
      return (
        <>
          <ellipse
            cx={x - w / 2}
            cy={y - h / 2}
            rx={w / 2}
            ry={h / 2}
            {...style}
          />
          {highlights}
          {userHighlight}
        </>
      );
    case 'rect':
      return (
        <>
          <rect x={x} y={y} width={w} height={h} {...style} />
          {highlights}
          {userHighlight}
        </>
      );
  }
}
export default function Canvas() {
  const session = useSession(collabodux);

  const canvas = useMappedLocalState(collabodux, ({ canvas }) => canvas);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const doCreateCanvas = useDispatch(collabodux, reducer, createCanvas);
  const doAddShape = useDispatch(collabodux, reducer, addShape);
  const doUpdateShape = useDispatch(collabodux, reducer, updateShape);
  const userMap = useUserMap(collabodux);
  const selectedShapes = new Map<string, string[]>();
  Object.entries(userMap).forEach(([userId, user]) => {
    const { selectedShape } = user;
    if (selectedShape) {
      const users = selectedShapes.get(selectedShape);
      if (users) {
        users.push(userId);
      } else {
        selectedShapes.set(selectedShape, [userId]);
      }
    }
  });
  const selectedShapeId =
    session && userMap[session] && userMap[session].selectedShape;
  const selectedShape =
    selectedShapeId &&
    canvas &&
    canvas.shapes.find(({ key }) => key === selectedShapeId);
  return (
    <div>
      {canvas ? (
        <>
          <div>
            <button
              onClick={() =>
                doAddShape({
                  shape: {
                    key: uuid(),
                    type: 'rect',
                    x: Math.random() * 512,
                    y: Math.random() * 512,
                    w: 20,
                    h: 20,
                    strokeColor: '#000',
                    strokeWidth: 1,
                    fillColor: '#f00',
                  },
                })
              }
            >
              Add Rect
            </button>
            {selectedShape && selectedShapeId && (
              <>
                <div>
                  Stroke:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/strokeColor`}
                    value={selectedShape.strokeColor || ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { strokeColor: event.target.value },
                      })
                    }
                  />
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/strokeWidth`}
                    value={String(selectedShape.strokeWidth || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: {
                          strokeWidth: parseInt(event.target.value, 10),
                        },
                      })
                    }
                  />
                </div>
                <div>
                  Fill:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/fillColor`}
                    value={selectedShape.fillColor || ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { fillColor: event.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  X:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/x`}
                    value={String(selectedShape.x || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { x: parseInt(event.target.value, 10) },
                      })
                    }
                  />
                  Y:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/y`}
                    value={String(selectedShape.y || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { y: parseInt(event.target.value, 10) },
                      })
                    }
                  />
                </div>
                <div>
                  Width:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/w`}
                    value={String(selectedShape.w || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { w: parseInt(event.target.value, 10) },
                      })
                    }
                  />
                  Height:
                  <FocusInput
                    focusId={`shapes/${selectedShapeId}/h`}
                    value={String(selectedShape.h || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      doUpdateShape({
                        key: selectedShapeId,
                        shape: { h: parseInt(event.target.value, 10) },
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <svg
            width={canvas.width}
            height={canvas.height}
            style={{ border: 'solid 1px black' }}
          >
            {canvas.shapes.map((shape) => (
              <SvgShape
                key={shape.key}
                shape={shape}
                users={selectedShapes.get(shape.key)}
              />
            ))}
          </svg>
        </>
      ) : (
        <>
          New Canvas:{' '}
          <input
            value={width}
            onChange={(event) => setWidth(parseInt(event.target.value, 10))}
          />{' '}
          x{' '}
          <input
            value={height}
            onChange={(event) => setHeight(parseInt(event.target.value, 10))}
          />
          <button onClick={() => doCreateCanvas({ width, height })}>
            Create Canvas!
          </button>
        </>
      )}
    </div>
  );
}
