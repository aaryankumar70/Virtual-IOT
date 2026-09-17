import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ResistorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Ceramic/Carbon Beige Body */}
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 20]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>

      {/* Body Bulb Ends */}
      <mesh position={[-0.45, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>

      {/* Color Bands (220 Ohm: Red, Red, Brown, Gold) */}
      {/* Band 1: Red */}
      <mesh position={[-0.3, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>
      {/* Band 2: Red */}
      <mesh position={[-0.1, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>
      {/* Band 3: Brown */}
      <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color="#744210" roughness={0.5} />
      </mesh>
      {/* Band 4: Gold (Tolerance) */}
      <mesh position={[0.3, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color="#d69e2e" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Left Wire Lead */}
      <mesh position={[-0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Right Wire Lead */}
      <mesh position={[0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Render Lead Pins */}
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
