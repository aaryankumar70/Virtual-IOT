import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ArduinoUnoMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const isLed13On = Boolean(component.state?.led13 ?? false);

  return (
    <group>
      {/* PCB Base (Arduino Teal Blue) */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.86, 0.25, 5.34]} />
        <meshStandardMaterial color="#00878a" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Silkscreen White Label Area */}
      <mesh position={[0, 0.28, -0.4]}>
        <boxGeometry args={[3.2, 0.01, 1.2]} />
        <meshStandardMaterial color="#005c5e" roughness={0.6} />
      </mesh>

      {/* ATmega328P DIP-28 IC (Black Chip with Silver Leadframe Legs) */}
      <group position={[0.8, 0.38, 0.8]}>
        <mesh castShadow>
          <boxGeometry args={[3.4, 0.32, 0.9]} />
          <meshStandardMaterial color="#171923" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Notch on Pin 1 side */}
        <mesh position={[-1.7, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* ATmega16U2 USB Interface Chip (QFN-32 Square) */}
      <mesh position={[-1.5, 0.32, -0.8]} castShadow>
        <boxGeometry args={[0.7, 0.12, 0.7]} />
        <meshStandardMaterial color="#171923" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* 16MHz Crystal Oscillator (Silver Oval HC-49) */}
      <mesh position={[-0.8, 0.35, -0.5]} castShadow>
        <boxGeometry args={[0.9, 0.25, 0.4]} />
        <meshStandardMaterial color="#cbd5e0" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* 5V Low-Dropout Linear Voltage Regulator (DPAK with heat tab) */}
      <group position={[-2.4, 0.34, 0.6]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.22, 0.7]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        <mesh position={[-0.2, 0.12, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Reset Button (Red button in metal tactile casing) */}
      <group position={[-2.6, 0.35, -2.1]}>
        <mesh>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#a0aec0" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 12]} />
          <meshStandardMaterial color="#e53e3e" roughness={0.4} />
        </mesh>
      </group>

      {/* STATUS LEDS (0805 SMD packages with silkscreen labels) */}

      {/* 1. 'ON' Power Status LED (Green) */}
      <group position={[1.5, 0.31, -0.6]}>
        {/* SMD Ceramic Base */}
        <mesh>
          <boxGeometry args={[0.22, 0.08, 0.14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Green Emitter Lens */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.1]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={isPowered ? '#22c55e' : '#000000'}
            emissiveIntensity={isPowered ? 1.6 : 0.05}
            roughness={0.2}
          />
        </mesh>
        {/* Silkscreen 'ON' Marking Pad */}
        <mesh position={[0.22, 0.01, 0]}>
          <boxGeometry args={[0.16, 0.01, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* 2. 'L' Pin 13 Status LED (Amber / Yellow) */}
      <group position={[-0.95, 0.31, -1.6]}>
        {/* SMD Ceramic Base */}
        <mesh>
          <boxGeometry args={[0.22, 0.08, 0.14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Amber Emitter Lens */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.1]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive={isLed13On ? '#f59e0b' : isPowered ? '#78350f' : '#000000'}
            emissiveIntensity={isLed13On ? 2.0 : isPowered ? 0.3 : 0.02}
            roughness={0.2}
          />
        </mesh>
        {/* Silkscreen 'L' Marking Pad */}
        <mesh position={[0.22, 0.01, 0]}>
          <boxGeometry args={[0.14, 0.01, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* 3. 'TX' Serial Transmit LED (Green/Yellow) */}
      <group position={[-1.0, 0.31, -1.1]}>
        <mesh>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={isPowered ? '#15803d' : '#000000'}
            emissiveIntensity={isPowered ? 0.6 : 0.02}
            roughness={0.2}
          />
        </mesh>
        {/* Silkscreen 'TX' Marking Pad */}
        <mesh position={[0.2, 0.01, 0]}>
          <boxGeometry args={[0.14, 0.01, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* 4. 'RX' Serial Receive LED (Green/Yellow) */}
      <group position={[-1.0, 0.31, -0.8]}>
        <mesh>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive={isPowered ? '#15803d' : '#000000'}
            emissiveIntensity={isPowered ? 0.6 : 0.02}
            roughness={0.2}
          />
        </mesh>
        {/* Silkscreen 'RX' Marking Pad */}
        <mesh position={[0.2, 0.01, 0]}>
          <boxGeometry args={[0.14, 0.01, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* 4 Plated M3 Mounting Holes */}
      {[
        [-3.1, -1.9],
        [1.9, -2.4],
        [1.9, 2.4],
        [-2.9, 2.4],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.28, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.28, 16]} />
            <meshStandardMaterial color="#b7791f" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 2x 100uF Aluminum Electrolytic Capacitors (Near DC Jack and Regulator) */}
      <group position={[-1.8, 0.48, 1.4]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.65, 18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Negative Cathode Strip */}
        <mesh position={[-0.26, 0, 0]}>
          <boxGeometry args={[0.08, 0.64, 0.12]} />
          <meshStandardMaterial color="#09090b" roughness={0.6} />
        </mesh>
      </group>
      <group position={[-1.4, 0.48, 0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.58, 18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.22, 0, 0]}>
          <boxGeometry args={[0.08, 0.57, 0.1]} />
          <meshStandardMaterial color="#09090b" roughness={0.6} />
        </mesh>
      </group>

      {/* Polyfuse 500mA PTC (Gold square near USB port) */}
      <mesh position={[-2.1, 0.3, -1.0]}>
        <boxGeometry args={[0.4, 0.08, 0.35]} />
        <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 2x ICSP Headers (2x3 Gold Pins) */}
      {/* ATmega328P ICSP Header */}
      <group position={[2.9, 0.45, 0.2]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.55, 0.15, 0.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {[-0.14, 0.14].map((xOff, xi) =>
          [-0.25, 0, 0.25].map((zOff, zi) => (
            <mesh key={`${xi}-${zi}`} position={[xOff, 0.1, zOff]}>
              <boxGeometry args={[0.06, 0.4, 0.06]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.2} />
            </mesh>
          ))
        )}
      </group>

      {/* ATmega16U2 ICSP Header */}
      <group position={[-2.4, 0.45, -0.8]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[0.55, 0.15, 0.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {[-0.14, 0.14].map((xOff, xi) =>
          [-0.25, 0, 0.25].map((zOff, zi) => (
            <mesh key={`${xi}-${zi}`} position={[xOff, 0.1, zOff]}>
              <boxGeometry args={[0.06, 0.4, 0.06]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.2} />
            </mesh>
          ))
        )}
      </group>

      {/* Female Header Strips (Top & Bottom Black Plastic Blocks) */}
      {/* Top Header */}
      <mesh position={[0.4, 0.35, -2.2]} castShadow>
        <boxGeometry args={[4.4, 0.4, 0.45]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>
      {/* Bottom Header */}
      <mesh position={[0.4, 0.35, 2.2]} castShadow>
        <boxGeometry args={[4.2, 0.4, 0.45]} />
        <meshStandardMaterial color="#1a202c" roughness={0.7} />
      </mesh>

      {/* Render Physical Connectors (USB-B, DC Barrel Jack, Pin Headers) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

      {/* Render All Logical Physical Pins */}
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
