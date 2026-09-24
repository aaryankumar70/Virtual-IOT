import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';
import { useLCD1602Texture } from './useCanvasScreenTexture';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const LCD1602Mesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const hasBacklight = Boolean(component.state?.backlight ?? true);
  const theme = (component.state?.theme as 'blue' | 'green' | 'amber') || 'blue';

  const screenTexture = useLCD1602Texture({
    powered: isPowered,
    backlight: hasBacklight,
    line1: component.state?.line1 as string,
    line2: component.state?.line2 as string,
    theme,
  });

  return (
    <group>
      {/* Main Green FR4 Motherboard PCB */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.0, 0.16, 3.6]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} />
      </mesh>

      {/* 4 Corner Mounting Holes (Brass eyelets) */}
      {[
        [-3.75, -1.55],
        [3.75, -1.55],
        [-3.75, 1.55],
        [3.75, 1.55],
      ].map(([hx, hz], idx) => (
        <mesh key={idx} position={[hx, 0.165, hz]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 12]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Top 16-Pin Solder Pad Strip */}
      <mesh position={[-1.6, 0.165, -1.5]}>
        <boxGeometry args={[4.2, 0.01, 0.25]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Black Metal Stamped Bezel / Frame */}
      <mesh position={[0, 0.32, 0.1]} castShadow>
        <boxGeometry args={[7.15, 0.32, 2.45]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Bezel Cutout Recess (Inner Dark Border) */}
      <mesh position={[0, 0.44, 0.1]}>
        <boxGeometry args={[6.6, 0.1, 1.8]} />
        <meshStandardMaterial color="#09090b" roughness={0.7} />
      </mesh>

      {/* Active Dot-Matrix LCD Screen Face */}
      <mesh position={[0, 0.485, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 1.6]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#1e3a8a" />
        )}
      </mesh>

      {/* Polarizing Protective Glass Layer */}
      <mesh position={[0, 0.49, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 1.6]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.25}
          roughness={0.1}
          transmission={0.8}
          thickness={0.04}
          color="#ffffff"
        />
      </mesh>

      {/* Rear I2C PCF8574 Backpack Daughterboard (visible underneath/side) */}
      <mesh position={[2.2, -0.15, 0]} castShadow>
        <boxGeometry args={[4.2, 0.16, 1.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Blue Contrast Potentiometer Trimmer on Backpack */}
      <mesh position={[1.4, -0.28, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.6]} />
        <meshStandardMaterial color="#2563eb" />
      </mesh>
      {/* Brass Trimmer Screw */}
      <mesh position={[1.4, -0.36, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.05, 8]} />
        <meshStandardMaterial color="#eab308" metalness={0.8} />
      </mesh>

      {/* Backlight Jumper on Backpack */}
      <mesh position={[3.8, -0.25, 0.5]}>
        <boxGeometry args={[0.3, 0.2, 0.4]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 4-Pin Right Angle Header Base for I2C (GND, VCC, SDA, SCL) */}
      <mesh position={[4.15, -0.15, -0.4]}>
        <boxGeometry args={[0.25, 0.22, 1.1]} />
        <meshStandardMaterial color="#18181b" roughness={0.8} />
      </mesh>

      {/* Glowing Ambient Light when Backlight is Active */}
      {isPowered && hasBacklight && (
        <pointLight
          position={[0, 0.8, 0.1]}
          intensity={0.6}
          color={theme === 'green' ? '#84cc16' : theme === 'amber' ? '#f59e0b' : '#3b82f6'}
          distance={2.5}
        />
      )}

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
