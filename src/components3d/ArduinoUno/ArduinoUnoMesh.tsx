import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ArduinoUnoMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* PCB Base (Arduino Blue) */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.86, 0.25, 5.34]} />
        <meshStandardMaterial color="#00878a" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Silkscreen White Label Area */}
      <mesh position={[0, 0.28, -0.4]}>
        <boxGeometry args={[3.2, 0.01, 1.2]} />
        <meshStandardMaterial color="#005c5e" roughness={0.6} />
      </mesh>

      {/* USB-B Port (Metal Silver) */}
      <mesh position={[-2.8, 0.55, -1.6]} castShadow>
        <boxGeometry args={[1.5, 1.1, 1.2]} />
        <meshStandardMaterial color="#c0c5cc" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* DC Barrel Jack (Black Plastic + Silver Core) */}
      <mesh position={[-2.6, 0.55, 1.6]} castShadow>
        <boxGeometry args={[1.6, 1.0, 1.3]} />
        <meshStandardMaterial color="#1a202c" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* ATmega328P DIP IC (Black Chip with Silver Pins) */}
      <mesh position={[0.8, 0.4, 0.8]} castShadow>
        <boxGeometry args={[3.4, 0.35, 0.9]} />
        <meshStandardMaterial color="#171923" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* 16MHz Crystal Oscillator (Silver Oval) */}
      <mesh position={[-0.8, 0.35, -0.5]}>
        <boxGeometry args={[0.9, 0.25, 0.4]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Reset Button (Red/Yellow button on silver base) */}
      <group position={[-2.6, 0.35, -2.1]}>
        <mesh>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#a0aec0" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 12]} />
          <meshStandardMaterial color="#e53e3e" roughness={0.4} />
        </mesh>
      </group>

      {/* Female Header Strips (Top & Bottom Black Plastic Blocks) */}
      {/* Top Header */}
      <mesh position={[0.4, 0.35, -2.2]} castShadow>
        <boxGeometry args={[4.4, 0.4, 0.45]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>
      {/* Bottom Header */}
      <mesh position={[0.4, 0.35, 2.2]} castShadow>
        <boxGeometry args={[4.2, 0.4, 0.45]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* Render All Logical Physical Pins */}
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
