import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { useView } from '../../state/view/viewStore';
import { useProject } from '../../state/project/projectStore';
import { activeCameraRef } from './activeCameraRef';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<OrbitControlsType>(null);
  const { camera } = useThree();
  const viewState = useView();
  const projectState = useProject();

  // Expose live active camera reference for outside viewport raycasting (drag-and-drop)
  useEffect(() => {
    activeCameraRef.current = camera;
    return () => {
      activeCameraRef.current = null;
    };
  }, [camera]);

  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 14));
  const isTransitioning = useRef<boolean>(false);

  // When user is actively manipulating transform gizmo or free moving with Shift, disable orbit controls to avoid fighting
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !viewState.isTransforming && !viewState.isFreeMoving;
    }
  }, [viewState.isTransforming, viewState.isFreeMoving]);

  // Handle camera trigger commands (reset, frameAll, focusSelected)
  useEffect(() => {
    if (!viewState.cameraTrigger) return;
    const { action } = viewState.cameraTrigger;

    if (action === 'reset') {
      targetCamPos.current.set(0, 10, 14);
      targetLookAt.current.set(0, 0, 0);
      isTransitioning.current = true;
    } else if (action === 'focusSelected') {
      const selectedId = viewState.selectedComponentIds[0];
      const comp = projectState.components.find((c) => c.id === selectedId);
      if (comp) {
        targetLookAt.current.set(
          comp.transform.position.x,
          comp.transform.position.y,
          comp.transform.position.z
        );
        targetCamPos.current.set(
          comp.transform.position.x,
          comp.transform.position.y + 6,
          comp.transform.position.z + 8
        );
        isTransitioning.current = true;
      }
    } else if (action === 'frameAll') {
      if (projectState.components.length === 0) {
        targetCamPos.current.set(0, 10, 14);
        targetLookAt.current.set(0, 0, 0);
        isTransitioning.current = true;
        return;
      }

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      projectState.components.forEach((c) => {
        minX = Math.min(minX, c.transform.position.x - 3);
        maxX = Math.max(maxX, c.transform.position.x + 3);
        minZ = Math.min(minZ, c.transform.position.z - 3);
        maxZ = Math.max(maxZ, c.transform.position.z + 3);
      });

      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const span = Math.max(maxX - minX, maxZ - minZ, 8);

      targetLookAt.current.set(centerX, 0, centerZ);
      targetCamPos.current.set(centerX, span * 0.9, centerZ + span * 1.1);
      isTransitioning.current = true;
    }
  }, [viewState.cameraTrigger, projectState.components, viewState.selectedComponentIds]);

  useFrame(() => {
    if (isTransitioning.current && controlsRef.current) {
      camera.position.lerp(targetCamPos.current, 0.08);
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetCamPos.current) < 0.05 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.05
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={2}
      maxDistance={70}
      makeDefault
    />
  );
};
