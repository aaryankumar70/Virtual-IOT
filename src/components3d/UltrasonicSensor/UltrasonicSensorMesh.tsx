import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const UltrasonicSensorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Blue FR-4 PCB Substrate */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.5, 2.0, 0.18]} />
        <meshStandardMaterial color="#1e40af" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* 4 Corner Mounting Holes */}
      {[
        [-2.05, 1.75],
        [-2.05, 0.05],
        [2.05, 1.75],
        [2.05, 0.05],
      ].map(([hx, hy], i) => (
        <mesh key={i} position={[hx, hy, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.2, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Silkscreen Brand & Model Text Decal Bar */}
      <mesh position={[0, 1.7, 0.1]}>
        <boxGeometry args={[1.8, 0.22, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>

      {/* Left Ultrasonic Transducer Cylinder - Transmitter 'T' */}
      <group position={[-1.2, 0.95, 0.55]}>
        {/* Aluminum Outer Can */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.78, 0.78, 0.95, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Front Mesh Grille Screen */}
        <mesh position={[0, 0, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.02, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} wireframe={false} />
        </mesh>
        {/* Inner Piezo Ring */}
        <mesh position={[0, 0, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* 'T' Silkscreen Identification Mark */}
        <mesh position={[0, -0.65, -0.45]}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Ultrasonic Transducer Cylinder - Receiver 'R' */}
      <group position={[1.2, 0.95, 0.55]}>
        {/* Aluminum Outer Can */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.78, 0.78, 0.95, 32]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Front Mesh Grille Screen */}
        <mesh position={[0, 0, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.72, 0.72, 0.02, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} wireframe={false} />
        </mesh>
        {/* Inner Piezo Ring */}
        <mesh position={[0, 0, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.03, 24]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
        {/* 'R' Silkscreen Identification Mark */}
        <mesh position={[0, -0.65, -0.45]}>
          <boxGeometry args={[0.2, 0.2, 0.02]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>

      {/* 4.0 MHz HC-49 Metal Crystal Canister */}
      <mesh position={[0, 0.35, 0.18]} castShadow>
        <boxGeometry args={[0.65, 0.28, 0.22]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Surface Mount Processing IC (LM324 Op-Amp) */}
      <mesh position={[0, 0.95, 0.14]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* 4-Pin Male Header Block & Pins */}
      {/* Black Plastic Spacer Shroud */}
      <mesh position={[0, -0.05, 0]} castShadow>
        <boxGeometry args={[1.25, 0.2, 0.25]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* 4 Gold/Silver Header Pins descending from PCB through header to pin coordinates */}
      {[-0.45, -0.15, 0.15, 0.45].map((xPin, idx) => (
        <mesh key={idx} position={[xPin, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.032, 0.35, 12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

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
