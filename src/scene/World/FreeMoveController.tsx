import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
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

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _intersect = new THREE.Vector3();

export const FreeMoveController: React.FC = () => {
  const { raycaster, gl } = useThree();
  const viewState = useView();
  useProject();

  const isShiftPressed = useRef<boolean>(false);
  const initialHitPoint = useRef<THREE.Vector3 | null>(null);
  const initialTransforms = useRef<Map<string, ComponentTransform>>(new Map());
  const hasMoved = useRef<boolean>(false);

  // Commit current move to history
  const commitMove = () => {
    if (initialTransforms.current.size > 0 && hasMoved.current) {
      const currentComponents = projectStore.getState().components;
      initialTransforms.current.forEach((prevTransform, compId) => {
        const comp = currentComponents.find((c) => c.id === compId);
        if (comp) {
          const nextTransform: ComponentTransform = {
            position: { ...comp.transform.position },
            rotation: { ...comp.transform.rotation },
            scale: { ...comp.transform.scale },
          };

          if (comp.type !== 'breadboard') {
            const placement = findBreadboardPlacementForComponent(
              currentComponents,
              comp.type,
              comp.transform.position.x,
              comp.transform.position.z,
              comp.id
            );
            projectStore.syncBreadboardConnectionsForComponent(comp.id, placement);
            if (placement && initialTransforms.current.size === 1) {
              viewStore.setConnectionFeedback({
                message: `${placement.label} (Aligned)`,
                severity: 'info',
              });
            }
          }

          historyManager.execute(
            Commands.transformComponent(compId, prevTransform, nextTransform)
          );
        }
      });
    }

    viewStore.setBreadboardSnapTarget(null);
    viewStore.setIsFreeMoving(false);
    initialHitPoint.current = null;
    initialTransforms.current.clear();
    hasMoved.current = false;
    gl.domElement.style.cursor = 'auto';
    document.body.style.cursor = 'auto';
  };

  // Cancel move and revert positions
  const cancelMove = () => {
    if (initialTransforms.current.size > 0) {
      initialTransforms.current.forEach((prevTransform, compId) => {
        projectStore.updateComponentTransform(compId, prevTransform);
      });
    }

    viewStore.setBreadboardSnapTarget(null);
    viewStore.setIsFreeMoving(false);
    initialHitPoint.current = null;
    initialTransforms.current.clear();
    hasMoved.current = false;
    gl.domElement.style.cursor = 'auto';
    document.body.style.cursor = 'auto';
  };

  // Keyboard listeners for Shift key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if (e.key === 'Shift' && !isShiftPressed.current) {
        isShiftPressed.current = true;
        const state = viewStore.getState();
        if (state.selectedComponentIds.length > 0 && !state.activeWiring) {
          // Initialize initial transforms
          initialTransforms.current.clear();
          const currentComps = projectStore.getState().components;
          state.selectedComponentIds.forEach((id) => {
            const comp = currentComps.find((c) => c.id === id);
            if (comp) {
              initialTransforms.current.set(id, {
                position: { ...comp.transform.position },
                rotation: { ...comp.transform.rotation },
                scale: { ...comp.transform.scale },
              });
            }
          });

          viewStore.setIsFreeMoving(true);
          initialHitPoint.current = null; // will be set on next pointer frame
          hasMoved.current = false;
          gl.domElement.style.cursor = 'move';
          document.body.style.cursor = 'move';
        }
      }

      if (e.key === 'Escape' && viewStore.getState().isFreeMoving) {
        cancelMove();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressed.current = false;
        if (viewStore.getState().isFreeMoving) {
          commitMove();
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (viewStore.getState().isFreeMoving && e.button === 0) {
        // Left click while free moving drops/places the object
        commitMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gl]);

  // Frame-by-frame cursor tracking when free moving
  useFrame(() => {
    if (!viewState.isFreeMoving) return;

    if (viewState.selectedComponentIds.length === 0) {
      commitMove();
      return;
    }

    const hit = raycaster.ray.intersectPlane(GROUND_PLANE, _intersect);
    if (!hit) return;

    // If initialHitPoint not yet recorded, initialize with current cursor intersection
    if (!initialHitPoint.current) {
      initialHitPoint.current = hit.clone();
      return;
    }

    const deltaX = hit.x - initialHitPoint.current.x;
    const deltaZ = hit.z - initialHitPoint.current.z;

    if (Math.abs(deltaX) > 0.001 || Math.abs(deltaZ) > 0.001) {
      hasMoved.current = true;
    }

    const currentComponents = projectStore.getState().components;
    const isSingleMove = initialTransforms.current.size === 1;

    // Apply movement delta to each selected component
    initialTransforms.current.forEach((prevTransform, compId) => {
      const comp = currentComponents.find((c) => c.id === compId);
      const rawX = prevTransform.position.x + deltaX;
      const rawZ = prevTransform.position.z + deltaZ;

      const placement = comp
        ? findBreadboardPlacementForComponent(
            currentComponents,
            comp.type,
            rawX,
            rawZ,
            comp.id
          )
        : null;

      if (placement) {
        if (isSingleMove) {
          viewStore.setBreadboardSnapTarget({
            breadboardId: placement.breadboardId,
            holeId: placement.targetHoles[0]?.holeId || '',
            position: placement.snappedPosition,
            targetHoles: placement.targetHoles,
            label: placement.label,
            column: placement.column,
          });
        }
        projectStore.updateComponentTransform(compId, {
          position: { ...placement.snappedPosition },
        });
        return;
      }

      if (isSingleMove) {
        viewStore.setBreadboardSnapTarget(null);
      }

      const targetX = viewState.snapToGrid ? snapToSceneGrid(rawX) : Number(rawX.toFixed(2));
      const targetZ = viewState.snapToGrid ? snapToSceneGrid(rawZ) : Number(rawZ.toFixed(2));
      const targetY =
        Math.abs(prevTransform.position.y - BREADBOARD_SURFACE_Y) < 0.05
          ? 0
          : prevTransform.position.y;

      projectStore.updateComponentTransform(compId, {
        position: {
          x: targetX,
          y: targetY,
          z: targetZ,
        },
      });
    });
  });

  return null;
};
