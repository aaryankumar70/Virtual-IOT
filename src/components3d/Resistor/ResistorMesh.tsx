import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

const COLOR_CODES: Record<number, string> = {
  0: '#1e293b', // Black
  1: '#744210', // Brown
  2: '#e53e3e', // Red
  3: '#ea580c', // Orange
  4: '#eab308', // Yellow
  5: '#16a34a', // Green
  6: '#2563eb', // Blue
  7: '#9333ea', // Violet
  8: '#64748b', // Grey
  9: '#ffffff', // White
};

export const ResistorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const resistance = Number(component.state?.resistance) || 220;

  // Calculate 4-band EIA color code
  const { band1, band2, band3 } = React.useMemo(() => {
    let num = resistance;
    let multiplier = 0;
    while (num >= 100) {
      num = num / 10;
      multiplier++;
    }
    const d1 = Math.floor(num / 10) % 10;
    const d2 = Math.floor(num) % 10;
    return {
      band1: COLOR_CODES[d1] || '#e53e3e',
      band2: COLOR_CODES[d2] || '#e53e3e',
      band3: COLOR_CODES[multiplier] || '#744210',
    };
  }, [resistance]);

  return (
    <group>
      {/* Ceramic/Carbon Beige Body */}
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.9, 20]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>

      {/* Body Bulb Ends */}
      <mesh position={[-0.45, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 0.22, 0]} castShadow>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#e2c092" roughness={0.6} />
      </mesh>

      {/* Color Bands (Band 1, Band 2, Multiplier, Tolerance Gold) */}
      {/* Band 1 */}
      <mesh position={[-0.3, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color={band1} roughness={0.5} />
      </mesh>
      {/* Band 2 */}
      <mesh position={[-0.1, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color={band2} roughness={0.5} />
      </mesh>
      {/* Band 3: Multiplier */}
      <mesh position={[0.1, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color={band3} roughness={0.5} />
      </mesh>
      {/* Band 4: Gold (±5% Tolerance) */}
      <mesh position={[0.3, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.23, 0.23, 0.08, 20]} />
        <meshStandardMaterial color="#d69e2e" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Left Wire Lead */}
      <mesh position={[-0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Right Wire Lead */}
      <mesh position={[0.7, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 12]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Render Lead Pins */}
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
