import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const MPU6050Mesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);

  return (
    <group>
      {/* Blue FR4 Breakout Board */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.1, 0.14, 1.6]} />
        <meshStandardMaterial color="#1e40af" roughness={0.4} />
      </mesh>

      {/* MPU-6050 QFN Sensor IC */}
      <mesh position={[-0.2, 0.18, 0]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#09090b" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Power LED (Red) */}
      <mesh position={[0.6, 0.17, -0.45]}>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive={isPowered ? '#dc2626' : '#000000'}
          emissiveIntensity={isPowered ? 0.8 : 0.05}
        />
      </mesh>

      {/* 3.3V Low-Dropout Voltage Regulator */}
      <mesh position={[0.5, 0.16, 0.2]}>
        <boxGeometry args={[0.25, 0.08, 0.2]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* 8-Pin Header Spacer */}
      <mesh position={[0, 0.14, 0.65]}>
        <boxGeometry args={[2.0, 0.16, 0.22]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
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
