import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const BreadboardMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Off-white ABS Molded Plastic Main Body */}
      <mesh position={[0, 0.21, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.5, 0.42, 4.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.65} metalness={0.04} />
      </mesh>

      {/* Central IC DIP Divider Trough / Channel */}
      <mesh position={[0, 0.412, 0]}>
        <boxGeometry args={[7.3, 0.035, 0.34]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Longitudinal Power Rail Separation Grooves */}
      {/* Top separator groove */}
      <mesh position={[0, 0.418, -1.14]}>
        <boxGeometry args={[7.3, 0.012, 0.05]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      {/* Bottom separator groove */}
      <mesh position={[0, 0.418, 1.14]}>
        <boxGeometry args={[7.3, 0.012, 0.05]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>

      {/* Top Power Rail Red Line (+) */}
      <mesh position={[0, 0.423, -1.9]}>
        <boxGeometry args={[6.8, 0.005, 0.035]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>
      {/* Top Power Rail Blue Line (-) */}
      <mesh position={[0, 0.423, -1.22]}>
        <boxGeometry args={[6.8, 0.005, 0.035]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
      </mesh>

      {/* Bottom Power Rail Red Line (+) */}
      <mesh position={[0, 0.423, 1.22]}>
        <boxGeometry args={[6.8, 0.005, 0.035]} />
        <meshStandardMaterial color="#ef4444" roughness={0.5} />
      </mesh>
      {/* Bottom Power Rail Blue Line (-) */}
      <mesh position={[0, 0.423, 1.9]}>
        <boxGeometry args={[6.8, 0.005, 0.035]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
      </mesh>

      {/* Red (+) and Blue (-) Printed Silkscreen Symbols at Rail Terminals */}
      {[-3.5, 3.5].map((xPos, idx) => (
        <group key={idx}>
          {/* Top Red (+) */}
          <group position={[xPos, 0.424, -1.9]}>
            <mesh>
              <boxGeometry args={[0.07, 0.004, 0.02]} />
              <meshStandardMaterial color="#ef4444" roughness={0.5} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.02, 0.004, 0.07]} />
              <meshStandardMaterial color="#ef4444" roughness={0.5} />
            </mesh>
          </group>

          {/* Top Blue (-) */}
          <mesh position={[xPos, 0.424, -1.22]}>
            <boxGeometry args={[0.07, 0.004, 0.02]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} />
          </mesh>

          {/* Bottom Red (+) */}
          <group position={[xPos, 0.424, 1.22]}>
            <mesh>
              <boxGeometry args={[0.07, 0.004, 0.02]} />
              <meshStandardMaterial color="#ef4444" roughness={0.5} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.02, 0.004, 0.07]} />
              <meshStandardMaterial color="#ef4444" roughness={0.5} />
            </mesh>
          </group>

          {/* Bottom Blue (-) */}
          <mesh position={[xPos, 0.424, 1.9]}>
            <boxGeometry args={[0.07, 0.004, 0.02]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Center Column Index Indicator Pads along central trough */}
      {[-3.025, -0.825, 1.375, 3.025].map((xPos, idx) => (
        <group key={idx}>
          <mesh position={[xPos, 0.422, -0.19]}>
            <boxGeometry args={[0.06, 0.004, 0.03]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
          </mesh>
          <mesh position={[xPos, 0.422, 0.19]}>
            <boxGeometry args={[0.06, 0.004, 0.03]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Dovetail Interlocking Side Tabs (Right) and Slots (Left) */}
      {/* Right protruding interlocking tabs */}
      <mesh position={[3.82, 0.21, -0.8]} castShadow>
        <boxGeometry args={[0.16, 0.32, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[3.82, 0.21, 0.8]} castShadow>
        <boxGeometry args={[0.16, 0.32, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Left receiving interlocking slots */}
      <mesh position={[-3.82, 0.21, -0.8]}>
        <boxGeometry args={[0.12, 0.34, 0.55]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
      <mesh position={[-3.82, 0.21, 0.8]}>
        <boxGeometry args={[0.12, 0.34, 0.55]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>

      {/* Render all logical pin receptacles with recessed holes */}
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
