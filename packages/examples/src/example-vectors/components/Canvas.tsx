import React, { useState } from 'react';
import { collabodux } from '../model/connection';
import { useMappedLocalState, useSession } from '@collabodux/react-hooks';
import { ShapeType } from '../model/model';
import uuid from 'uuid/v4';
import { useUserMap } from '../../dux/use-user-map';
import toMaterialStyle from 'material-color-hash';
import useEventEffect from '../../utils/useEventEffect';
import FocusInput from '../../components/FocusInput';
import { useMutate } from '../../dux/use-mutate';
import { setUserSelectedItem } from '../../dux/user-mutators';
import { addShape, createCanvas, updateShape } from '../model/mutators';

function SvgShape({
  shape: { key, type, x, y, w, h, fillColor, strokeColor, strokeWidth },
  users,
}: {
  shape: ShapeType;
  users: string[] | undefined;
}) {
  const session = useSession(collabodux);
  const mutate = useMutate(collabodux);
  const selectShape = (key?: string) =>
    session && mutate(setUserSelectedItem({ session, key }));

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
      mutate(
        updateShape({
          key,
          shape: {
            x: x + event.clientX - startPoint.mouseX,
            y: y + event.clientY - startPoint.mouseY,
          },
        }),
      );
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
  const mutate = useMutate(collabodux);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const userMap = useUserMap(collabodux);
  const selectedShapes = new Map<string, string[]>();
  Object.entries(userMap).forEach(([userId, user]) => {
    const { selectedItem } = user;
    if (selectedItem) {
      const users = selectedShapes.get(selectedItem);
      if (users) {
        users.push(userId);
      } else {
        selectedShapes.set(selectedItem, [userId]);
      }
    }
  });
  const selectedShapeId =
    session && userMap[session] && userMap[session].selectedItem;
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
                mutate(
                  addShape({
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
                  }),
                )
              }
            >
              Add Rect
            </button>
            {selectedShape && selectedShapeId && (
              <>
                <div>
                  Stroke:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/strokeColor`}
                    value={selectedShape.strokeColor || ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { strokeColor: event.target.value },
                        }),
                      )
                    }
                  />
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/strokeWidth`}
                    value={String(selectedShape.strokeWidth || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: {
                            strokeWidth: parseInt(event.target.value, 10),
                          },
                        }),
                      )
                    }
                  />
                </div>
                <div>
                  Fill:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/fillColor`}
                    value={selectedShape.fillColor || ''}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { fillColor: event.target.value },
                        }),
                      )
                    }
                  />
                </div>
                <div>
                  X:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/x`}
                    value={String(selectedShape.x || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { x: parseInt(event.target.value, 10) },
                        }),
                      )
                    }
                  />
                  Y:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/y`}
                    value={String(selectedShape.y || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { y: parseInt(event.target.value, 10) },
                        }),
                      )
                    }
                  />
                </div>
                <div>
                  Width:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/w`}
                    value={String(selectedShape.w || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { w: parseInt(event.target.value, 10) },
                        }),
                      )
                    }
                  />
                  Height:
                  <FocusInput
                    collabodux={collabodux}
                    focusId={`shapes/${selectedShapeId}/h`}
                    value={String(selectedShape.h || 0)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      mutate(
                        updateShape({
                          key: selectedShapeId,
                          shape: { h: parseInt(event.target.value, 10) },
                        }),
                      )
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
          <button onClick={() => mutate(createCanvas({ width, height }))}>
            Create Canvas!
          </button>
        </>
      )}
    </div>
  );
}
