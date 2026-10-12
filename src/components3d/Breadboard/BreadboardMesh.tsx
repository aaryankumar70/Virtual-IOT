import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { useView } from '../../state/view/viewStore';
import { useBreadboardTexture } from './useBreadboardTexture';
import {
  BREADBOARD_PITCH_X,
  BREADBOARD_X_OFFSET,
  BREADBOARD_ROW_Z,
} from '../../utils/breadboardSnap';

interface BreadboardMeshProps {
  component: VirtualComponent;
}

export const BreadboardMesh: React.FC<BreadboardMeshProps> = ({ component }) => {
  const viewState = useView();
  const breadboardTexture = useBreadboardTexture();

  // Check if breadboard is currently targeted during drag-and-drop
  const isDropTarget = useMemo(() => {
    return (
      viewState.breadboardSnapTarget?.breadboardId === component.id ||
      (viewState.dragPreview &&
        Math.abs(viewState.dragPreview.worldPos.x - component.transform.position.x) <= 4.2 &&
        Math.abs(viewState.dragPreview.worldPos.z - component.transform.position.z) <= 2.2)
    );
  }, [viewState.breadboardSnapTarget, viewState.dragPreview, component.transform.position]);

  // Identify currently active/hovered electrical row group to show internal conductive bus bar
  const activeElectricalGroup = useMemo(() => {
    const activeTarget = viewState.activeWiring?.snappedTarget || viewState.hoveredPin;
    if (!activeTarget || activeTarget.componentId !== component.id) return null;

    const pid = activeTarget.pinId;
    if (pid.startsWith('rail_top_plus')) {
      return { type: 'rail', z: BREADBOARD_ROW_Z['rail_top_plus'], color: '#ef4444', label: 'Top Power Rail (+)' };
    }
    if (pid.startsWith('rail_top_minus')) {
      return { type: 'rail', z: BREADBOARD_ROW_Z['rail_top_minus'], color: '#3b82f6', label: 'Top Ground Rail (-)' };
    }
    if (pid.startsWith('rail_bot_plus')) {
      return { type: 'rail', z: BREADBOARD_ROW_Z['rail_bot_plus'], color: '#ef4444', label: 'Bottom Power Rail (+)' };
    }
    if (pid.startsWith('rail_bot_minus')) {
      return { type: 'rail', z: BREADBOARD_ROW_Z['rail_bot_minus'], color: '#3b82f6', label: 'Bottom Ground Rail (-)' };
    }

    const match = pid.match(/^row_(\d+)_([a-j])$/i);
    if (match) {
      const col = parseInt(match[1], 10);
      const letter = match[2].toLowerCase();
      const isTop = ['a', 'b', 'c', 'd', 'e'].includes(letter);
      const colX = BREADBOARD_X_OFFSET + (col - 1) * BREADBOARD_PITCH_X;
      const centerZ = isTop ? -0.475 : 0.475;
      const lengthZ = 0.85;

      return {
        type: 'row',
        col,
        isTop,
        colX,
        centerZ,
        lengthZ,
        color: '#38bdf8',
        label: `Row ${col} (Bank ${isTop ? 'A-E' : 'F-J'})`,
      };
    }

    return null;
  }, [viewState.activeWiring?.snappedTarget, viewState.hoveredPin, component.id]);

  return (
    <group>
      {/* 1. Off-white ABS Molded Plastic Main Body with Silkscreen Canvas Texture */}
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.4, 0.42, 4.2]} />
        <meshStandardMaterial
          map={breadboardTexture || undefined}
          color={breadboardTexture ? '#ffffff' : '#f8fafc'}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Drop Target Active Boundary Glow Halo */}
      {isDropTarget && (
        <mesh position={[0, 0.426, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.46, 4.26]} />
          <meshBasicMaterial
            color="#10b981"
            wireframe
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 2. Central IC DIP Divider Trough / Channel (Physical 3D Recessed Slot) */}
      <mesh position={[0, 0.412, 0]}>
        <boxGeometry args={[8.0, 0.038, 0.34]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* 3. Longitudinal Power Rail Separation Grooves */}
      {/* Top separator groove */}
      <mesh position={[0, 0.418, -1.12]}>
        <boxGeometry args={[8.0, 0.015, 0.045]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      {/* Bottom separator groove */}
      <mesh position={[0, 0.418, 1.12]}>
        <boxGeometry args={[8.0, 0.015, 0.045]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* 4. Active Internal Electrical Row / Bus Bar Visualization */}
      {activeElectricalGroup && activeElectricalGroup.type === 'row' && (
        <group position={[activeElectricalGroup.colX, 0.425, activeElectricalGroup.centerZ]}>
          {/* Conductive Phosphor-Bronze Spring Clip Illuminated Highlight */}
          <mesh>
            <boxGeometry args={[0.22, 0.005, activeElectricalGroup.lengthZ]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.85}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      )}

      {activeElectricalGroup && activeElectricalGroup.type === 'rail' && (
        <group position={[0, 0.425, activeElectricalGroup.z]}>
          {/* Full-Length Power Rail Bus Bar Illuminated Highlight */}
          <mesh>
            <boxGeometry args={[7.8, 0.005, 0.2]} />
            <meshStandardMaterial
              color={activeElectricalGroup.color}
              emissive={activeElectricalGroup.color}
              emissiveIntensity={0.7}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      )}

      {/* 5. Drop Target Insertion Rings (Shows where leads will plug in during drag) */}
      {isDropTarget && viewState.breadboardSnapTarget?.targetHoles && (
        <group>
          {viewState.breadboardSnapTarget.targetHoles.map((target, idx) => {
            const relX = target.worldPos.x - component.transform.position.x;
            const relZ = target.worldPos.z - component.transform.position.z;
            return (
              <group key={idx} position={[relX, 0.44, relZ]}>
                {/* Glowing target ring on breadboard hole */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.08, 0.16, 24]} />
                  <meshBasicMaterial
                    color="#10b981"
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Center insertion bullseye dot */}
                <mesh position={[0, 0.01, 0]}>
                  <sphereGeometry args={[0.04, 12, 12]} />
                  <meshBasicMaterial color="#34d399" />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* 6. Dovetail Interlocking Side Tabs (Right) and Receiving Slots (Left) */}
      {/* Right protruding male dovetail tabs */}
      <mesh position={[4.28, 0.21, -0.9]} castShadow>
        <boxGeometry args={[0.18, 0.32, 0.55]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[4.28, 0.21, 0.9]} castShadow>
        <boxGeometry args={[0.18, 0.32, 0.55]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Left receiving female dovetail slots */}
      <mesh position={[-4.26, 0.21, -0.9]}>
        <boxGeometry args={[0.14, 0.34, 0.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[-4.26, 0.21, 0.9]}>
        <boxGeometry args={[0.14, 0.34, 0.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* 7. All Logical Pin Receptacles with Interactive Click & Magnetic Snapping */}
      {component.pins.map((pin) => (
        <PinMesh
          key={pin.id}
          pin={pin}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};
