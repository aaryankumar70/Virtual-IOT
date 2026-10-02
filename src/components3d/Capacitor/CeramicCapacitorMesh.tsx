import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const CeramicCapacitorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* 1. Ceramic Disc Body (Amber / Caramel coated disc) */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.12, 24]} />
        <meshStandardMaterial color="#d97706" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Rounded edges for realistic dipped epoxy ceramic bead */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.275, 20, 16]} />
        <meshStandardMaterial color="#d97706" roughness={0.55} />
      </mesh>

      {/* Value Marking "104" (Black silkscreen marking pad) */}
      <mesh position={[0, 0.55, 0.085]}>
        <boxGeometry args={[0.18, 0.07, 0.005]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>

      {/* 2. Parallel Wire Leads */}
      {/* Lead 1 */}
      <mesh position={[-0.25, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.42, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lead 2 */}
      <mesh position={[0.25, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.42, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Render Connection Pin Receptacles */}
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
