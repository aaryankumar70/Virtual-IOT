import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ArduinoNanoMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);

  return (
    <group>
      {/* Blue FR4 PCB Base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 0.16, 1.8]} />
        <meshStandardMaterial color="#00878a" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Mini-USB Metal Shell on Front Edge */}
      <group position={[-1.9, 0.22, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.28, 0.7]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[-0.4, 0, 0]}>
          <boxGeometry args={[0.05, 0.14, 0.5]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
      </group>

      {/* ATmega328P TQFP-32 Microcontroller Chip */}
      <mesh position={[0.4, 0.22, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.7]} />
        <meshStandardMaterial color="#171923" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* 16MHz Crystal Resonator (Silver rectangle) */}
      <mesh position={[-0.6, 0.2, 0.4]}>
        <boxGeometry args={[0.4, 0.1, 0.25]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Center Reset Tactile Switch */}
      <group position={[-0.5, 0.22, -0.2]}>
        <mesh>
          <boxGeometry args={[0.35, 0.14, 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.1, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
      </group>

      {/* 4 Status LEDs (PWR, L, TX, RX) */}
      {[-0.3, -0.1, 0.1, 0.3].map((zOff, i) => (
        <mesh key={i} position={[1.4, 0.2, zOff]}>
          <boxGeometry args={[0.12, 0.04, 0.08]} />
          <meshStandardMaterial
            color={i === 0 ? '#22c55e' : i === 1 ? '#eab308' : '#3b82f6'}
            emissive={
              isPowered
                ? i === 0
                  ? '#16a34a'
                  : i === 1
                  ? '#ca8a04'
                  : '#2563eb'
                : '#000000'
            }
            emissiveIntensity={isPowered ? 0.8 : 0.05}
          />
        </mesh>
      ))}

      {/* Header Pin Strips (Dual 15-pin Rows at Z = -0.75 and Z = +0.75) */}
      {[-0.75, 0.75].map((zPos, rowIdx) => (
        <group key={rowIdx} position={[0, 0.1, zPos]}>
          {/* Black plastic spacer block */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[3.8, 0.14, 0.22]} />
            <meshStandardMaterial color="#18181b" roughness={0.7} />
          </mesh>
        </group>
      ))}

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
