import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { ConnectorMesh } from '../../scene/World/ConnectorMesh';

interface ComponentMeshProps {
  component: VirtualComponent;
}

export const DroneMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const isPowered = Boolean(component.state?.powered ?? true);
  const isArmed = Boolean(component.state?.armed ?? false);
  const throttle = typeof component.state?.throttle === 'number' ? component.state.throttle : 0;

  // Motor prop rotation refs
  const prop1Ref = useRef<THREE.Group>(null);
  const prop2Ref = useRef<THREE.Group>(null);
  const prop3Ref = useRef<THREE.Group>(null);
  const prop4Ref = useRef<THREE.Group>(null);

  // Status blinker animation
  const statusLedRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const speed = isArmed ? 15 + throttle * 40 : throttle > 0 ? throttle * 30 : 0;
    if (speed > 0) {
      if (prop1Ref.current) prop1Ref.current.rotation.y += speed * delta;
      if (prop2Ref.current) prop2Ref.current.rotation.y -= speed * delta;
      if (prop3Ref.current) prop3Ref.current.rotation.y += speed * delta;
      if (prop4Ref.current) prop4Ref.current.rotation.y -= speed * delta;
    }

    if (statusLedRef.current && isPowered) {
      const t = state.clock.getElapsedTime();
      const blink = Math.sin(t * (isArmed ? 8 : 2)) > 0;
      const mat = statusLedRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = blink ? 0.9 : 0.1;
      }
    }
  });

  // Carbon fiber material colors
  const carbonDark = '#18181b';
  const carbonPlate = '#27272a';
  const standoffColor = '#dc2626'; // Anodized red hex standoffs
  const motorBellColor = '#3f3f46';
  const copperWindingColor = '#b45309';

  // Arm positions: Quadcopter X-geometry, radius ~3.6 units
  const armConfigs = [
    { id: 1, angle: Math.PI / 4, x: 2.5, z: -2.5, cw: true, label: 'M1' }, // Front Right
    { id: 2, angle: (3 * Math.PI) / 4, x: -2.5, z: -2.5, cw: false, label: 'M2' }, // Front Left
    { id: 3, angle: (5 * Math.PI) / 4, x: -2.5, z: 2.5, cw: true, label: 'M3' }, // Rear Left
    { id: 4, angle: (7 * Math.PI) / 4, x: 2.5, z: 2.5, cw: false, label: 'M4' }, // Rear Right
  ];

  return (
    <group>
      {/* 1. CENTRAL CARBON FIBER CHASSIS */}
      {/* Lower Main Plate */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.1, 3.2]} />
        <meshStandardMaterial color={carbonPlate} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Top Plate */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 2.8]} />
        <meshStandardMaterial color={carbonPlate} roughness={0.35} metalness={0.2} />
      </mesh>

      {/* Anodized Aluminum Standoffs (4 corners) */}
      {[
        [-0.75, -1.2],
        [0.75, -1.2],
        [-0.75, 1.2],
        [0.75, 1.2],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx, 0.85, sz]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 6]} />
          <meshStandardMaterial color={standoffColor} metalness={0.85} roughness={0.2} />
        </mesh>
      ))}

      {/* 2. CARBON FIBER ARMS (X Frame) */}
      {armConfigs.map((arm) => {
        const dx = arm.x;
        const dz = arm.z;
        const midX = dx / 2;
        const midZ = dz / 2;
        const len = Math.hypot(dx, dz);
        const rotY = Math.atan2(dx, dz);

        return (
          <group key={arm.id}>
            {/* Main Arm Beam */}
            <group position={[midX, 0.45, midZ]} rotation={[0, rotY, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[0.42, 0.12, len]} />
                <meshStandardMaterial color={carbonDark} roughness={0.4} metalness={0.2} />
              </mesh>
            </group>

            {/* Motor Mount Disc at arm tip */}
            <mesh position={[arm.x, 0.45, arm.z]} castShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
              <meshStandardMaterial color={carbonPlate} roughness={0.4} metalness={0.2} />
            </mesh>

            {/* Landing Skid / Foot Pad underneath */}
            <mesh position={[arm.x, 0.2, arm.z]} castShadow>
              <cylinderGeometry args={[0.18, 0.12, 0.38, 12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>

            {/* 3. BRUSHLESS MOTORS */}
            <group position={[arm.x, 0.52, arm.z]}>
              {/* Motor Stator Base */}
              <mesh position={[0, 0.08, 0]} castShadow>
                <cylinderGeometry args={[0.42, 0.42, 0.16, 20]} />
                <meshStandardMaterial color="#18181b" roughness={0.6} />
              </mesh>

              {/* Copper Coil Windings inside */}
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.36, 0.36, 0.15, 16]} />
                <meshStandardMaterial color={copperWindingColor} metalness={0.8} roughness={0.3} />
              </mesh>

              {/* Rotating Motor Bell */}
              <group
                ref={
                  arm.id === 1
                    ? prop1Ref
                    : arm.id === 2
                    ? prop2Ref
                    : arm.id === 3
                    ? prop3Ref
                    : prop4Ref
                }
                position={[0, 0.28, 0]}
              >
                <mesh castShadow>
                  <cylinderGeometry args={[0.45, 0.45, 0.24, 24]} />
                  <meshStandardMaterial color={motorBellColor} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* Motor Top Cap with cooling slits */}
                <mesh position={[0, 0.14, 0]}>
                  <cylinderGeometry args={[0.42, 0.45, 0.05, 24]} />
                  <meshStandardMaterial color={standoffColor} metalness={0.7} roughness={0.3} />
                </mesh>

                {/* 5mm Prop Shaft */}
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.07, 0.07, 0.38, 16]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Anodized Lock Nut */}
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.16, 0.16, 0.12, 6]} />
                  <meshStandardMaterial color={standoffColor} metalness={0.8} roughness={0.2} />
                </mesh>

                {/* 4. PROPELLERS (5" 3-Blade Airfoil) */}
                <group position={[0, 0.44, 0]}>
                  {/* Prop Hub */}
                  <mesh>
                    <cylinderGeometry args={[0.22, 0.22, 0.09, 16]} />
                    <meshStandardMaterial color="#0284c7" roughness={0.3} />
                  </mesh>

                  {/* 3 Blades at 120 degree angles */}
                  {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((bAngle, bIdx) => (
                    <group key={bIdx} rotation={[0, bAngle, 0]}>
                      <mesh position={[0.75, 0, 0]} rotation={[0.15 * (arm.cw ? 1 : -1), 0, 0]} castShadow>
                        <boxGeometry args={[1.3, 0.03, 0.24]} />
                        <meshStandardMaterial
                          color="#0284c7"
                          roughness={0.25}
                          transparent
                          opacity={0.92}
                        />
                      </mesh>
                    </group>
                  ))}
                </group>
              </group>
            </group>
          </group>
        );
      })}

      {/* 4. FLIGHT CONTROLLER & ESC STACK (Center) */}
      <group position={[0, 0.65, 0]}>
        {/* 4-in-1 ESC Board (Lower) */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.1, 0.08, 1.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* Rubber Damping Anti-Vibration Grommets */}
        {[
          [-0.45, -0.45],
          [0.45, -0.45],
          [-0.45, 0.45],
          [0.45, 0.45],
        ].map(([gx, gz], i) => (
          <mesh key={i} position={[gx, 0.1, gz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.14, 12]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.8} />
          </mesh>
        ))}

        {/* Flight Controller Board (Upper 30.5x30.5mm PCB) */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.15, 0.08, 1.15]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
        </mesh>

        {/* STM32F4/F7 Microcontroller Chip */}
        <mesh position={[0, 0.27, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 0.42]} />
          <meshStandardMaterial color="#09090b" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Gyro/IMU Chip */}
        <mesh position={[-0.3, 0.26, 0.2]}>
          <boxGeometry args={[0.18, 0.04, 0.18]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* Power Status LED (Blue) */}
        <mesh position={[0.35, 0.26, -0.3]}>
          <boxGeometry args={[0.08, 0.04, 0.08]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive={isPowered ? '#2563eb' : '#000000'}
            emissiveIntensity={isPowered ? 0.9 : 0.05}
          />
        </mesh>

        {/* Status Activity LED (Blinking Green) */}
        <mesh ref={statusLedRef} position={[0.35, 0.26, -0.15]}>
          <boxGeometry args={[0.08, 0.04, 0.08]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#16a34a"
            emissiveIntensity={isPowered ? 0.7 : 0.05}
          />
        </mesh>

        {/* Micro-USB Telemetry Port on side of FC */}
        <mesh position={[-0.58, 0.2, 0]}>
          <boxGeometry args={[0.12, 0.12, 0.28]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>

      {/* 5. FPV CAMERA & FRONT MOUNT */}
      <group position={[0, 0.85, -1.3]}>
        {/* TPU Vibration Isolation Mount */}
        <mesh castShadow>
          <boxGeometry args={[0.85, 0.45, 0.35]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>

        {/* Camera Sensor Body */}
        <mesh position={[0, 0.05, -0.15]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.65, 0.4, 0.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.4} />
        </mesh>

        {/* Optical Glass Lens Barrel */}
        <group position={[0, 0.1, -0.38]} rotation={[-0.25, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.22, 20]} />
            <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Glass Lens Element */}
          <mesh position={[0, 0.11, 0]}>
            <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* 6. REAR GPS MODULE & TPU MAST */}
      <group position={[0, 1.3, 1.2]}>
        {/* TPU 30-degree Angled Mast */}
        <mesh position={[0, 0.35, 0.2]} rotation={[0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.7, 0.25]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
        {/* GPS Sensor Base PCB */}
        <group position={[0, 0.65, 0.35]} rotation={[0.45, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.1, 0.85]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
          </mesh>
          {/* High-Gain Ceramic Patch Antenna */}
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.65, 0.15, 0.65]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          {/* Center Metallization Dot */}
          <mesh position={[0, 0.205, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* 7. EXPRESSLRS (ELRS) 2.4GHz RECEIVER & DIPOLE T-ANTENNA */}
      <group position={[0, 1.0, 1.3]}>
        {/* Black Heatshrink Micro Receiver Body */}
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.14, 0.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Dipole T-Antenna Horizontal Element */}
        <mesh position={[0, 0.4, 0.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.6, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
        {/* Antenna Coaxial Stem */}
        <mesh position={[0, 0.2, 0.25]} rotation={[0.5, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 10]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.5} />
        </mesh>
      </group>

      {/* 8. 35V 1000uF LOW-ESR RUBYCON FILTER CAPACITOR */}
      <group position={[-0.45, 0.65, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
        {/* Negative Stripe */}
        <mesh position={[-0.18, 0, 0]}>
          <boxGeometry args={[0.06, 0.58, 0.1]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      </group>

      {/* 9. REAR XT60 POWER PIGTAIL LEADS */}
      <group position={[0, 0.5, 1.4]}>
        {/* Red Power Lead (+11.1V / +14.8V) */}
        <mesh position={[-0.12, 0.06, 0.3]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.65, 14]} />
          <meshStandardMaterial color="#dc2626" roughness={0.6} />
        </mesh>
        {/* Black Ground Lead */}
        <mesh position={[0.12, 0.06, 0.3]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.65, 14]} />
          <meshStandardMaterial color="#18181b" roughness={0.6} />
        </mesh>
      </group>

      {/* 10. CONNECTORS & PINS */}
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
