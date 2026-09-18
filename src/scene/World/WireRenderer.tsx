import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Connection } from '../../core/connections/Connection';
import { useProject, projectStore } from '../../state/project/projectStore';
import { useView, viewStore } from '../../state/view/viewStore';
import { THEME } from '../../utils/theme';

interface SingleWireProps {
  connection: Connection;
}

const SingleConnection: React.FC<SingleWireProps> = React.memo(({ connection }) => {
  const projectState = useProject();
  const viewState = useView();

  const isSelected = viewState.selectedConnectionId === connection.id;

  // DERIVE ENDPOINTS DYNAMICALLY FROM COMPONENT TRANSFORM + ENDPOINT LOCAL POSITION
  const { p1, p2, curveGeometry, connType } = useMemo(() => {
    const srcId = connection.source.interfaceId || connection.source.pinId || '';
    const tgtId = connection.target.interfaceId || connection.target.pinId || '';

    const start =
      projectStore.getEndpointWorldPosition(connection.source.componentId, srcId) ||
      projectStore.getPinWorldPosition(connection.source.componentId, srcId);

    const end =
      projectStore.getEndpointWorldPosition(connection.target.componentId, tgtId) ||
      projectStore.getPinWorldPosition(connection.target.componentId, tgtId);

    if (!start || !end) return { p1: null, p2: null, curveGeometry: null, connType: 'wire' };

    const distance = start.distanceTo(end);
    if (distance < 0.03) return { p1: null, p2: null, curveGeometry: null, connType: 'wire' };

    const type = connection.type || 'wire';

    // Different arching behaviors per connection type
    let midHeight = 0.4;
    let radius = 0.038;

    if (type === 'usb') {
      // Heavier, lower drape for shielded USB cable
      midHeight = Math.min(1.4, Math.max(0.2, distance * 0.18));
      radius = isSelected ? 0.065 : 0.052;
    } else if (type === 'dc-power') {
      // Smooth flexible DC cord
      midHeight = Math.min(1.5, Math.max(0.25, distance * 0.22));
      radius = isSelected ? 0.058 : 0.046;
    } else if (type === 'header') {
      // Tidy ribbon arc
      midHeight = Math.min(1.2, Math.max(0.2, distance * 0.2));
      radius = isSelected ? 0.052 : 0.04;
    } else if (type === 'breadboard') {
      // Snug jumper arch
      midHeight = Math.min(1.6, Math.max(0.35, distance * 0.26));
      radius = isSelected ? 0.048 : 0.036;
    } else {
      // Wire catenary arc
      midHeight = Math.min(2.0, Math.max(0.4, distance * 0.28));
      radius = isSelected ? 0.055 : 0.038;
    }

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
    const geometry = new THREE.TubeGeometry(curve, 32, radius, 8, false);

    return { p1: start, p2: end, curveGeometry: geometry, connType: type };
  }, [
    projectState.components, // automatically recomputes whenever any component transform moves
    connection.source,
    connection.target,
    connection.type,
    isSelected,
  ]);

  if (!p1 || !p2 || !curveGeometry) return null;

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

  // Visual styling based on connection type
  let jacketColor = connection.color || THEME.accent.primary;
  let emissiveColor = isSelected ? THEME.accent.primary : jacketColor;
  let metalness = 0.2;
  let roughness = 0.3;

  if (connType === 'usb') {
    jacketColor = isSelected ? THEME.accent.hover : '#1e293b';
    metalness = 0.1;
    roughness = 0.6;
  } else if (connType === 'dc-power') {
    jacketColor = isSelected ? THEME.accent.hover : '#09090b';
    metalness = 0.1;
    roughness = 0.7;
  } else if (connType === 'header') {
    jacketColor = isSelected ? THEME.accent.hover : (connection.color || '#a855f7');
    roughness = 0.4;
  }

  return (
    <group>
      {/* Interactive Cable / Wire Tube */}
      <mesh
        geometry={curveGeometry}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <meshStandardMaterial
          color={jacketColor}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.6 : connType === 'usb' ? 0.05 : 0.25}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Terminal collars / Plug sleeves at both endpoints */}
      {connType === 'usb' ? (
        <>
          {/* USB Molded Overmold Plugs */}
          <mesh position={[p1.x, p1.y, p1.z]}>
            <boxGeometry args={[0.18, 0.12, 0.24]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          <mesh position={[p2.x, p2.y, p2.z]}>
            <boxGeometry args={[0.18, 0.12, 0.24]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
        </>
      ) : connType === 'dc-power' ? (
        <>
          {/* Barrel Plug Sleeves */}
          <mesh position={[p1.x, p1.y, p1.z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.28, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
          <mesh position={[p2.x, p2.y, p2.z]}>
            <cylinderGeometry args={[0.1, 0.1, 0.28, 12]} />
            <meshStandardMaterial color="#18181b" roughness={0.5} />
          </mesh>
        </>
      ) : connType === 'header' ? (
        <>
          {/* DuPont Rectangular Housings */}
          <mesh position={[p1.x, p1.y, p1.z]}>
            <boxGeometry args={[0.14, 0.22, 0.14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          <mesh position={[p2.x, p2.y, p2.z]}>
            <boxGeometry args={[0.14, 0.22, 0.14]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
        </>
      ) : (
        <>
          {/* Standard Wire Terminal Collars */}
          <mesh position={[p1.x, p1.y, p1.z]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[p2.x, p2.y, p2.z]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
});

/**
 * Preview wire shown while the user is in the middle of dragging a new wire or cable
 */
const ActiveWirePreview: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const activeWiring = viewState.activeWiring;
  const activeConnectorWiring = viewState.activeConnectorWiring;

  const active = activeWiring || activeConnectorWiring;
  const isConnector = !!activeConnectorWiring;

  const { p1, curveGeometry } = useMemo(() => {
    if (!active) return { p1: null, curveGeometry: null };

    const compId = activeWiring
      ? activeWiring.sourceComponentId
      : activeConnectorWiring?.sourceComponentId || '';
    const interfaceId = activeWiring
      ? activeWiring.sourcePinId
      : activeConnectorWiring?.sourceConnectorId || '';

    const start =
      projectStore.getEndpointWorldPosition(compId, interfaceId) ||
      projectStore.getPinWorldPosition(compId, interfaceId);

    if (!start) return { p1: null, curveGeometry: null };

    const end = new THREE.Vector3(
      active.currentWorldPos.x,
      active.currentWorldPos.y,
      active.currentWorldPos.z
    );

    const distance = start.distanceTo(end);
    if (distance < 0.04) {
      return { p1: start, curveGeometry: null };
    }

    const midHeight = Math.min(1.5, Math.max(0.3, distance * 0.24));

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
    const geometry = new THREE.TubeGeometry(curve, 24, isConnector ? 0.055 : 0.042, 8, false);

    return { p1: start, curveGeometry: geometry };
  }, [active, activeWiring, activeConnectorWiring, projectState.components, isConnector]);

  if (!active || !p1) return null;

  const previewColor = isConnector ? '#38bdf8' : THEME.accent.hover;

  return (
    <group>
      {curveGeometry && (
        <mesh geometry={curveGeometry}>
          <meshStandardMaterial
            color={previewColor}
            emissive={previewColor}
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
          active.currentWorldPos.x,
          active.currentWorldPos.y,
          active.currentWorldPos.z,
        ]}
      >
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color={previewColor} emissive={previewColor} />
      </mesh>
    </group>
  );
};

export const WireRenderer: React.FC = () => {
  const projectState = useProject();

  return (
    <group>
      {projectState.connections.map((connection) => (
        <SingleConnection key={connection.id} connection={connection} />
      ))}
      <ActiveWirePreview />
    </group>
  );
};
