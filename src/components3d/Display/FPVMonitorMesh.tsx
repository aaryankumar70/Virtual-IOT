import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';
import { useFPVMonitorTexture } from './useCanvasScreenTexture';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const FPVMonitorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const channel = (component.state?.channel as string) || 'R4 (5800 MHz)';
  const osdEnabled = component.state?.osdEnabled !== false;

  const screenTexture = useFPVMonitorTexture({
    powered: isPowered,
    channel,
    osdEnabled,
  });

  return (
    <group>
      {/* Rugged Matte Black Field Monitor Chassis */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.5, 0.9, 7.5]} />
        <meshStandardMaterial color="#18181b" roughness={0.6} />
      </mesh>

      {/* Rubber Corner Bumpers for Field Protection */}
      {[
        [-5.8, -3.8],
        [5.8, -3.8],
        [-5.8, 3.8],
        [5.8, 3.8],
      ].map(([bx, bz], idx) => (
        <mesh key={idx} position={[bx, 0.45, bz]} castShadow>
          <boxGeometry args={[0.6, 1.0, 0.6]} />
          <meshStandardMaterial color="#09090b" roughness={0.9} />
        </mesh>
      ))}

      {/* Active 4.3" Widescreen LCD Display Panel Face */}
      <mesh position={[0, 0.92, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.5, 5.4]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#000000" />
        )}
      </mesh>

      {/* Glossy Screen Glass Protector */}
      <mesh position={[0, 0.93, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9.6, 5.5]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.2}
          roughness={0.05}
          transmission={0.9}
          thickness={0.04}
          color="#ffffff"
        />
      </mesh>

      {/* Three-Leaf Folding Sunshade Hood */}
      {/* Top Hood */}
      <mesh position={[0, 1.6, -2.55]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[9.8, 0.08, 1.4]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>
      {/* Left Hood Shield */}
      <mesh position={[-4.9, 1.35, 0.3]} rotation={[0, 0, -0.2]} castShadow>
        <boxGeometry args={[0.08, 0.9, 5.4]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>
      {/* Right Hood Shield */}
      <mesh position={[4.9, 1.35, 0.3]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[0.08, 0.9, 5.4]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>

      {/* Front Bezel Button Row (CH+, CH-, SEARCH, MENU, POWER) */}
      {[-3.2, -1.6, 0, 1.6, 3.2].map((btnX, idx) => (
        <mesh key={idx} position={[btnX, 0.93, 3.3]}>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
          <meshStandardMaterial color={idx === 4 ? '#dc2626' : '#3f3f46'} roughness={0.5} />
        </mesh>
      ))}

      {/* Power & RF Status Indicator LEDs */}
      <mesh position={[-4.5, 0.93, 3.3]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 10]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive={isPowered ? '#16a34a' : '#000000'}
          emissiveIntensity={isPowered ? 1.0 : 0.05}
        />
      </mesh>
      <mesh position={[-4.1, 0.93, 3.3]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 10]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive={isPowered ? '#0284c7' : '#000000'}
          emissiveIntensity={isPowered ? 1.0 : 0.05}
        />
      </mesh>

      {/* SMA Antenna Port (Gold brass hex bushing on top-left) */}
      <mesh position={[-4.6, 0.7, -3.85]}>
        <cylinderGeometry args={[0.3, 0.3, 0.45, 6]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 5.8GHz Rubber Duck Antenna */}
      <group position={[-4.6, 1.0, -3.85]}>
        {/* Antenna Base Knurl */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.6, 12]} />
          <meshStandardMaterial color="#27272a" roughness={0.7} />
        </mesh>
        {/* Antenna Flexible Whip Shaft */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.28, 3.2, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>
        {/* Antenna Top Rounded Cap */}
        <mesh position={[0, 3.8, 0]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
      </group>

      {/* Tripod Brass Bushing on Bottom */}
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 12]} />
        <meshStandardMaterial color="#ca8a04" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Sunlight Ambient Emissive Glow from Screen */}
      {isPowered && (
        <pointLight position={[0, 1.5, 0.3]} intensity={0.7} color="#60a5fa" distance={3.0} />
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
