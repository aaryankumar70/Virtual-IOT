import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import type { TransformControls as TransformControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentTransform } from '../../core/components/VirtualComponent';

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
    if (comp && prevTransformRef.current && targetObject) {
      let posX = targetObject.position.x;
      let posY = Math.max(0, targetObject.position.y); // keep resting above table
      let posZ = targetObject.position.z;

      if (viewState.snapToGrid) {
        posX = Math.round(posX);
        posY = Math.max(0, Math.round(posY));
        posZ = Math.round(posZ);
        targetObject.position.set(posX, posY, posZ);
      }

      const nextTransform: ComponentTransform = {
        position: {
          x: Number(posX.toFixed(2)),
          y: Number(posY.toFixed(2)),
          z: Number(posZ.toFixed(2)),
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

      // Update project store
      projectStore.updateComponentTransform(comp.id, nextTransform);

      // Record in history for Undo/Redo
      historyManager.execute(
        Commands.transformComponent(comp.id, prevTransformRef.current, nextTransform)
      );
    }
  };

  const handleChange = () => {
    if (!isDraggingRef.current) return;
    if (targetObject && comp) {
      // Continuously sync live transform so wires and pins recompute while actively dragging
      projectStore.updateComponentTransform(comp.id, {
        position: {
          x: targetObject.position.x,
          y: targetObject.position.y,
          z: targetObject.position.z,
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
