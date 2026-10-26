import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const PushButtonMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPressed = Boolean(component.state?.pressed);

  return (
    <group>
      {/* Black Plastic Base (6x6mm tactile housing sized for breadboard trough) */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.56, 0.22, 0.56]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* Metal Retaining Top Plate with Corner Crimp Tabs */}
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.52, 0.03, 0.52]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Round Red Tactile Plunger Button */}
      <mesh position={[0, isPressed ? 0.35 : 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.16, 20]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>

      {/* 4 Stamped Silver Metal Legs aligned to breadboard holes (x = ±0.25, z = ±0.22) */}
      {[
        { x: -0.25, z: -0.22, side: -1 },
        { x: 0.25, z: -0.22, side: 1 },
        { x: -0.25, z: 0.22, side: -1 },
        { x: 0.25, z: 0.22, side: 1 },
      ].map((leg, idx) => (
        <group key={idx}>
          {/* Downward bent vertical contact leg leading directly to breadboard hole */}
          <mesh position={[leg.x, 0.12, leg.z]} castShadow>
            <boxGeometry args={[0.04, 0.16, 0.04]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Corner Mounting Pins */}
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
