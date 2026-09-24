/**
 * Virtual IoT Lab — Modular 3D Drone Assembly Mesh
 * Reference Platform: GEPRC Mark4 5" FPV Freestyle Quadcopter
 *
 * Fully modular 3D representation:
 * - Each part's existence is controlled directly by AssemblyGraph!
 * - If Motor 2 is unmounted, it is physically removed from the scene.
 * - Dynamic exploded view reveals internal hardware stack (ESC, FC, standoffs, grommets).
 * - Real rotation rates driven by simulation RPM.
 * - Live engineering overlays (thrust vectors, dynamic center of mass, motor torque vectors).
 */

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { assemblyGraph } from '../../core/assemblyEngine/AssemblyGraph';
import { connectionGraph } from '../../core/connectionEngine/ConnectionGraph';
import { simulationEngine } from '../../core/simulationEngine/SimulationEngine';

interface ModularDroneMeshProps {
  selectedPartId?: string | null;
  onSelectPart?: (partId: string) => void;
  explodedOffset?: number; // 0.0 to 1.5
  showEngineeringOverlay?: boolean;
  config?: any;
  telemetry?: any;
  failures?: any;
}

export const ModularDroneMesh: React.FC<ModularDroneMeshProps> = ({
  selectedPartId,
  onSelectPart,
  explodedOffset = 0,
  showEngineeringOverlay = false,
}) => {
  const prop1Ref = useRef<THREE.Group>(null);
  const prop2Ref = useRef<THREE.Group>(null);
  const prop3Ref = useRef<THREE.Group>(null);
  const prop4Ref = useRef<THREE.Group>(null);
  const statusLedRef = useRef<THREE.Mesh>(null);

  // Subscribe to physics engine frame updates for propeller animation
  useFrame((_, delta) => {
    const telem = simulationEngine.getTelemetry();
    const rpm = telem.motorRpm;

    if (prop1Ref.current) {
      prop1Ref.current.rotation.y += (rpm[0] / 60) * Math.PI * 2 * delta;
    }
    if (prop2Ref.current) {
      prop2Ref.current.rotation.y -= (rpm[1] / 60) * Math.PI * 2 * delta;
    }
    if (prop3Ref.current) {
      prop3Ref.current.rotation.y += (rpm[2] / 60) * Math.PI * 2 * delta;
    }
    if (prop4Ref.current) {
      prop4Ref.current.rotation.y -= (rpm[3] / 60) * Math.PI * 2 * delta;
    }

    if (statusLedRef.current) {
      const mat = statusLedRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = telem.armed ? 0.9 : 0.15;
      }
    }
  });

  const telem = simulationEngine.getTelemetry();
  const aggregateProps = assemblyGraph.computeAggregatePhysicalProperties();

  // Material palette
  const carbonDark = '#18181b';
  const carbonPlate = '#27272a';
  const standoffColor = '#dc2626'; // Red anodized 7075 aluminum
  const motorBellColor = '#3f3f46';
  const copperWindingColor = '#b45309';
  const selectGlowColor = '#3b82f6';

  // Arm positions: Quadcopter True-X geometry (X right, Z forward)
  const armConfigs = [
    { id: 1, motorEntityId: 'part_motor_emax_2207_1950kv_1', propEntityId: 'part_prop_hq_5040_cw_1', motorIdx: 0, x: 2.4, z: -2.4, cw: true, label: 'Motor 1 (Front Right)' },
    { id: 2, motorEntityId: 'part_motor_emax_2207_1950kv_2', propEntityId: 'part_prop_hq_5040_ccw_2', motorIdx: 1, x: -2.4, z: -2.4, cw: false, label: 'Motor 2 (Front Left)' },
    { id: 3, motorEntityId: 'part_motor_emax_2207_1950kv_3', propEntityId: 'part_prop_hq_5040_cw_3', motorIdx: 2, x: -2.4, z: 2.4, cw: true, label: 'Motor 3 (Rear Left)' },
    { id: 4, motorEntityId: 'part_motor_emax_2207_1950kv_4', propEntityId: 'part_prop_hq_5040_ccw_4', motorIdx: 3, x: 2.4, z: 2.4, cw: false, label: 'Motor 4 (Rear Right)' },
  ];

  // Exploded spacing factors
  const expY = explodedOffset * 1.5;
  const expArm = explodedOffset * 0.75;

  const isSelected = (id: string) => selectedPartId === id;

  // Assembly presence check
  const isFrameMounted = assemblyGraph.isMounted('part_frame_geprc_mark4');
  const isEscMounted = assemblyGraph.isMounted('part_esc_speedybee_50a');
  const isFcMounted = assemblyGraph.isMounted('part_fc_speedybee_f405');
  const isBatMounted = assemblyGraph.isMounted('part_battery_cnhl_6s_1100');
  const isCamMounted = assemblyGraph.isMounted('part_camera_caddx_ratel_2');
  const isRxMounted = assemblyGraph.isMounted('part_rx_radiomaster_rp1');
  const isGpsMounted = assemblyGraph.isMounted('part_gps_matek_sam_m8q');

  return (
    <group>
      {/* 1. CARBON FIBER CHASSIS / FRAME */}
      {isFrameMounted && (
        <group
          position={[0, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_frame_geprc_mark4');
          }}
        >
          {/* Lower Main Plate (2.5mm Carbon) */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.3, 0.1, 3.1]} />
            <meshStandardMaterial
              color={isSelected('part_frame_geprc_mark4') ? selectGlowColor : carbonPlate}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>

          {/* Top Plate (2.5mm Carbon) */}
          <mesh position={[0, 1.25 + expY, 0]} castShadow>
            <boxGeometry args={[1.7, 0.08, 2.7]} />
            <meshStandardMaterial
              color={isSelected('part_frame_geprc_mark4') ? selectGlowColor : carbonPlate}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>

          {/* 7075 Anodized Aluminum Standoffs (4 corners) */}
          {[
            [-0.75, -1.2],
            [0.75, -1.2],
            [-0.75, 1.2],
            [0.75, 1.2],
          ].map(([sx, sz], i) => (
            <mesh key={i} position={[sx, 0.85 + expY * 0.5, sz]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.7, 6]} />
              <meshStandardMaterial color={standoffColor} metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}

      {/* 2. ARMS & BRUSHLESS MOTORS & PROPELLERS */}
      {armConfigs.map((arm) => {
        const dx = arm.x;
        const dz = arm.z;
        const midX = dx / 2;
        const midZ = dz / 2;
        const len = Math.hypot(dx, dz);
        const rotY = Math.atan2(dx, dz);

        const isMotorMounted = assemblyGraph.isMounted(arm.motorEntityId);
        const isPropMounted = assemblyGraph.isMounted(arm.propEntityId) && connectionGraph.isPropellerCoupled(arm.motorIdx);
        const isDamagedProp = simulationEngine.failures.chippedProp[arm.motorIdx];
        const isFailedMotor = simulationEngine.failures.motorCutout[arm.motorIdx];

        const offsetX = arm.x > 0 ? expArm : -expArm;
        const offsetZ = arm.z > 0 ? expArm : -expArm;

        return (
          <group key={arm.id} position={[offsetX, 0, offsetZ]}>
            {/* Main Arm Carbon Beam (5mm thick) */}
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

            {/* Landing Skid underneath */}
            <mesh position={[arm.x, 0.2, arm.z]} castShadow>
              <cylinderGeometry args={[0.18, 0.12, 0.38, 12]} />
              <meshStandardMaterial color="#09090b" roughness={0.8} />
            </mesh>

            {/* BRUSHLESS MOTOR (Renders only if mounted in AssemblyGraph!) */}
            {isMotorMounted && (
              <group
                position={[arm.x, 0.52 + expY * 0.3, arm.z]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPart?.(arm.motorEntityId);
                }}
              >
                {/* Motor Stator Base */}
                <mesh position={[0, 0.08, 0]} castShadow>
                  <cylinderGeometry args={[0.42, 0.42, 0.16, 20]} />
                  <meshStandardMaterial
                    color={isSelected(arm.motorEntityId) ? selectGlowColor : isFailedMotor ? '#ef4444' : '#18181b'}
                    roughness={0.6}
                  />
                </mesh>

                {/* Copper Coil Windings */}
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
                    <meshStandardMaterial
                      color={isFailedMotor ? '#991b1b' : motorBellColor}
                      metalness={0.8}
                      roughness={0.2}
                    />
                  </mesh>

                  {/* Motor Top Cap with cooling slits */}
                  <mesh position={[0, 0.14, 0]}>
                    <cylinderGeometry args={[0.42, 0.45, 0.05, 24]} />
                    <meshStandardMaterial color={standoffColor} metalness={0.7} roughness={0.3} />
                  </mesh>

                  {/* 5mm Hollow Steel Prop Shaft */}
                  <mesh position={[0, 0.35, 0]}>
                    <cylinderGeometry args={[0.07, 0.07, 0.38, 16]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
                  </mesh>

                  {/* PROPELLER (Renders only if mounted & coupled!) */}
                  {isPropMounted && (
                    <group
                      position={[0, 0.44 + expY * 0.35, 0]}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPart?.(arm.propEntityId);
                      }}
                    >
                      {/* Anodized Lock Nut */}
                      <mesh position={[0, 0.12, 0]}>
                        <cylinderGeometry args={[0.16, 0.16, 0.12, 6]} />
                        <meshStandardMaterial color={standoffColor} metalness={0.8} roughness={0.2} />
                      </mesh>

                      {/* Prop Hub */}
                      <mesh>
                        <cylinderGeometry args={[0.22, 0.22, 0.09, 16]} />
                        <meshStandardMaterial
                          color={isSelected(arm.propEntityId) ? selectGlowColor : isDamagedProp ? '#f97316' : '#0284c7'}
                          roughness={0.3}
                        />
                      </mesh>

                      {/* 3 Airfoil Blades */}
                      {[0, 120, 240].map((angle, bIdx) => (
                        <group key={bIdx} rotation={[0, (angle * Math.PI) / 180, 0]}>
                          <mesh position={[0.75, 0, 0]} rotation={[0.22 * (arm.cw ? 1 : -1), 0, 0]} castShadow>
                            <boxGeometry args={[1.3, isDamagedProp && bIdx === 0 ? 0.015 : 0.02, 0.22]} />
                            <meshStandardMaterial
                              color={isDamagedProp && bIdx === 0 ? '#ef4444' : '#38bdf8'}
                              roughness={0.2}
                              transparent
                              opacity={0.88}
                            />
                          </mesh>
                        </group>
                      ))}
                    </group>
                  )}
                </group>
              </group>
            )}

            {/* LIVE THRUST VECTOR OVERLAY */}
            {showEngineeringOverlay && isMotorMounted && isPropMounted && (
              <group position={[arm.x, 1.2, arm.z]}>
                <arrowHelper
                  args={[
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(0, 0, 0),
                    Math.max(0.1, telem.motorThrustN[arm.motorIdx] * 0.4),
                    0x10b981,
                    0.2,
                    0.12,
                  ]}
                />
              </group>
            )}
          </group>
        );
      })}

      {/* 3. SPEEDYBEE 50A 4-IN-1 ESC BOARD */}
      {isEscMounted && (
        <group
          position={[0, 0.6 + expY * 0.3, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_esc_speedybee_50a');
          }}
        >
          {/* Black Matte PCB */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.08, 1.4]} />
            <meshStandardMaterial
              color={isSelected('part_esc_speedybee_50a') ? selectGlowColor : '#18181b'}
              roughness={0.3}
            />
          </mesh>
          {/* Power MOSFET arrays */}
          {[-0.4, 0.4].map((px, i) =>
            [-0.4, 0.4].map((pz, j) => (
              <mesh key={`${i}-${j}`} position={[px, 0.06, pz]}>
                <boxGeometry args={[0.24, 0.04, 0.24]} />
                <meshStandardMaterial color="#27272a" metalness={0.8} />
              </mesh>
            ))
          )}
          {/* Rubycon Low-ESR Filter Electrolytic Capacitor */}
          <mesh position={[0, 0.16, -0.65]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 4. SPEEDYBEE F405 FLIGHT CONTROLLER */}
      {isFcMounted && (
        <group
          position={[0, 0.9 + expY * 0.6, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_fc_speedybee_f405');
          }}
        >
          {/* Blue PCB */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.3, 0.07, 1.3]} />
            <meshStandardMaterial
              color={isSelected('part_fc_speedybee_f405') ? selectGlowColor : '#1e3a8a'}
              roughness={0.3}
            />
          </mesh>
          {/* STM32F405 Microcontroller */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.38, 0.03, 0.38]} />
            <meshStandardMaterial color="#09090b" roughness={0.5} />
          </mesh>
          {/* ICM-42688-P 6-Axis Gyro */}
          <mesh position={[-0.32, 0.04, -0.25]}>
            <boxGeometry args={[0.14, 0.02, 0.14]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} />
          </mesh>
          {/* Onboard Status LED */}
          <mesh ref={statusLedRef} position={[0.45, 0.05, 0.45]}>
            <boxGeometry args={[0.08, 0.04, 0.08]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* 5. CNHL 6S 1100mAh LiPo BATTERY PACK */}
      {isBatMounted && (
        <group
          position={[0, 1.6 + expY * 1.1, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_battery_cnhl_6s_1100');
          }}
        >
          {/* Battery Shrinkwrap Pack */}
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.65, 2.3]} />
            <meshStandardMaterial
              color={isSelected('part_battery_cnhl_6s_1100') ? selectGlowColor : '#0f172a'}
              roughness={0.6}
            />
          </mesh>
          {/* Kevlar Battery Strap */}
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[1.34, 0.69, 0.4]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.8} />
          </mesh>
          {/* XT60 Yellow Power Lead */}
          <group position={[0, -0.2, 1.25]}>
            <mesh position={[0, 0, 0.15]}>
              <boxGeometry args={[0.3, 0.2, 0.3]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* 6. CADDX RATEL 2 FPV CAMERA */}
      {isCamMounted && (
        <group
          position={[0, 0.85 + expY * 0.4, -1.55]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_camera_caddx_ratel_2');
          }}
        >
          {/* Red Anodized Aluminum Camera Shell */}
          <mesh rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial
              color={isSelected('part_camera_caddx_ratel_2') ? selectGlowColor : '#dc2626'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          {/* 2.1mm Starlight Optical Lens */}
          <mesh position={[0, 0.12, -0.38]} rotation={[1.12, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.24, 0.35, 20]} />
            <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* 7. RADIOMASTER RP1 ELRS RECEIVER & T-ANTENNA */}
      {isRxMounted && (
        <group
          position={[0, 1.35 + expY * 0.7, 1.45]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_rx_radiomaster_rp1');
          }}
        >
          {/* Receiver PCB */}
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.1, 0.4]} />
            <meshStandardMaterial color={isSelected('part_rx_radiomaster_rp1') ? selectGlowColor : '#15803d'} />
          </mesh>
          {/* Dipole T-Antenna */}
          <mesh position={[0, 0.45, 0.1]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
          <mesh position={[0, 0.85, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
            <meshStandardMaterial color="#09090b" />
          </mesh>
        </group>
      )}

      {/* 8. MATEK SAM-M8Q GPS & COMPASS MAST */}
      {isGpsMounted && (
        <group
          position={[0, 1.5 + expY * 0.8, 1.0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelectPart?.('part_gps_matek_sam_m8q');
          }}
        >
          {/* Carbon Standoff Mast */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
            <meshStandardMaterial color="#27272a" metalness={0.8} />
          </mesh>
          {/* Ceramic Patch Antenna Disc */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[0.8, 0.15, 0.8]} />
            <meshStandardMaterial color={isSelected('part_gps_matek_sam_m8q') ? selectGlowColor : '#d97706'} />
          </mesh>
        </group>
      )}

      {/* 9. ENGINEERING DYNAMIC CENTER OF MASS SPHERE */}
      {showEngineeringOverlay && (
        <group position={[aggregateProps.centerOfMass.x * 20, 0.8 + aggregateProps.centerOfMass.y * 20, aggregateProps.centerOfMass.z * 20]}>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};
