import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Connection } from '../../core/connections/Connection';
import { useProject, projectStore } from '../../state/project/projectStore';
import { useView, viewStore } from '../../state/view/viewStore';
import { THEME } from '../../utils/theme';

interface SingleWireProps {
  connection: Connection;
}

const SingleWire: React.FC<SingleWireProps> = React.memo(({ connection }) => {
  const projectState = useProject();
  const viewState = useView();

  const isSelected = viewState.selectedConnectionId === connection.id;

  // DERIVE ENDPOINTS DYNAMICALLY FROM COMPONENT TRANSFORM + PIN LOCAL POSITION
  const { p1, p2, curveGeometry } = useMemo(() => {
    const start = projectStore.getPinWorldPosition(
      connection.source.componentId,
      connection.source.pinId
    );
    const end = projectStore.getPinWorldPosition(
      connection.target.componentId,
      connection.target.pinId
    );

    if (!start || !end) return { p1: null, p2: null, curveGeometry: null };

    const distance = start.distanceTo(end);
    if (distance < 0.05) return { p1: null, p2: null, curveGeometry: null };

    // Wire catenary arc: arches naturally upward based on distance
    const midHeight = Math.min(2.0, Math.max(0.4, distance * 0.28));
    const midX = (start.x + end.x) / 2;
    const midZ = (start.z + end.z) / 2;
    const midY = Math.max(start.y, end.y) + midHeight;

    const control1 = new THREE.Vector3(
      start.x * 0.7 + end.x * 0.3,
      start.y + midHeight * 0.9,
      start.z * 0.7 + end.z * 0.3
    );
    const control2 = new THREE.Vector3(
      start.x * 0.3 + end.x * 0.7,
      end.y + midHeight * 0.9,
      start.z * 0.3 + end.z * 0.7
    );

    const curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
    const geometry = new THREE.TubeGeometry(curve, 28, isSelected ? 0.055 : 0.038, 8, false);

    return { p1: start, p2: end, curveGeometry: geometry };
  }, [
    projectState.components, // automatically recomputes whenever any component transform moves
    connection.source,
    connection.target,
    isSelected,
  ]);

  if (!p1 || !p2 || !curveGeometry) return null;

  const wireColor = connection.color || THEME.accent.primary;

  const handleClick = (e: any) => {
    e.stopPropagation();
    viewStore.selectConnection(connection.id);
  };

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    viewStore.setContextMenu({
      x: e.clientX,
      y: e.clientY,
      connectionId: connection.id,
    });
  };

  return (
    <group>
      {/* Interactive Wire Tube */}
      <mesh
        geometry={curveGeometry}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <meshStandardMaterial
          color={isSelected ? THEME.accent.hover : wireColor}
          emissive={isSelected ? THEME.accent.primary : wireColor}
          emissiveIntensity={isSelected ? 0.6 : 0.25}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Terminal collars at both endpoints */}
      <mesh position={[p1.x, p1.y, p1.z]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[p2.x, p2.y, p2.z]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
});

/**
 * Preview wire shown while the user is in the middle of dragging a new wire
 */
const ActiveWirePreview: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const activeWiring = viewState.activeWiring;

  const { p1, curveGeometry } = useMemo(() => {
    if (!activeWiring) return { p1: null, curveGeometry: null };

    const start = projectStore.getPinWorldPosition(
      activeWiring.sourceComponentId,
      activeWiring.sourcePinId
    );
    if (!start) return { p1: null, curveGeometry: null };

    const end = new THREE.Vector3(
      activeWiring.currentWorldPos.x,
      activeWiring.currentWorldPos.y,
      activeWiring.currentWorldPos.z
    );

    const distance = start.distanceTo(end);
    if (distance < 0.05) {
      return { p1: start, curveGeometry: null };
    }

    const midHeight = Math.min(1.5, Math.max(0.3, distance * 0.25));

    const control1 = new THREE.Vector3(
      start.x * 0.7 + end.x * 0.3,
      start.y + midHeight,
      start.z * 0.7 + end.z * 0.3
    );
    const control2 = new THREE.Vector3(
      start.x * 0.3 + end.x * 0.7,
      end.y + midHeight * 0.6,
      start.z * 0.3 + end.z * 0.7
    );

    const curve = new THREE.CubicBezierCurve3(start, control1, control2, end);
    const geometry = new THREE.TubeGeometry(curve, 20, 0.045, 8, false);

    return { p1: start, curveGeometry: geometry };
  }, [activeWiring, projectState.components]);

  if (!activeWiring || !p1) return null;

  return (
    <group>
      {curveGeometry && (
        <mesh geometry={curveGeometry}>
          <meshStandardMaterial
            color={THEME.accent.hover}
            emissive={THEME.accent.primary}
            emissiveIntensity={0.65}
            roughness={0.2}
            transparent
            opacity={0.92}
          />
        </mesh>
      )}
      {/* End pointer sphere / beacon */}
      <mesh
        position={[
          activeWiring.currentWorldPos.x,
          activeWiring.currentWorldPos.y,
          activeWiring.currentWorldPos.z,
        ]}
      >
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={THEME.accent.hover} emissive={THEME.accent.primary} />
      </mesh>
    </group>
  );
};

export const WireRenderer: React.FC = () => {
  const projectState = useProject();

  return (
    <group>
      {projectState.connections.map((connection) => (
        <SingleWire key={connection.id} connection={connection} />
      ))}
      <ActiveWirePreview />
    </group>
  );
};
