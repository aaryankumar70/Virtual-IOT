import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';
import { useTM1637Texture } from './useCanvasScreenTexture';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const TM1637SegmentMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const digits = (component.state?.digits as string) || '12:34';
  const colon = component.state?.colon !== false;
  const color = (component.state?.color as 'red' | 'green' | 'blue' | 'amber') || 'red';

  const screenTexture = useTM1637Texture({
    powered: isPowered,
    digits,
    colon,
    color,
  });

  const glowColor =
    color === 'green'
      ? '#22c55e'
      : color === 'blue'
      ? '#38bdf8'
      : color === 'amber'
      ? '#f59e0b'
      : '#ef4444';

  return (
    <group>
      {/* Red FR4 Breakout Motherboard PCB */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.16, 2.4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.4} />
      </mesh>

      {/* 4 M2 Mounting Holes with plated rings */}
      {[
        [-1.9, -1.0],
        [1.9, -1.0],
        [-1.9, 1.0],
        [1.9, 1.0],
      ].map(([hx, hz], idx) => (
        <mesh key={idx} position={[hx, 0.165, hz]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
        </mesh>
      ))}

      {/* 4-Pin Right Header Base Block at x = 1.85 */}
      <mesh position={[1.85, 0.22, 0]} castShadow>
        <boxGeometry args={[0.26, 0.22, 1.1]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>

      {/* 4-Digit 0.36" LED Housing Shell (Raised black plastic enclosure) */}
      <mesh position={[-0.2, 0.45, 0]} castShadow>
        <boxGeometry args={[3.2, 0.65, 1.65]} />
        <meshStandardMaterial color="#18181b" roughness={0.5} />
      </mesh>

      {/* Tinted Acrylic Filter Face */}
      <mesh position={[-0.2, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.05, 1.5]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#0a0a0f" />
        )}
      </mesh>

      {/* Glossy Front Protective Lens Cover */}
      <mesh position={[-0.2, 0.785, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.1, 1.55]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.3}
          roughness={0.08}
          transmission={0.8}
          thickness={0.06}
          color="#ffffff"
        />
      </mesh>

      {/* TM1637 SOP-20 Driver IC on Underside of PCB */}
      <mesh position={[0, -0.12, 0]} castShadow>
        <boxGeometry args={[1.4, 0.12, 0.8]} />
        <meshStandardMaterial color="#09090b" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Emissive LED Light Radiating into Room */}
      {isPowered && (
        <pointLight position={[-0.2, 1.1, 0]} intensity={0.5} color={glowColor} distance={2.0} />
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
