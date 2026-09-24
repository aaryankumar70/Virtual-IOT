import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';
import { useTFTTexture } from './useCanvasScreenTexture';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const TFTScreenMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const brightness = Number(component.state?.brightness ?? 100);
  const gaugeValue = typeof component.state?.gaugeValue === 'number' ? component.state.gaugeValue : undefined;

  const screenTexture = useTFTTexture({
    powered: isPowered,
    brightness,
    displayMode: (component.state?.displayMode as string) || 'dashboard',
    gaugeValue,
  });

  return (
    <group>
      {/* Red FR4 Breakout PCB */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.9, 0.14, 2.8]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.35} />
      </mesh>

      {/* 4 M2 Corner Screw Mounts */}
      {[
        [-1.7, -1.2],
        [1.7, -1.2],
        [-1.7, 1.2],
        [1.7, 1.2],
      ].map(([hx, hz], idx) => (
        <mesh key={idx} position={[hx, 0.155, hz]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
      ))}

      {/* 8-Pin Header Base Bar at bottom z = 1.15 */}
      <mesh position={[0, 0.18, 1.15]} castShadow>
        <boxGeometry args={[2.2, 0.18, 0.28]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} />
      </mesh>

      {/* IPS LCD Glass Panel Enclosure Frame */}
      <mesh position={[0, 0.2, -0.2]} castShadow>
        <boxGeometry args={[2.7, 0.12, 2.7]} />
        <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Active Color IPS Screen Face */}
      <mesh position={[0, 0.265, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.45, 2.45]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#020617" />
        )}
      </mesh>

      {/* Ultra-clear glass protection film */}
      <mesh position={[0, 0.27, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.55, 2.55]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.85}
          thickness={0.05}
          color="#ffffff"
        />
      </mesh>

      {/* Onboard 3.3V LDO Regulator & Level Shifter */}
      <mesh position={[-1.5, 0.17, 0.6]}>
        <boxGeometry args={[0.3, 0.08, 0.2]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
      <mesh position={[1.5, 0.17, 0.6]}>
        <boxGeometry args={[0.35, 0.08, 0.25]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Colored Ambient Lighting */}
      {isPowered && (
        <pointLight position={[0, 0.6, -0.2]} intensity={0.5} color="#38bdf8" distance={2.0} />
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
