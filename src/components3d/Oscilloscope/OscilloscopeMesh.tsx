import React, { useState } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { useOscilloscopeScreenTexture } from './useOscilloscopeScreenTexture';
import { oscilloscopeStore, useOscilloscope } from '../../state/oscilloscope/oscilloscopeStore';
import { projectStore } from '../../state/project/projectStore';

interface Props {
  component: VirtualComponent;
}

export const OscilloscopeMesh: React.FC<Props> = ({ component }) => {
  const oscState = useOscilloscope();
  const screenTexture = useOscilloscopeScreenTexture(component.id);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleScreenClick = (e: any) => {
    e.stopPropagation();
    oscilloscopeStore.openOscilloscope();
  };

  const handleRunStopClick = (e: any) => {
    e.stopPropagation();
    oscilloscopeStore.toggleRun();
  };

  const handleAutoSetClick = (e: any) => {
    e.stopPropagation();
    const projState = projectStore.getState();
    oscilloscopeStore.autoSet(projState.components, projState.connections);
  };

  return (
    <group>
      {/* 1. Main Benchtop Instrument Enclosure (Industrial Gray with Chamfers) */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.6, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.65} metalness={0.2} />
      </mesh>

      {/* Top Handle Arc */}
      <mesh position={[0, 2.7, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.16, 0.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[-1.15, 2.65, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.5]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      <mesh position={[1.15, 2.65, 0]} castShadow>
        <boxGeometry args={[0.15, 0.2, 0.5]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>

      {/* 4 Rubber Corner Shock Bumpers */}
      {[
        [-2.22, 0.08, -1.12],
        [2.22, 0.08, -1.12],
        [-2.22, 0.08, 1.12],
        [2.22, 0.08, 1.12],
      ].map(([bx, by, bz], i) => (
        <mesh key={i} position={[bx, by, bz]} castShadow>
          <boxGeometry args={[0.24, 0.16, 0.24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}

      {/* Side Cooling Air Vents */}
      {[-0.6, -0.2, 0.2, 0.6].map((vy, i) => (
        <group key={i}>
          <mesh position={[-2.21, 1.3 + vy, 0]}>
            <boxGeometry args={[0.02, 0.06, 1.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[2.21, 1.3 + vy, 0]}>
            <boxGeometry args={[0.02, 0.06, 1.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 2. Front Faceplate Bevel (Slightly tilted for optimal viewing ergonomics) */}
      <mesh position={[0, 1.3, 1.12]} castShadow receiveShadow>
        <boxGeometry args={[4.26, 2.46, 0.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Front Brand Banner Silkscreen */}
      <mesh position={[-1.1, 2.36, 1.16]}>
        <boxGeometry args={[1.5, 0.1, 0.005]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* 3. 7-inch High-Resolution TFT Digital Screen */}
      <group position={[-0.8, 1.4, 1.16]}>
        {/* Screen Bezel Frame */}
        <mesh castShadow>
          <boxGeometry args={[2.5, 1.7, 0.04]} />
          <meshStandardMaterial color="#090d16" roughness={0.2} metalness={0.4} />
        </mesh>

        {/* Live Active Screen Face */}
        <mesh
          position={[0, 0, 0.025]}
          onClick={handleScreenClick}
          onPointerOver={() => setHoveredButton('screen')}
          onPointerOut={() => setHoveredButton(null)}
        >
          <planeGeometry args={[2.36, 1.56]} />
          {screenTexture ? (
            <meshBasicMaterial map={screenTexture} toneMapped={false} />
          ) : (
            <meshBasicMaterial color="#050914" />
          )}
        </mesh>

        {/* Screen Glass Reflection / Glare layer */}
        <mesh position={[0, 0, 0.027]}>
          <planeGeometry args={[2.36, 1.56]} />
          <meshPhysicalMaterial
            transparent
            opacity={hoveredButton === 'screen' ? 0.08 : 0.16}
            roughness={0.05}
            transmission={0.9}
            color="#ffffff"
          />
        </mesh>
      </group>

      {/* 4. Right Controls Area: Knobs, Push Buttons & BNC Terminal Row */}
      {/* RUN / STOP Push Button */}
      <group position={[1.4, 2.2, 1.18]}>
        <mesh
          onClick={handleRunStopClick}
          onPointerOver={() => setHoveredButton('run')}
          onPointerOut={() => setHoveredButton(null)}
          scale={hoveredButton === 'run' ? [1.1, 1.1, 1.1] : [1, 1, 1]}
        >
          <boxGeometry args={[0.42, 0.22, 0.08]} />
          <meshStandardMaterial
            color={oscState.isRunning ? '#15803d' : '#b91c1c'}
            emissive={oscState.isRunning ? '#22c55e' : '#ef4444'}
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* AUTO-SET Push Button */}
      <group position={[1.4, 1.85, 1.18]}>
        <mesh
          onClick={handleAutoSetClick}
          onPointerOver={() => setHoveredButton('auto')}
          onPointerOut={() => setHoveredButton(null)}
          scale={hoveredButton === 'auto' ? [1.1, 1.1, 1.1] : [1, 1, 1]}
        >
          <boxGeometry args={[0.42, 0.22, 0.08]} />
          <meshStandardMaterial
            color="#2563eb"
            emissive="#3b82f6"
            emissiveIntensity={hoveredButton === 'auto' ? 0.8 : 0.4}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* Rotary Dials / Knobs */}
      {/* Horizontal Time/Div Knob */}
      <group position={[1.4, 1.45, 1.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0.08]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.03, 0.08, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* CH1 Volts/Div Knob (Yellow Accents) */}
      <group position={[1.0, 1.05, 1.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* CH2 Volts/Div Knob (Cyan Accents) */}
      <group position={[1.75, 1.05, 1.18]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.14, 24]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[0.1, 0.15, 16]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* 5. BNC Connectors / Inputs Row at bottom of front panel */}
      {/* CH1 BNC Jack Shield Collar */}
      <mesh position={[0.6, 0.5, 1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.16, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0.6, 0.5, 1.15]}>
        <boxGeometry args={[0.34, 0.06, 0.01]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* CH2 BNC Jack Shield Collar */}
      <mesh position={[1.2, 0.5, 1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.16, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[1.2, 0.5, 1.15]}>
        <boxGeometry args={[0.34, 0.06, 0.01]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>

      {/* GND Binding Post Collar */}
      <mesh position={[1.75, 0.5, 1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.16, 20]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Probe Compensation Lug Loop (Brass Hook) */}
      <mesh position={[-1.75, 0.5, 1.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.14, 12]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 6. Wire-able Connection Pins (CH1, CH2, GND, Probe Comp Lug) */}
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
