import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import type { TransformControls as TransformControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentTransform } from '../../core/components/VirtualComponent';
import {
  BREADBOARD_SURFACE_Y,
  findBreadboardPlacementForComponent,
  snapToSceneGrid,
} from '../../utils/breadboardSnap';

interface Props {
  targetObject: THREE.Object3D | null;
  componentId: string | null;
}

export const TransformGizmo: React.FC<Props> = ({ targetObject, componentId }) => {
  const transformRef = useRef<TransformControlsType>(null);
  const viewState = useView();
  const projectState = useProject();

  const prevTransformRef = useRef<ComponentTransform | null>(null);
  const isDraggingRef = useRef(false);

  const comp = componentId
    ? projectState.components.find((c) => c.id === componentId)
    : null;

  const handleMouseDown = () => {
    isDraggingRef.current = true;
    viewStore.setIsTransforming(true);
    if (comp) {
      prevTransformRef.current = {
        position: { ...comp.transform.position },
        rotation: { ...comp.transform.rotation },
        scale: { ...comp.transform.scale },
      };
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    viewStore.setIsTransforming(false);
    viewStore.setBreadboardSnapTarget(null);

    if (comp && prevTransformRef.current && targetObject) {
      let posX = targetObject.position.x;
      let posY = Math.max(0, targetObject.position.y);
      let posZ = targetObject.position.z;

      const currentView = viewStore.getState();
      const placement =
        currentView.transformMode === 'translate'
          ? findBreadboardPlacementForComponent(
              projectStore.getState().components,
              comp.type,
              posX,
              posZ,
              comp.id
            )
          : null;

      if (placement) {
        posX = placement.snappedPosition.x;
        posY = placement.snappedPosition.y;
        posZ = placement.snappedPosition.z;
        targetObject.position.set(posX, posY, posZ);
      } else if (currentView.snapToGrid) {
        posX = snapToSceneGrid(posX);
        posZ = snapToSceneGrid(posZ);
        if (Math.abs(posY - BREADBOARD_SURFACE_Y) < 0.05) {
          posY = 0;
        } else {
          posY = Math.max(0, snapToSceneGrid(posY));
        }
        targetObject.position.set(posX, posY, posZ);
      }

      const nextTransform: ComponentTransform = {
        position: {
          x: Number(posX.toFixed(3)),
          y: Number(posY.toFixed(3)),
          z: Number(posZ.toFixed(3)),
        },
        rotation: {
          x: targetObject.rotation.x,
          y: targetObject.rotation.y,
          z: targetObject.rotation.z,
        },
        scale: {
          x: targetObject.scale.x,
          y: targetObject.scale.y,
          z: targetObject.scale.z,
        },
      };

      // Update project store and sync breadboard hole connections if translated
      projectStore.updateComponentTransform(comp.id, nextTransform);
      if (currentView.transformMode === 'translate' && comp.type !== 'breadboard') {
        projectStore.syncBreadboardConnectionsForComponent(comp.id, placement);
        if (placement) {
          viewStore.setConnectionFeedback({
            message: `${placement.label} (Aligned)`,
            severity: 'info',
          });
        }
      }

      // Record in history for Undo/Redo
      historyManager.execute(
        Commands.transformComponent(comp.id, prevTransformRef.current, nextTransform)
      );
    }
  };

  const handleChange = () => {
    if (!isDraggingRef.current) return;
    if (targetObject && comp) {
      let posX = targetObject.position.x;
      let posY = Math.max(0, targetObject.position.y);
      let posZ = targetObject.position.z;

      const currentView = viewStore.getState();
      if (currentView.transformMode === 'translate') {
        const placement = findBreadboardPlacementForComponent(
          projectStore.getState().components,
          comp.type,
          posX,
          posZ,
          comp.id
        );

        if (placement) {
          posX = placement.snappedPosition.x;
          posY = placement.snappedPosition.y;
          posZ = placement.snappedPosition.z;
          targetObject.position.set(posX, posY, posZ);
          viewStore.setBreadboardSnapTarget({
            breadboardId: placement.breadboardId,
            holeId: placement.targetHoles[0]?.holeId || '',
            position: placement.snappedPosition,
            targetHoles: placement.targetHoles,
            label: placement.label,
            column: placement.column,
          });
        } else {
          viewStore.setBreadboardSnapTarget(null);
          if (currentView.snapToGrid) {
            posX = snapToSceneGrid(posX);
            posZ = snapToSceneGrid(posZ);
            if (Math.abs(posY - BREADBOARD_SURFACE_Y) < 0.05) {
              posY = 0;
            }
            targetObject.position.set(posX, posY, posZ);
          }
        }
      }

      // Continuously sync live transform so wires and pins recompute while actively dragging
      projectStore.updateComponentTransform(comp.id, {
        position: {
          x: Number(posX.toFixed(3)),
          y: Number(posY.toFixed(3)),
          z: Number(posZ.toFixed(3)),
        },
        rotation: {
          x: targetObject.rotation.x,
          y: targetObject.rotation.y,
          z: targetObject.rotation.z,
        },
        scale: {
          x: targetObject.scale.x,
          y: targetObject.scale.y,
          z: targetObject.scale.z,
        },
      });
    }
  };

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onDraggingChanged = (e: any) => {
      if (e.value) {
        handleMouseDown();
      } else {
        handleMouseUp();
      }
    };

    (controls as any).addEventListener('dragging-changed', onDraggingChanged);
    return () => {
      (controls as any).removeEventListener('dragging-changed', onDraggingChanged);
    };
  }, [targetObject, comp]);

  if (!targetObject || !componentId || !comp) return null;

  return (
    // @ts-ignore
    <TransformControls
      ref={transformRef}
      object={targetObject}
      mode={viewState.transformMode}
      size={0.7}
      space="world"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onObjectChange={handleChange}
    />
  );
};
