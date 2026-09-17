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
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.75, 24]} />
        <meshStandardMaterial color="#171923" roughness={0.6} />
      </mesh>

      {/* Top Acoustic Cavity Hole */}
      <mesh position={[0, 0.83, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
        <meshStandardMaterial color="#000000" roughness={0.9} />
      </mesh>

      {/* (+) polarity mark label */}
      <mesh position={[-0.4, 0.83, 0]}>
        <boxGeometry args={[0.15, 0.01, 0.05]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[-0.4, 0.83, 0]}>
        <boxGeometry args={[0.05, 0.01, 0.15]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* Wire Leads */}
      <mesh position={[-0.4, 0.15, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.3, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.4, 0.15, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.3, 12]} />
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
