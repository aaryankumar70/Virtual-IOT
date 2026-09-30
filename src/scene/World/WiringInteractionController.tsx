import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { validateConnection } from '../../core/connections/validateConnection';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { getPinColor } from '../../utils/theme';

export const WiringInteractionController: React.FC = () => {
  const { camera, raycaster, gl } = useThree();
  const viewState = useView();
  const projectState = useProject();

  const activeWiring = viewState.activeWiring;

  // Refs for smooth continuous raycasting without re-renders
  const lastPointerPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseMovedRef = useRef<boolean>(false);

  // Bench and breadboard intersection planes
  const workbenchPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const breadboardPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.43));
  const intersectionPoint = useRef(new THREE.Vector3());

  // Handle pointer move during active wiring
  useEffect(() => {
    const dom = gl.domElement;

    const handlePointerMove = (e: PointerEvent) => {
      lastPointerPos.current = { x: e.clientX, y: e.clientY };

      if (!viewState.activeWiring) return;

      // Detect if user has dragged past a minimal threshold (4px)
      if (viewState.activeWiring.startScreenPos) {
        const dx = e.clientX - viewState.activeWiring.startScreenPos.x;
        const dy = e.clientY - viewState.activeWiring.startScreenPos.y;
        if (Math.hypot(dx, dy) > 4) {
          mouseMovedRef.current = true;
          if (!viewState.activeWiring.isDragging) {
            viewStore.setIsDraggingWire(true);
          }
        }
      }
    };

    // Global pointer up to commit drag-to-connect
    const handlePointerUp = (e: PointerEvent) => {
      const active = viewStore.getState().activeWiring;
      if (!active) return;

      const sourceCompId = active.sourceComponentId;
      const sourcePinId = active.sourcePinId;

      // If we have a snapped target pin (or hovered pin) and it is different from the source pin:
      const target = active.snappedTarget || viewStore.getState().hoveredPin;
      if (
        target &&
        (target.componentId !== sourceCompId || target.pinId !== sourcePinId)
      ) {
        // Complete connection!
        const sourceComp = projectStore.getState().components.find((c) => c.id === sourceCompId);
        const sourcePin = sourceComp?.pins.find((p) => p.id === sourcePinId);
        const targetComp = projectStore.getState().components.find((c) => c.id === target.componentId);
        const targetPin = targetComp?.pins.find((p) => p.id === target.pinId);

        if (sourcePin && targetPin) {
          const validation = validateConnection(
            sourcePin,
            targetPin,
            sourceCompId,
            target.componentId
          );

          if (validation.valid) {
            // Pick color from active wiring or fallback to pin base color
            const wireColor = active.wireColor || getPinColor(sourcePin.type);

            historyManager.execute(
              Commands.addConnection(
                {
                  componentId: sourceCompId,
                  interfaceId: sourcePinId,
                  type: 'pin',
                  pinId: sourcePinId,
                },
                {
                  componentId: target.componentId,
                  interfaceId: target.pinId,
                  type: 'pin',
                  pinId: target.pinId,
                },
                wireColor
              )
            );
            viewStore.cancelWiring();
            viewStore.setHoveredPin(null);
            return;
          } else {
            viewStore.setConnectionFeedback({
              message: validation.message,
              severity: validation.severity === 'warning' ? 'warning' : 'error',
            });
            viewStore.cancelWiring();
            return;
          }
        }
      }

      // If user dragged into empty space and released:
      if (active.startScreenPos) {
        const dx = e.clientX - active.startScreenPos.x;
        const dy = e.clientY - active.startScreenPos.y;
        const dragDistance = Math.hypot(dx, dy);

        if (dragDistance > 16) {
          // Dragged away into empty space: cancel wiring
          viewStore.cancelWiring();
          return;
        } else {
          // Quick click in place: stay in click-to-connect mode
          viewStore.setIsDraggingWire(false);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl.domElement, viewState.activeWiring]);

  // Per-frame magnetic snapping and wire endpoint tracking
  useFrame(() => {
    if (!activeWiring) return;

    // 1. First, check magnetic snap to all candidate pins across components
    const sourceCompId = activeWiring.sourceComponentId;
    const sourcePinId = activeWiring.sourcePinId;

    let closestPin: {
      componentId: string;
      pinId: string;
      worldPos: THREE.Vector3;
      rayDistance: number;
    } | null = null;

    let minRayDist = 0.38; // Magnetic snap radius in world units (~3.8mm real scale)

    for (const comp of projectState.components) {
      // Find candidate pins
      for (const pin of comp.pins) {
        // Disallow snapping to self source pin
        if (comp.id === sourceCompId && pin.id === sourcePinId) continue;

        const pinWorldPos = projectStore.getPinWorldPosition(comp.id, pin.id);
        if (!pinWorldPos) continue;

        // Compute distance from cursor ray to pin world position
        const rayDist = raycaster.ray.distanceToPoint(pinWorldPos);
        if (rayDist < minRayDist) {
          minRayDist = rayDist;
          closestPin = {
            componentId: comp.id,
            pinId: pin.id,
            worldPos: pinWorldPos,
            rayDistance: rayDist,
          };
        }
      }
    }

    if (closestPin) {
      // Magnetic snap directly to the closest pin center!
      viewStore.setWiringSnappedTarget({
        componentId: closestPin.componentId,
        pinId: closestPin.pinId,
      });
      viewStore.setHoveredPin({
        componentId: closestPin.componentId,
        pinId: closestPin.pinId,
      });
      viewStore.updateWiringPreview({
        x: closestPin.worldPos.x,
        y: closestPin.worldPos.y,
        z: closestPin.worldPos.z,
      });
      return;
    }

    // 2. If no pin is within magnetic snap radius:
    if (activeWiring.snappedTarget) {
      viewStore.setWiringSnappedTarget(null);
      viewStore.setHoveredPin(null);
    }

    // Intersect cursor ray with plane (use breadboard height if high, or workbench surface)
    let hit = raycaster.ray.intersectPlane(breadboardPlane.current, intersectionPoint.current);
    if (!hit) {
      hit = raycaster.ray.intersectPlane(workbenchPlane.current, intersectionPoint.current);
    }

    if (hit) {
      viewStore.updateWiringPreview({
        x: intersectionPoint.current.x,
        y: Math.max(0.2, intersectionPoint.current.y),
        z: intersectionPoint.current.z,
      });
    }
  });

  return null;
};
