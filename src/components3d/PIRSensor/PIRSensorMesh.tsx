import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const PIRSensorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Green Sensor PCB */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.16, 2.4]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} />
      </mesh>

      {/* Hemispherical White Polyethylene Fresnel Dome Lens */}
      <group position={[0, 0.2, 0]}>
        {/* Dome base cylinder */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[1.05, 1.05, 0.8, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} transparent opacity={0.92} />
        </mesh>
        {/* Top Dome Hemisphere */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <sphereGeometry args={[1.05, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} transparent opacity={0.92} />
        </mesh>
      </group>

      {/* Dual Orange Potentiometers (Sensitivity & Time Delay) */}
      {[-0.9, -0.2].map((xOff, idx) => (
        <group key={idx} position={[xOff, 0.22, 0.85]}>
          <mesh>
            <boxGeometry args={[0.38, 0.15, 0.38]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Mode Selection Jumper Block */}
      <mesh position={[1.1, 0.24, 0.85]}>
        <boxGeometry args={[0.25, 0.2, 0.4]} />
        <meshStandardMaterial color="#eab308" roughness={0.6} />
      </mesh>

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
