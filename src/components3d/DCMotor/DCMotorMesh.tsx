import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const DCMotorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const speed = typeof component.state?.speed === 'number' ? component.state.speed : 0;
  const shaftRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (speed !== 0 && shaftRef.current) {
      shaftRef.current.rotation.z += (speed / 100) * 40 * delta;
    }
  });

  return (
    <group>
      {/* 130 DC Motor Metallic Steel Can */}
      <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 1.8, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Two Flat Sides on the Can */}
      <mesh position={[0, 1.36, 0]}>
        <boxGeometry args={[1.1, 0.08, 1.7]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[1.1, 0.08, 1.7]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Front Bearing Boss & Rotating Brass Shaft */}
      <group position={[0, 0.7, -0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
        </mesh>
        {/* Output Shaft & Pulley */}
        <group ref={shaftRef}>
          <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.8, 14]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Orange Plastic Test Pulley / Spinner */}
          <mesh position={[0, 0, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} />
          </mesh>
          <mesh position={[0.2, 0, -0.66]}>
            <boxGeometry args={[0.1, 0.1, 0.28]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* Rear Plastic Endcap (Red) with Solder Lug Terminals */}
      <group position={[0, 0.7, 0.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.68, 0.68, 0.22, 20]} />
          <meshStandardMaterial color="#dc2626" roughness={0.5} />
        </mesh>
        {/* Brass Solder Lug Terminals (Left & Right) */}
        {[-0.42, 0.42].map((xOff, idx) => (
          <mesh key={idx} position={[xOff, 0, 0.16]}>
            <boxGeometry args={[0.12, 0.22, 0.14]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Connectors & Pins */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

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
