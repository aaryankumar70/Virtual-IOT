import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const RelayModuleMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isTriggered = Boolean(component.state?.triggered ?? false);
  const isPowered = Boolean(component.state?.powered ?? true);

  return (
    <group>
      {/* Blue FR4 Breakout Board */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.16, 2.6]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>

      {/* Songle 5V Blue Relay Cube */}
      <group position={[-0.7, 0.9, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.9, 1.5, 1.5]} />
          <meshStandardMaterial color="#0284c7" roughness={0.35} />
        </mesh>
        {/* White Songle specification label on top */}
        <mesh position={[0, 0.76, 0]}>
          <boxGeometry args={[1.7, 0.01, 1.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.77, 0]}>
          <boxGeometry args={[1.4, 0.005, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>

      {/* Switching Optocoupler Chip (Black 4-pin) */}
      <mesh position={[0.7, 0.22, -0.4]}>
        <boxGeometry args={[0.45, 0.15, 0.35]} />
        <meshStandardMaterial color="#09090b" roughness={0.5} />
      </mesh>

      {/* Flyback Diode */}
      <mesh position={[0.7, 0.22, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, 0.35, 12]} />
        <meshStandardMaterial color="#18181b" metalness={0.4} />
      </mesh>

      {/* Power LED (Red) */}
      <mesh position={[1.4, 0.2, -0.7]}>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive={isPowered ? '#dc2626' : '#000000'}
          emissiveIntensity={isPowered ? 0.8 : 0.05}
        />
      </mesh>

      {/* Relay Active Relay LED (Green) */}
      <mesh position={[1.4, 0.2, -0.4]}>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive={isTriggered ? '#16a34a' : '#000000'}
          emissiveIntensity={isTriggered ? 0.9 : 0.05}
        />
      </mesh>

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
