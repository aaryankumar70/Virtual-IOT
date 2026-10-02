import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const CapacitorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* 1. Rubber Bottom Base Stopper / Seal Plug */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* 2. Main Cylindrical Aluminum Canister with Dark Blue Insulating Sleeve */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.27, 0.27, 0.84, 24]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.35} metalness={0.2} />
      </mesh>

      {/* 3. Top Aluminum Metal Vent Cap with Pressure Relief Cross */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.255, 0.255, 0.04, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Vent cross score relief lines */}
      <mesh position={[0, 1.072, 0]}>
        <boxGeometry args={[0.32, 0.005, 0.02]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.072, 0]}>
        <boxGeometry args={[0.02, 0.005, 0.32]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* 4. White / Silver Cathode (-) Polarity Stripe down one side */}
      <mesh position={[0.262, 0.62, 0]}>
        <boxGeometry args={[0.02, 0.82, 0.14]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      {/* Minus symbols on negative stripe */}
      {[-0.22, 0, 0.22].map((yOffset, i) => (
        <mesh key={i} position={[0.274, 0.62 + yOffset, 0]}>
          <boxGeometry args={[0.005, 0.025, 0.07]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {/* 5. Metal Wire Leads (Anode on left is longer, Cathode on right) */}
      {/* Anode (+) Lead */}
      <mesh position={[-0.22, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.44, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Cathode (-) Lead */}
      <mesh position={[0.22, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.38, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Render Connection Pin Receptacles */}
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
