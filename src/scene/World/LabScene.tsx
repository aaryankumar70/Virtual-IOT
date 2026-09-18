import React, { useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { InfiniteGrid } from '../Grid/InfiniteGrid';
import { CameraController } from '../Camera/CameraController';
import { ComponentObject } from './ComponentObject';
import { WireRenderer } from './WireRenderer';
import { FreeMoveController } from './FreeMoveController';
import { useProject, projectStore } from '../../state/project/projectStore';
import { useView, viewStore, DragPreviewState } from '../../state/view/viewStore';
import { ComponentRegistry } from '../../core/registry/ComponentRegistry';
import { THEME } from '../../utils/theme';

const DragGhostPreview: React.FC<{ preview: DragPreviewState }> = ({ preview }) => {
  const def = ComponentRegistry.get(preview.type);
  const width = def?.dimensions?.width || 2;
  const height = def?.dimensions?.height || 0.4;
  const depth = def?.dimensions?.depth || 2;

  return (
    <group position={[preview.worldPos.x, 0, preview.worldPos.z]}>
      {/* Ground Footprint Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[Math.max(width, depth) * 0.45, Math.max(width, depth) * 0.52, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Ghost Bounding Box */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.35}
          roughness={0.3}
          metalness={0.1}
          emissive="#2563eb"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
};

export const LabScene: React.FC = () => {
  const projectState = useProject();
  const viewState = useView();
  const { raycaster } = useThree();

  // Raycasting on workbench plane for live wire dragging and background clicks
  const groundPlaneRef = useRef<THREE.Mesh>(null);

  // Live wire & connector cable dragging preview follows cursor and snaps to hovered targets
  useFrame(() => {
    if (viewState.activeWiring) {
      if (viewState.hoveredPin) {
        const pinPos = projectStore.getPinWorldPosition(
          viewState.hoveredPin.componentId,
          viewState.hoveredPin.pinId
        );
        if (pinPos) {
          viewStore.updateWiringPreview({
            x: pinPos.x,
            y: pinPos.y,
            z: pinPos.z,
          });
          return;
        }
      }

      // Find intersection on workbench y = 0.4 plane
      const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeY, intersectionPoint);

      if (intersectionPoint) {
        viewStore.updateWiringPreview({
          x: intersectionPoint.x,
          y: Math.max(0.35, intersectionPoint.y),
          z: intersectionPoint.z,
        });
      }
    }

    if (viewState.activeConnectorWiring) {
      if (viewState.hoveredConnector) {
        const connPos = projectStore.getEndpointWorldPosition(
          viewState.hoveredConnector.componentId,
          viewState.hoveredConnector.connectorId
        );
        if (connPos) {
          viewStore.updateConnectorWiring({
            x: connPos.x,
            y: connPos.y,
            z: connPos.z,
          });
          return;
        }
      }

      const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4);
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(planeY, intersectionPoint);

      if (intersectionPoint) {
        viewStore.updateConnectorWiring({
          x: intersectionPoint.x,
          y: Math.max(0.35, intersectionPoint.y),
          z: intersectionPoint.z,
        });
      }
    }
  });

  const handleGroundPointerDown = (e: any) => {
    // Left click on empty space deselects or cancels wiring
    if (e.button === 0) {
      if (viewState.activeWiring) {
        viewStore.cancelWiring();
      } else if (viewState.activeConnectorWiring) {
        viewStore.cancelConnectorWiring();
      } else if (!viewState.isFreeMoving) {
        viewStore.clearSelection();
      }
    }
  };

  const handleGroundContextMenu = (e: any) => {
    e.stopPropagation();
    viewStore.setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const isLight = viewState.theme === 'light';

  return (
    <>
      {/* Engineering Lighting */}
      <color attach="background" args={[isLight ? '#f8fafc' : '#05070a']} />
      <ambientLight intensity={isLight ? 0.75 : 0.5} color={isLight ? '#ffffff' : '#c9d3e0'} />
      <directionalLight
        position={[10, 18, 12]}
        intensity={isLight ? 1.4 : 1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-10, 12, -10]}
        intensity={isLight ? 0.45 : 0.35}
        color={isLight ? '#94a3b8' : '#718096'}
      />
      <hemisphereLight
        args={[
          isLight ? '#ffffff' : '#2b394e',
          isLight ? '#e2e8f0' : '#0b0f17',
          isLight ? 0.5 : 0.4,
        ]}
      />

      {/* Solid Workbench Surface beneath grid */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={isLight ? THEME.bg.workbenchLight : THEME.bg.workbenchDark}
          roughness={0.85}
          metalness={0.04}
        />
      </mesh>

      {/* Ground Contact Shadows for realistic depth */}
      <ContactShadows
        position={[0, -0.005, 0]}
        opacity={isLight ? 0.38 : 0.65}
        scale={60}
        blur={1.6}
        far={6}
        resolution={1024}
        color={isLight ? '#1e293b' : '#000000'}
      />

      {/* Infinite Grid Workbench */}
      <InfiniteGrid />

      {/* Drag & Drop Ghost Preview */}
      {viewState.dragPreview && <DragGhostPreview preview={viewState.dragPreview} />}

      {/* Invisible Interactive Ground Plane for raycasting & deselect */}
      <mesh
        ref={groundPlaneRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerDown={handleGroundPointerDown}
        onContextMenu={handleGroundContextMenu}
      >
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Free Move Object with Cursor Controller (Shift + move) */}
      <FreeMoveController />

      {/* All Circuit Hardware Components */}
      {projectState.components.map((component) => (
        <ComponentObject
          key={component.id}
          component={component}
        />
      ))}

      {/* Dynamic Catenary Wires */}
      <WireRenderer />

      {/* Camera Controls & Navigation */}
      <CameraController />
    </>
  );
};
