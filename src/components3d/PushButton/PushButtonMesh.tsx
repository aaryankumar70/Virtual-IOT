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
      {/* Black Plastic Base */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.3, 0.28, 1.3]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* Metal Retaining Top Plate with Corner Crimp Tabs */}
      <mesh position={[0, 0.33, 0]}>
        <boxGeometry args={[1.22, 0.04, 1.22]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Round Red Tactile Plunger Button */}
      <mesh position={[0, isPressed ? 0.37 : 0.44, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.25, 20]} />
        <meshStandardMaterial color="#e53e3e" roughness={0.5} />
      </mesh>

      {/* 4 Stamped Silver Metal Legs (Gull-wing / breadboard DIP pins) */}
      {[
        { x: -0.65, z: -0.4, side: -1 },
        { x: 0.65, z: -0.4, side: 1 },
        { x: -0.65, z: 0.4, side: -1 },
        { x: 0.65, z: 0.4, side: 1 },
      ].map((leg, idx) => (
        <group key={idx}>
          {/* Horizontal root tab emerging from plastic housing side */}
          <mesh position={[leg.side * 0.62, 0.16, leg.z]} castShadow>
            <boxGeometry args={[0.16, 0.04, 0.09]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Downward bent vertical contact leg leading to breadboard pin */}
          <mesh position={[leg.side * 0.68, 0.09, leg.z]} castShadow>
            <boxGeometry args={[0.04, 0.18, 0.08]} />
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
