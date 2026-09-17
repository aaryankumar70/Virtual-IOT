import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const LEDMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isLit = Boolean(component.state?.lit);
  const ledColor = (component.state?.color as string) || '#ef4444';

  return (
    <group>
      {/* LED Epoxy Dome Base Rim */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.15, 24]} />
        <meshStandardMaterial
          color={ledColor}
          roughness={0.2}
          metalness={0.1}
          emissive={isLit ? ledColor : '#000000'}
          emissiveIntensity={isLit ? 1.0 : 0.05}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* LED Epoxy Cylinder Body */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 24]} />
        <meshStandardMaterial
          color={ledColor}
          roughness={0.1}
          emissive={isLit ? ledColor : '#000000'}
          emissiveIntensity={isLit ? 1.2 : 0.08}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* LED Rounded Top Dome */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={ledColor}
          roughness={0.1}
          emissive={isLit ? ledColor : '#000000'}
          emissiveIntensity={isLit ? 1.5 : 0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Point light if lit */}
      {isLit && <pointLight color={ledColor} intensity={2} distance={4} position={[0, 1.2, 0]} />}

      {/* Metal Anode (+) Lead (Longer) */}
      <mesh position={[-0.22, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Metal Cathode (-) Lead (Slightly shorter / with flat anvil) */}
      <mesh position={[0.22, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.4, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Render Pins */}
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
