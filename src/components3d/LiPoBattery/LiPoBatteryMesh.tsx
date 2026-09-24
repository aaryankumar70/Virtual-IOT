import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const LiPoBatteryMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Main 3S LiPo Battery Block (Cell Pack) */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.85, 3.2]} />
        <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Blue Top/Side Accent Shrink Band */}
      <mesh position={[0, 0.45, -0.4]}>
        <boxGeometry args={[1.82, 0.86, 1.2]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>

      {/* White Specification Label */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[1.4, 0.01, 2.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.8} />
      </mesh>

      {/* Label Text Print Stripes (Representing 2200mAh 11.1V 3S 45C) */}
      <mesh position={[0, 0.89, -0.4]}>
        <boxGeometry args={[1.1, 0.005, 0.35]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.89, 0.2]}>
        <boxGeometry args={[1.0, 0.005, 0.25]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Discharge Cable Harness (Red 12AWG Silicone) */}
      <mesh position={[-0.3, 0.5, 1.85]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 14]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>

      {/* Discharge Cable Harness (Black 12AWG Silicone) */}
      <mesh position={[0.3, 0.5, 1.85]} rotation={[0.2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 14]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>

      {/* Balance Lead (4 thin multi-colored wires leading to JST-XH connector) */}
      <group position={[-0.5, 0.3, 1.75]} rotation={[0.3, -0.2, 0]}>
        {[-0.06, -0.02, 0.02, 0.06].map((xOff, idx) => (
          <mesh key={idx} position={[xOff, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.5, 10]} />
            <meshStandardMaterial
              color={['#dc2626', '#3b82f6', '#eab308', '#18181b'][idx]}
              roughness={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Render Physical Connectors (XT60 Male, JST-XH Balance) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

      {/* Render Pins */}
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
