import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const RaspberryPiMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Main Multi-layer Green PCB */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 0.22, 5.6]} />
        <meshStandardMaterial color="#15803d" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* 4 Corner Mounting Holes (Plated Through-Hole Ring Decals) */}
      {[
        [-3.8, 2.3],
        [-3.8, -2.3],
        [3.8, 2.3],
        [3.8, -2.3],
      ].map(([hx, hz], i) => (
        <mesh key={i} position={[hx, 0.27, hz]}>
          <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* Broadcom BCM2711 SoC CPU (Silver Anodized Aluminum Lid) */}
      <group position={[0.3, 0.38, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 0.22, 1.5]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Subtle Silicon Core Emboss */}
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[1.2, 0.02, 1.2]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* LPDDR4 SDRAM Chip (Black Epoxy Package) */}
      <mesh position={[-1.2, 0.32, 0.2]} castShadow>
        <boxGeometry args={[1.1, 0.12, 1.1]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Gigabit Ethernet Jack (Shielded Silver Metal) */}
      <group position={[3.5, 0.72, 1.8]}>
        <mesh castShadow>
          <boxGeometry args={[1.9, 1.1, 1.5]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Integrated Status LEDs (Yellow / Green) */}
        <mesh position={[0.96, 0.25, -0.3]}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
          <meshStandardMaterial color="#22c55e" emissive="#15803d" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.96, 0.25, 0.3]}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
          <meshStandardMaterial color="#eab308" emissive="#ca8a04" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Dual USB 3.0 Ports (Blue Inserts Inside Silver Shield) */}
      <group position={[3.6, 0.72, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 1.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Blue Inner Tongue */}
        <mesh position={[0.88, 0.1, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.9]} />
          <meshStandardMaterial color="#2563eb" roughness={0.5} />
        </mesh>
        <mesh position={[0.88, -0.25, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.9]} />
          <meshStandardMaterial color="#2563eb" roughness={0.5} />
        </mesh>
      </group>

      {/* Dual USB 2.0 Ports (Black Inserts Inside Silver Shield) */}
      <group position={[3.6, 0.72, -1.6]}>
        <mesh castShadow>
          <boxGeometry args={[1.8, 1.1, 1.4]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Black Inner Tongue */}
        <mesh position={[0.88, 0.1, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0.88, -0.25, 0]}>
          <boxGeometry args={[0.1, 0.15, 0.9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      </group>

      {/* 40-Pin GPIO Header Base Shroud (Black Molded Plastic 2x20) */}
      <mesh position={[-1.0, 0.36, -2.35]} castShadow>
        <boxGeometry args={[5.2, 0.22, 0.58]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* Gold Pin Posts for 40-pin GPIO */}
      {Array.from({ length: 20 }).map((_, col) => {
        const xPos = -3.4 + col * 0.25;
        return (
          <group key={col}>
            <mesh position={[xPos, 0.58, -2.48]}>
              <boxGeometry args={[0.065, 0.32, 0.065]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[xPos, 0.58, -2.22]}>
              <boxGeometry args={[0.065, 0.32, 0.065]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* Micro-HDMI Ports (Dual Micro Silver Jacks) */}
      <mesh position={[-1.2, 0.32, 2.75]} castShadow>
        <boxGeometry args={[0.6, 0.22, 0.35]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-2.4, 0.32, 2.75]} castShadow>
        <boxGeometry args={[0.6, 0.22, 0.35]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3.5mm Composite AV Jack (Black Barrel with Silver Collar) */}
      <group position={[0.2, 0.42, 2.7]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.45, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.08, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* DSI Display and CSI Camera Ribbon Connectors (White/Black Slots) */}
      <mesh position={[-3.4, 0.32, 0.2]}>
        <boxGeometry args={[0.4, 0.18, 2.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      <mesh position={[1.4, 0.32, 1.2]}>
        <boxGeometry args={[0.4, 0.18, 1.8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>

      {/* Connectors (USB-C Power, USB-A Ports, GPIO Header) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

      {/* Logical Pins */}
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
