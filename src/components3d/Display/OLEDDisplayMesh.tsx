import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';
import { useOLEDTexture } from './useCanvasScreenTexture';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const OLEDDisplayMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const screenTexture = useOLEDTexture({
    powered: isPowered,
    displayMode: (component.state?.displayMode as string) || 'telemetry',
    textLine1: component.state?.textLine1 as string,
    textLine2: component.state?.textLine2 as string,
    textLine3: component.state?.textLine3 as string,
    color: (component.state?.color as string) || '#38bdf8',
  });

  return (
    <group>
      {/* Blue FR4 Breakout PCB */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.14, 2.7]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>

      {/* Gold Silk Screen Text & Traces */}
      <mesh position={[0, 0.155, 1.1]}>
        <boxGeometry args={[1.8, 0.01, 0.15]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} />
      </mesh>

      {/* 4-Pin Header Base Bar (at top z = -1.0) */}
      <mesh position={[0, 0.18, -1.05]} castShadow>
        <boxGeometry args={[1.2, 0.18, 0.28]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>

      {/* Glass OLED Panel Backing Carrier */}
      <mesh position={[0, 0.18, 0.15]} castShadow>
        <boxGeometry args={[2.45, 0.06, 1.65]} />
        <meshStandardMaterial color="#09090b" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Glowing OLED Active Screen Face */}
      <mesh position={[0, 0.22, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 1.25]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#05070c" />
        )}
      </mesh>

      {/* Glass Surface Reflection Overlay */}
      <mesh position={[0, 0.225, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 1.45]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.35}
          roughness={0.05}
          transmission={0.6}
          thickness={0.05}
          color="#ffffff"
        />
      </mesh>

      {/* SMT Components on PCB (LDO regulator, caps, resistors) */}
      <mesh position={[-0.9, 0.17, -0.6]}>
        <boxGeometry args={[0.2, 0.08, 0.15]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
      <mesh position={[0.9, 0.17, -0.6]}>
        <boxGeometry args={[0.15, 0.06, 0.12]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>

      {/* Subtle Blue Emissive Glow when Powered */}
      {isPowered && (
        <pointLight position={[0, 0.5, 0.15]} intensity={0.4} color="#38bdf8" distance={1.8} />
      )}

      {/* Connectors & Pins */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

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
