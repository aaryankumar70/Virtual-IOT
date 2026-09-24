import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useDroneSim, droneSimStore } from '../../core/drone/droneSimStore';
import { ModularDroneMesh } from '../../components3d/Drone/ModularDroneMesh';

export const DroneLabFlightScene: React.FC = () => {
  const {
    config,
    telemetry,
    failures,
    activeEnvironment,
    cameraMode,
    showEngineeringOverlay,
    selectedComponentPart,
  } = useDroneSim();

  const droneRootRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Run simulation integration step at 60Hz inside render tick, decoupled from state mutations
  useFrame((_, delta) => {
    // Clamp delta to avoid spiral of death on frame drops
    const dt = Math.min(delta, 0.033);
    droneSimStore.updateSimulation(dt);

    const pos = telemetry.position;
    const rot = telemetry.rotationEulerDeg;

    // Apply physical transform to drone root group
    if (droneRootRef.current) {
      droneRootRef.current.position.set(pos.x, pos.y, pos.z);
      droneRootRef.current.rotation.set(
        (rot.pitch * Math.PI) / 180,
        (rot.yaw * Math.PI) / 180,
        (rot.roll * Math.PI) / 180,
        'YXZ'
      );
    }

    // Camera following modes
    if (cameraMode === 'chase') {
      const distance = 4.8;
      const height = 1.8;
      const yawRad = (rot.yaw * Math.PI) / 180;
      // Position behind drone according to yaw
      const targetCamX = pos.x + Math.sin(yawRad) * distance;
      const targetCamY = Math.max(0.6, pos.y + height);
      const targetCamZ = pos.z + Math.cos(yawRad) * distance;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
      camera.lookAt(pos.x, pos.y + 0.3, pos.z);
    } else if (cameraMode === 'fpv') {
      // First-person nose camera
      const yawRad = (rot.yaw * Math.PI) / 180;
      const pitchRad = (rot.pitch * Math.PI) / 180;
      const forwardX = -Math.sin(yawRad);
      const forwardZ = -Math.cos(yawRad);

      camera.position.set(pos.x + forwardX * 0.3, pos.y + 0.25, pos.z + forwardZ * 0.3);
      camera.lookAt(
        pos.x + forwardX * 20,
        pos.y + 0.25 + Math.tan(pitchRad + 0.35) * 20,
        pos.z + forwardZ * 20
      );
    } else if (cameraMode === 'third_person') {
      // Fixed static vantage point tracking drone
      camera.position.lerp(new THREE.Vector3(pos.x + 6, pos.y + 4, pos.z + 8), 0.08);
      camera.lookAt(pos.x, pos.y, pos.z);
    } else if (cameraMode === 'engineering') {
      // Close inspection isometric orbit
      camera.position.lerp(new THREE.Vector3(pos.x + 3.2, pos.y + 2.4, pos.z + 3.2), 0.1);
      camera.lookAt(pos.x, pos.y + 0.2, pos.z);
    }
  });

  return (
    <>
      {/* Sky & Atmospheric Lighting */}
      <Sky
        distance={450000}
        sunPosition={[50, 40, 50]}
        inclination={0.6}
        azimuth={0.25}
      />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[25, 45, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />

      {/* Flight Field Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color={activeEnvironment.id === 'hangar' ? '#334155' : '#1e293b'}
          roughness={0.9}
        />
      </mesh>

      {/* Tarmac Launch Pad & Target Rings */}
      <group position={[0, 0.01, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[5.5, 48]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[5.2, 5.4, 48]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[2.4, 2.5, 48]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Obstacles & Slalom Pylons if enabled */}
      {(activeEnvironment.id === 'obstacles' || activeEnvironment.id === 'field') && (
        <group>
          {[
            [-15, -15],
            [15, -15],
            [-15, 15],
            [15, 15],
            [0, -25],
            [0, 25],
          ].map(([ox, oz], idx) => (
            <group key={idx} position={[ox, 0, oz]}>
              {/* Slalom Pylon Gate */}
              <mesh position={[0, 3.5, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 7.0, 16]} />
                <meshStandardMaterial color={idx % 2 === 0 ? '#ea580c' : '#ffffff'} roughness={0.4} />
              </mesh>
              {/* High visibility top beacon */}
              <mesh position={[0, 7.2, 0]}>
                <sphereGeometry args={[0.4, 16, 16]} />
                <meshBasicMaterial color="#f97316" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Simulated Wind Particle Streamers */}
      {activeEnvironment.windSpeedMps > 0 && (
        <group position={[0, 3, 0]}>
          {[-10, 0, 10].map((wx, i) => (
            <mesh
              key={i}
              position={[
                wx,
                2 + Math.sin(i * 1.5),
                (telemetry.position.z % 20) - 10,
              ]}
              rotation={[0, (activeEnvironment.windDirectionDeg * Math.PI) / 180, 0]}
            >
              <cylinderGeometry args={[0.02, 0.02, 6, 6]} />
              <meshBasicMaterial color="#94a3b8" transparent opacity={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Physics Simulated Drone Root Entity */}
      <group ref={droneRootRef} position={[0, 0.08, 0]}>
        <ModularDroneMesh
          config={config}
          telemetry={telemetry}
          failures={failures}
          showEngineeringOverlay={showEngineeringOverlay}
          selectedPartId={selectedComponentPart}
          onSelectPart={(partId) => droneSimStore.selectComponentPart(partId)}
        />
      </group>
    </>
  );
};
