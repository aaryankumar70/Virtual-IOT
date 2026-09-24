import React from 'react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const ESP32Mesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* 1. Matte Black FR4 PCB Base */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.2, 5.2]} />
        <meshStandardMaterial color="#18181b" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* 4 Plated M2 Corner Mounting Holes */}
      {[
        [-1.3, -2.3],
        [1.3, -2.3],
        [-1.3, 2.3],
        [1.3, 2.3],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.252, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.15, 16]} />
            <meshStandardMaterial color="#b7791f" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.22, 16]} />
            <meshStandardMaterial color="#09090b" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 2. ESP-WROOM-32 Metal RF Shielding Can */}
      <group position={[0, 0.38, -0.6]}>
        {/* Nickel-Silver Stamped Metal RF Can */}
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.26, 2.3]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.18} />
        </mesh>
        {/* Espressif Laser-Etched Text Plate Simulation */}
        <mesh position={[0, 0.135, 0]}>
          <boxGeometry args={[1.9, 0.01, 1.9]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Laser-Etched Logo Recesses */}
        <mesh position={[0, 0.142, -0.4]}>
          <boxGeometry args={[1.2, 0.005, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.142, 0.1]}>
          <boxGeometry args={[1.5, 0.005, 0.5]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
      </group>

      {/* 3. Inverted-F PCB Meander Antenna (Gold finish on FR4) */}
      <group position={[0, 0.255, -2.1]}>
        {/* Dark Antenna Area Substrate */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.1, 0.01, 0.7]} />
          <meshStandardMaterial color="#111827" roughness={0.5} />
        </mesh>
        {/* Gold Meander Trace Pattern */}
        {[-0.8, -0.4, 0.0, 0.4, 0.8].map((xOff, i) => (
          <mesh key={i} position={[xOff, 0.008, 0]}>
            <boxGeometry args={[0.06, 0.01, 0.55]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        {/* Top Antenna Feed Bar */}
        <mesh position={[0, 0.008, -0.28]}>
          <boxGeometry args={[1.8, 0.01, 0.06]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* 4. Silicon Labs CP2102 USB-to-UART Bridge Controller (QFN-28) */}
      <group position={[0, 0.29, 1.3]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.12, 0.7]} />
          <meshStandardMaterial color="#18181b" roughness={0.3} />
        </mesh>
        {/* Pin 1 Index Dot */}
        <mesh position={[-0.24, 0.065, -0.24]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 8]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
        {/* Solder Fillet Leads on 4 edges */}
        <mesh position={[-0.38, 0, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.55]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0.38, 0, 0]}>
          <boxGeometry args={[0.06, 0.08, 0.55]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* 5. AMS1117-3.3V Voltage Regulator (SOT-223) */}
      <group position={[-0.7, 0.29, 0.8]}>
        {/* Black Epoxy Body */}
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.14, 0.45]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} />
        </mesh>
        {/* Metal Heat Tab */}
        <mesh position={[0, 0.02, -0.28]}>
          <boxGeometry args={[0.45, 0.08, 0.18]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* 3 Output Leads */}
        {[-0.18, 0, 0.18].map((xOff, i) => (
          <mesh key={i} position={[xOff, -0.02, 0.28]}>
            <boxGeometry args={[0.08, 0.06, 0.16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 6. Tactile Pushbuttons: EN (Reset) & BOOT (GPIO0) */}
      {/* EN Button (Left side of Micro-USB) */}
      <group position={[-0.9, 0.32, 2.05]}>
        {/* Metal Casing */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.18, 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Round Actuator Plunger */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 14]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      </group>

      {/* BOOT Button (Right side of Micro-USB) */}
      <group position={[0.9, 0.32, 2.05]}>
        {/* Metal Casing */}
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.18, 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Round Actuator Plunger */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 14]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      </group>

      {/* 7. Status & Power LEDs */}
      {/* Red Power LED */}
      <mesh position={[0.6, 0.28, 0.8]}>
        <boxGeometry args={[0.12, 0.08, 0.16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
      {/* Blue GPIO2 LED */}
      <mesh position={[0.8, 0.28, 0.8]}>
        <boxGeometry args={[0.12, 0.08, 0.16]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.4} />
      </mesh>

      {/* 8. Dual 15-Pin Male Header Strips (Left & Right 2.54mm pitch) */}
      {/* Left Header Insulator Bar */}
      <mesh position={[-1.3, 0.32, 0]} castShadow>
        <boxGeometry args={[0.3, 0.24, 4.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      {/* Right Header Insulator Bar */}
      <mesh position={[1.3, 0.32, 0]} castShadow>
        <boxGeometry args={[0.3, 0.24, 4.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* 9. Render Physical Connectors (Micro-USB Port) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

      {/* 10. Pins */}
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
