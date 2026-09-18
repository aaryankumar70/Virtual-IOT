import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const TemperatureSensorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* TO-92 Molded Plastic Package Body */}
      <group position={[0, 0.7, 0]}>
        {/* Curved Back Half-Cylinder */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.55, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.15} />
        </mesh>

        {/* Flat Front Face Block */}
        <mesh position={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[0.56, 0.55, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.15} />
        </mesh>

        {/* Rounded Top Cap */}
        <mesh position={[0, 0.27, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.27, 0.28, 0.04, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>

        {/* Laser Engraved Silkscreen Part Label on Flat Front (TMP36) */}
        <mesh position={[0, 0.05, 0.135]}>
          <boxGeometry args={[0.38, 0.12, 0.005]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.1, 0.135]}>
          <boxGeometry args={[0.3, 0.08, 0.005]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
      </group>

      {/* 3 Visible Bent Metal Leads (Silver metal cylinders descending to pins) */}
      {/* 1. Left Lead (Vs / VCC - Pin 1): emerges at x=-0.1, splays out to x=-0.25 */}
      <group>
        {/* Upper angled segment */}
        <mesh position={[-0.17, 0.36, 0]} rotation={[0, 0, 0.45]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lower vertical segment to pin */}
        <mesh position={[-0.25, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 2. Middle Lead (Vout - Pin 2): straight center drop to x=0.0 */}
      <mesh position={[0.0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. Right Lead (GND - Pin 3): emerges at x=0.1, splays out to x=0.25 */}
      <group>
        {/* Upper angled segment */}
        <mesh position={[0.17, 0.36, 0]} rotation={[0, 0, -0.45]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lower vertical segment to pin */}
        <mesh position={[0.25, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

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
