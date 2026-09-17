import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const BreadboardMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Plastic Base Body */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 0.4, 4.2]} />
        <meshStandardMaterial color="#edf2f7" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Center IC Channel / Trough */}
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[7.3, 0.05, 0.35]} />
        <meshStandardMaterial color="#cbd5e0" roughness={0.9} />
      </mesh>

      {/* Top Power Rail Red Line (+) */}
      <mesh position={[0, 0.41, -1.9]}>
        <boxGeometry args={[7.1, 0.01, 0.06]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>
      {/* Top Power Rail Blue Line (-) */}
      <mesh position={[0, 0.41, -1.18]}>
        <boxGeometry args={[7.1, 0.01, 0.06]} />
        <meshStandardMaterial color="#3182ce" roughness={0.5} />
      </mesh>

      {/* Bottom Power Rail Red Line (+) */}
      <mesh position={[0, 0.41, 1.18]}>
        <boxGeometry args={[7.1, 0.01, 0.06]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>
      {/* Bottom Power Rail Blue Line (-) */}
      <mesh position={[0, 0.41, 1.9]}>
        <boxGeometry args={[7.1, 0.01, 0.06]} />
        <meshStandardMaterial color="#3182ce" roughness={0.5} />
      </mesh>

      {/* Notches on sides for interlocking */}
      <mesh position={[-3.8, 0.2, 0]}>
        <boxGeometry args={[0.15, 0.3, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      <mesh position={[3.8, 0.2, 0]}>
        <boxGeometry args={[0.15, 0.3, 1.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>

      {/* Render all logical pin receptacles */}
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
