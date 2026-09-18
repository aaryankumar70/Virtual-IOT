import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ServoMotorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const angleDeg = typeof component.state?.angle === 'number' ? component.state.angle : 90;
  const angleRad = (angleDeg * Math.PI) / 180;

  return (
    <group>
      {/* Main Blue SG90 Plastic Casing Body */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 1.4, 1.2]} />
        <meshStandardMaterial color="#2563eb" roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Side Mounting Flanges / Tabs with Screw Notches */}
      <group position={[0, 1.4, 0]}>
        {/* Left Flange */}
        <mesh position={[-1.4, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.18, 1.2]} />
          <meshStandardMaterial color="#2563eb" roughness={0.35} />
        </mesh>
        <mesh position={[-1.45, 0.05, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>

        {/* Right Flange */}
        <mesh position={[1.4, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.18, 1.2]} />
          <meshStandardMaterial color="#2563eb" roughness={0.35} />
        </mesh>
        <mesh position={[1.45, 0.05, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.8} />
        </mesh>
      </group>

      {/* Top Raised Gearbox Housing Tier */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.35, 24]} />
        <meshStandardMaterial color="#2563eb" roughness={0.35} />
      </mesh>

      {/* Splined Output Shaft & Rotatable White Nylon Horn */}
      <group position={[0, 2.15, 0]} rotation={[0, angleRad, 0]}>
        {/* Output Splined Boss */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 20]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* White Nylon Horn Cross/Arm */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[1.5, 0.08, 0.32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Secondary Cross Wing */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[0.32, 0.08, 0.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Center Metal Retaining Screw */}
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Side Brand Decal (Tower Pro SG90) */}
      <mesh position={[0, 1.15, 0.605]}>
        <boxGeometry args={[1.6, 0.7, 0.01]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.15, 0.61]}>
        <boxGeometry args={[1.4, 0.25, 0.005]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>

      {/* 3-Wire Cable Stub (Exiting lower casing leading to connector terminal) */}
      <group position={[0, 0.35, 0]}>
        {/* Wire 1: Brown (GND) */}
        <mesh position={[-0.2, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.45, 12]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>

        {/* Wire 2: Red (5V Power) */}
        <mesh position={[0.0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.45, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.6} />
        </mesh>

        {/* Wire 3: Orange (PWM Signal) */}
        <mesh position={[0.2, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.038, 0.45, 12]} />
          <meshStandardMaterial color="#f97316" roughness={0.6} />
        </mesh>

        {/* 3-Pin Female Black DuPont Connector Shroud */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.78, 0.22, 0.28]} />
          <meshStandardMaterial color="#1a202c" roughness={0.7} />
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
