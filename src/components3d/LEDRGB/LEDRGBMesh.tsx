import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const LEDRGBMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const r = (component.state?.r as number) ?? 255;
  const g = (component.state?.g as number) ?? 0;
  const b = (component.state?.b as number) ?? 128;
  const isLit = Boolean(component.state?.lit ?? true);
  const colorStr = `rgb(${r}, ${g}, ${b})`;

  return (
    <group>
      {/* LED Base Epoxy Flange Rim */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.40, 0.15, 24]} />
        <meshStandardMaterial
          color={colorStr}
          roughness={0.15}
          metalness={0.05}
          transparent
          opacity={0.88}
          emissive={isLit ? colorStr : '#000000'}
          emissiveIntensity={isLit ? 0.8 : 0.05}
        />
      </mesh>

      {/* Flat Notch on Flange Rim (Cathode Side Marker) */}
      <mesh position={[-0.1, 0.65, -0.38]}>
        <boxGeometry args={[0.2, 0.14, 0.04]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} transparent opacity={0.5} />
      </mesh>

      {/* Main Diffused Epoxy Cylinder Body */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.5, 24]} />
        <meshStandardMaterial
          color={colorStr}
          roughness={0.1}
          transparent
          opacity={0.85}
          emissive={isLit ? colorStr : '#000000'}
          emissiveIntensity={isLit ? 1.1 : 0.08}
        />
      </mesh>

      {/* Hemispherical Top Dome */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.35, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={colorStr}
          roughness={0.1}
          transparent
          opacity={0.85}
          emissive={isLit ? colorStr : '#000000'}
          emissiveIntensity={isLit ? 1.4 : 0.1}
        />
      </mesh>

      {/* Inner Leadframe Anvils (Visible through diffused dome) */}
      <mesh position={[-0.1, 0.85, 0]}>
        <boxGeometry args={[0.12, 0.25, 0.08]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-0.1, 0.98, 0]}>
        <boxGeometry args={[0.2, 0.08, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Dynamic Point Light when lit */}
      {isLit && (
        <pointLight
          color={colorStr}
          intensity={1.8}
          distance={3.5}
          position={[0, 1.3, 0]}
        />
      )}

      {/* 4 Metal Wire Leads */}
      {/* 1. Red Anode Lead */}
      <mesh position={[-0.3, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 2. Common Cathode (-) Lead (Visibly longer, starts higher in anvil and extends down) */}
      <mesh position={[-0.1, 0.40, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.58, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. Green Anode Lead */}
      <mesh position={[0.1, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 4. Blue Anode Lead */}
      <mesh position={[0.3, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.45, 12]} />
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
