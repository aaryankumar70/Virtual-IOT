import React from 'react';
import { VirtualComponent } from '../core/components/VirtualComponent';
import { PinMesh } from '../scene/World/PinMesh';

interface Props {
  component: VirtualComponent;
}

export const RaspberryPiMesh: React.FC<Props> = ({ component }) => (
  <group>
    {/* Green PCB */}
    <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
      <boxGeometry args={[8.5, 0.25, 5.6]} />
      <meshStandardMaterial color="#166534" roughness={0.4} />
    </mesh>
    {/* 40-Pin Header */}
    <mesh position={[-1.2, 0.45, -1.2]} castShadow>
      <boxGeometry args={[5.2, 0.4, 0.5]} />
      <meshStandardMaterial color="#0f172a" roughness={0.7} />
    </mesh>
    {/* Broadcom CPU */}
    <mesh position={[0.2, 0.4, 0.2]} castShadow>
      <boxGeometry args={[1.5, 0.25, 1.5]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Dual USB Ports (Silver & Blue) */}
    <mesh position={[3.6, 0.65, -1.2]} castShadow>
      <boxGeometry args={[1.6, 1.1, 1.4]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
    </mesh>
    <mesh position={[3.6, 0.65, 0.4]} castShadow>
      <boxGeometry args={[1.6, 1.1, 1.4]} />
      <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.3} />
    </mesh>
    {/* Ethernet Jack */}
    <mesh position={[3.6, 0.7, 1.8]} castShadow>
      <boxGeometry args={[1.8, 1.2, 1.5]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
    </mesh>
    {/* Pins */}
    {component.pins.map((pin) => (
      <PinMesh key={pin.id} pin={pin} componentId={component.id} componentName={component.name} />
    ))}
  </group>
);

export const LEDRGBMesh: React.FC<Props> = ({ component }) => (
  <group>
    {/* Diffused Dome */}
    <mesh position={[0, 0.9, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.35, 0.8, 16]} />
      <meshStandardMaterial color="#e0e7ff" transparent opacity={0.85} roughness={0.1} />
    </mesh>
    <mesh position={[0, 1.3, 0]}>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial color="#e0e7ff" transparent opacity={0.85} roughness={0.1} />
    </mesh>
    {/* 4 Leads */}
    {component.pins.map((pin) => (
      <PinMesh key={pin.id} pin={pin} componentId={component.id} componentName={component.name} />
    ))}
  </group>
);

export const UltrasonicSensorMesh: React.FC<Props> = ({ component }) => (
  <group>
    {/* Blue Vertical PCB */}
    <mesh position={[0, 0.9, 0]} castShadow>
      <boxGeometry args={[4.5, 2.0, 0.2]} />
      <meshStandardMaterial color="#1e40af" roughness={0.4} />
    </mesh>
    {/* Transmitter Cylinder (Left Eye) */}
    <mesh position={[-1.2, 0.9, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.7, 0.7, 1.0, 24]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Receiver Cylinder (Right Eye) */}
    <mesh position={[1.2, 0.9, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.7, 0.7, 1.0, 24]} />
      <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Crystal Oscillator */}
    <mesh position={[0, 0.3, 0.2]} castShadow>
      <boxGeometry args={[0.6, 0.3, 0.2]} />
      <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
    </mesh>
    {/* Pins */}
    {component.pins.map((pin) => (
      <PinMesh key={pin.id} pin={pin} componentId={component.id} componentName={component.name} />
    ))}
  </group>
);

export const TemperatureSensorMesh: React.FC<Props> = ({ component }) => (
  <group>
    {/* TO-92 Transistor Package */}
    <mesh position={[0, 0.6, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 0.6, 16, 1, false, 0, Math.PI]} />
      <meshStandardMaterial color="#1e293b" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.6, 0]} castShadow>
      <boxGeometry args={[0.6, 0.6, 0.15]} />
      <meshStandardMaterial color="#1e293b" roughness={0.5} />
    </mesh>
    {/* Pins */}
    {component.pins.map((pin) => (
      <PinMesh key={pin.id} pin={pin} componentId={component.id} componentName={component.name} />
    ))}
  </group>
);

export const ServoMotorMesh: React.FC<Props> = ({ component }) => (
  <group>
    {/* Blue Micro Servo Body */}
    <mesh position={[0, 0.8, 0]} castShadow>
      <boxGeometry args={[2.3, 1.5, 1.2]} />
      <meshStandardMaterial color="#2563eb" roughness={0.3} />
    </mesh>
    {/* Mounting Tabs */}
    <mesh position={[-1.4, 1.1, 0]} castShadow>
      <boxGeometry args={[0.5, 0.2, 1.2]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
    <mesh position={[1.4, 1.1, 0]} castShadow>
      <boxGeometry args={[0.5, 0.2, 1.2]} />
      <meshStandardMaterial color="#2563eb" />
    </mesh>
    {/* Output Gear Axis & White Horn */}
    <mesh position={[-0.5, 1.7, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    <mesh position={[-0.5, 1.9, 0]} castShadow>
      <boxGeometry args={[1.4, 0.1, 0.3]} />
      <meshStandardMaterial color="#ffffff" roughness={0.4} />
    </mesh>
    {/* Pins */}
    {component.pins.map((pin) => (
      <PinMesh key={pin.id} pin={pin} componentId={component.id} componentName={component.name} />
    ))}
  </group>
);
