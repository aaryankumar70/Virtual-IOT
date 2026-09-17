import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ESP32Mesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Black PCB Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 5.2]} />
        <meshStandardMaterial color="#171923" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* ESP-WROOM-32 Metal RF Shield */}
      <mesh position={[0, 0.38, -0.6]} castShadow>
        <boxGeometry args={[2.2, 0.28, 2.4]} />
        <meshStandardMaterial color="#d2d6dc" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* PCB Trace Wi-Fi Antenna Gold Section */}
      <mesh position={[0, 0.26, -2.1]}>
        <boxGeometry args={[2.0, 0.04, 0.7]} />
        <meshStandardMaterial color="#b7791f" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Micro-USB Port */}
      <mesh position={[0, 0.35, 2.45]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.7]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left & Right Header Blocks */}
      <mesh position={[-1.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 4.4]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
      </mesh>
      <mesh position={[1.3, 0.3, 0]} castShadow>
        <boxGeometry args={[0.35, 0.3, 4.4]} />
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
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
