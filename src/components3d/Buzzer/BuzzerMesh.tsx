import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const BuzzerMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Cylindrical Black Plastic Housing */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.65, 24]} />
        <meshStandardMaterial color="#171923" roughness={0.6} />
      </mesh>

      {/* Top Acoustic Cavity Hole */}
      <mesh position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.9} />
      </mesh>

      {/* (+) polarity mark label */}
      <mesh position={[-0.28, 0.83, 0]}>
        <boxGeometry args={[0.12, 0.01, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[-0.28, 0.83, 0]}>
        <boxGeometry args={[0.04, 0.01, 0.12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Wire Leads (aligned to x = ±0.25 breadboard holes) */}
      <mesh position={[-0.25, 0.16, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.25, 0.16, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Pins */}
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
