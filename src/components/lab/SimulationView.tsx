/**
 * Virtual IoT Lab — Live Flight Simulation Arena
 *
 * Real 6-DOF physics integration, virtual radio transmitter gimbals,
 * Betaflight-style FPV OSD HUD, live motor RPM / thrust bars,
 * environmental wind generator, and fault injection suite.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { ModularDroneMesh } from '../../components3d/Drone/ModularDroneMesh';
import { simulationEngine, DomainTelemetry } from '../../core/simulationEngine/SimulationEngine';
import { useLabStore, labStore } from '../../core/labStore';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Wind,
  AlertTriangle,
  Sliders,
  Shield,
  Zap,
  Radio,
  Gauge,
  Compass,
} from 'lucide-react';

// Inner component to position the drone rigid body in Three.js and manage cameras
const FlightDroneRigidBody: React.FC<{
  cameraMode: 'chase' | 'fpv' | 'orbit' | 'engineering';
  showEngineeringOverlay: boolean;
}> = ({ cameraMode, showEngineeringOverlay }) => {
  const droneGroupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }, delta) => {
    // Step simulation physics (e.g. 60Hz delta)
    const telem = simulationEngine.step(delta);

    if (droneGroupRef.current) {
      // Position drone group in 3D world (scaling meter units to world)
      droneGroupRef.current.position.set(telem.position.x * 5, telem.position.y * 5, telem.position.z * 5);

      // Orientation Euler angles (Roll, Yaw, Pitch)
      droneGroupRef.current.rotation.set(telem.orientation.pitchRad, telem.orientation.yawRad, telem.orientation.rollRad);

      // Handle Camera follow modes
      if (cameraMode === 'chase') {
        const dronePos = droneGroupRef.current.position;
        const targetCamPos = new THREE.Vector3(
          dronePos.x - Math.sin(telem.orientation.yawRad) * 4.5,
          dronePos.y + 2.2,
          dronePos.z - Math.cos(telem.orientation.yawRad) * 4.5
        );
        camera.position.lerp(targetCamPos, 0.1);
        camera.lookAt(dronePos.x, dronePos.y + 0.5, dronePos.z);
      } else if (cameraMode === 'fpv') {
        // Cockpit camera positioned inside FPV camera shell
        const dronePos = droneGroupRef.current.position;
        camera.position.set(
          dronePos.x + Math.sin(telem.orientation.yawRad) * 0.4,
          dronePos.y + 0.35,
          dronePos.z + Math.cos(telem.orientation.yawRad) * 0.4
        );
        const lookTarget = new THREE.Vector3(
          dronePos.x + Math.sin(telem.orientation.yawRad) * 20,
          dronePos.y + 0.35 - Math.sin(telem.orientation.pitchRad) * 10,
          dronePos.z + Math.cos(telem.orientation.yawRad) * 20
        );
        camera.lookAt(lookTarget);
      } else if (cameraMode === 'engineering') {
        const dronePos = droneGroupRef.current.position;
        camera.position.set(dronePos.x, dronePos.y + 7.5, dronePos.z + 0.1);
        camera.lookAt(dronePos.x, dronePos.y, dronePos.z);
      }
    }
  });

  return (
    <group ref={droneGroupRef}>
      <ModularDroneMesh showEngineeringOverlay={showEngineeringOverlay} />
    </group>
  );
};

export const SimulationView: React.FC = () => {
  const { cameraMode, showEngineeringOverlay, flightMode } = useLabStore();
  const [telem, setTelem] = useState<DomainTelemetry>(() => simulationEngine.getTelemetry());
  const [throttle, setThrottle] = useState(0);
  const [roll, setRoll] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [isArmed, setIsArmed] = useState(false);

  // Subscribe to telemetry ticks
  useEffect(() => {
    return simulationEngine.subscribe(() => {
      setTelem(simulationEngine.getTelemetry());
    });
  }, []);

  // Update simulation control inputs
  useEffect(() => {
    simulationEngine.inputs.throttle = throttle;
    simulationEngine.inputs.roll = roll;
    simulationEngine.inputs.pitch = pitch;
    simulationEngine.inputs.yaw = yaw;
    simulationEngine.inputs.armSwitch = isArmed;
  }, [throttle, roll, pitch, yaw, isArmed]);

  const handleArmToggle = () => {
    if (!isArmed && throttle > 0.05) {
      alert('Safety Guard: Throttle must be at 0% to arm flight controller!');
      return;
    }
    setIsArmed(!isArmed);
  };

  const resetDrone = () => {
    simulationEngine.resetFlightState(0.08);
    setThrottle(0);
    setRoll(0);
    setPitch(0);
    setYaw(0);
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Sim Status & Arm Switch */}
        <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl shadow-lg">
          <button
            onClick={handleArmToggle}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold tracking-wider transition-all flex items-center gap-1.5 ${
              isArmed
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {isArmed ? 'DISARM DRONE' : 'ARM MOTORS'}
          </button>

          <button
            onClick={resetDrone}
            className="text-xs px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Flight
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Flight Mode Tag */}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
            MODE: {flightMode.toUpperCase()}
          </span>

          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded ${
              telem.isGrounded ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {telem.isGrounded ? 'GROUNDED' : 'AIRBORNE'}
          </span>
        </div>

        {/* Right: Camera Selector & Overlays */}
        <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-xl shadow-lg">
          <div className="flex items-center gap-1">
            {(['chase', 'fpv', 'orbit', 'engineering'] as const).map((cam) => (
              <button
                key={cam}
                onClick={() => labStore.setCameraMode(cam)}
                className={`text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                  cameraMode === cam
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                }`}
              >
                {cam}
              </button>
            ))}
          </div>

          <button
            onClick={() => labStore.toggleEngineeringOverlay()}
            className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
              showEngineeringOverlay
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            Vectors
          </button>
        </div>
      </div>

      {/* 3D Simulation Canvas */}
      <div className="flex-1 w-full h-full">
        <Canvas
          shadows
          camera={{ position: [0, 2.5, 6], fov: 50 }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow shadow-mapSize={2048} />
          <hemisphereLight intensity={0.35} groundColor="#18181b" />

          {/* Test Flight Grid Arena Floor */}
          <gridHelper args={[60, 60, '#38bdf8', '#27272a']} position={[0, 0, 0]} />

          {/* Launch Pad */}
          <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.0, 32]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>

          {/* FPV Racing Obstacle Gates */}
          {[
            [0, 2.0, -10],
            [10, 2.5, -15],
            [-10, 2.0, -20],
          ].map(([gx, gy, gz], idx) => (
            <group key={idx} position={[gx, gy, gz]}>
              <mesh>
                <torusGeometry args={[1.8, 0.1, 16, 32]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
              </mesh>
            </group>
          ))}

          {/* Physics Drone Entity */}
          <FlightDroneRigidBody cameraMode={cameraMode} showEngineeringOverlay={showEngineeringOverlay} />

          {cameraMode === 'orbit' && <OrbitControls maxPolarAngle={Math.PI / 2 - 0.05} />}
        </Canvas>
      </div>

      {/* FPV OSD Overlay (Shown in FPV camera mode) */}
      {cameraMode === 'fpv' && (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 font-mono text-emerald-400 text-xs text-shadow-sm select-none">
          <div className="flex justify-between items-start">
            <div className="space-y-1 bg-black/40 backdrop-blur-xs p-2 rounded border border-emerald-500/30">
              <div>ARM: {telem.armed ? 'ARMED' : 'DISARMED'}</div>
              <div>MODE: {flightMode.toUpperCase()}</div>
              <div>ELRS 500Hz -82dBm</div>
            </div>
            <div className="space-y-1 bg-black/40 backdrop-blur-xs p-2 rounded border border-emerald-500/30 text-right">
              <div>{(telem.batteryLoadedVoltageV).toFixed(2)}V</div>
              <div>{(telem.batteryCurrentA).toFixed(1)}A</div>
              <div>{Math.round(telem.batteryConsumedMah)} mAh</div>
            </div>
          </div>

          {/* Center Artificial Horizon Reticle */}
          <div className="self-center flex flex-col items-center">
            <div className="w-24 h-0.5 bg-emerald-400/80 mb-1" />
            <div className="text-[10px]">R: {((telem.orientation.rollRad * 180) / Math.PI).toFixed(0)}° P: {((telem.orientation.pitchRad * 180) / Math.PI).toFixed(0)}°</div>
          </div>

          <div className="flex justify-between items-end">
            <div className="bg-black/40 backdrop-blur-xs p-2 rounded border border-emerald-500/30">
              <div>ALT: {telem.position.y.toFixed(2)} m</div>
              <div>SPD: {(telem.speedMps * 3.6).toFixed(1)} km/h</div>
            </div>
            <div className="bg-black/40 backdrop-blur-xs p-2 rounded border border-emerald-500/30 text-right">
              <div>T/W: {telem.thrustToWeightRatio}x</div>
              <div>THR: {Math.round(throttle * 100)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Instrumentation & Radio Controller Gimbals */}
      <div className="absolute bottom-3 left-3 right-3 z-20 grid grid-cols-1 md:grid-cols-4 gap-3 pointer-events-none">
        {/* Panel 1: Virtual Radio Transmitter Stick Controls */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              Radio Gimbals
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Mode 2</span>
          </div>

          {/* Throttle Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Throttle (Left Y)</span>
              <span className="font-mono text-zinc-200 font-bold">{Math.round(throttle * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={throttle}
              onChange={(e) => setThrottle(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          {/* Roll Slider */}
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Roll (Right X)</span>
              <span className="font-mono text-zinc-200">{roll > 0 ? `+${(roll * 100).toFixed(0)}%` : `${(roll * 100).toFixed(0)}%`}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={roll}
              onChange={(e) => setRoll(parseFloat(e.target.value))}
              onMouseUp={() => setRoll(0)}
              className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          {/* Pitch Slider */}
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Pitch (Right Y)</span>
              <span className="font-mono text-zinc-200">{pitch > 0 ? `+${(pitch * 100).toFixed(0)}%` : `${(pitch * 100).toFixed(0)}%`}</span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.02"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              onMouseUp={() => setPitch(0)}
              className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Panel 2: Live Motor RPM Bars */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              Motor RPM Telemetry
            </span>
            <span className="text-[10px] font-mono text-zinc-400">DShot600</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[0, 1, 2, 3].map((idx) => {
              const rpm = telem.motorRpm[idx];
              const maxRpm = 38000;
              const pct = Math.min(100, (rpm / maxRpm) * 100);
              const hasMotor = telem.motorPresent[idx];
              const hasProp = telem.propellerPresent[idx];

              return (
                <div key={idx} className="bg-zinc-950 p-1.5 rounded border border-zinc-800 flex flex-col items-center">
                  <span className="text-[10px] font-medium text-zinc-400">M{idx + 1}</span>
                  <div className="w-full bg-zinc-800 h-14 rounded my-1 relative overflow-hidden flex items-end">
                    <div
                      className={`w-full transition-all ${
                        !hasMotor || !hasProp
                          ? 'bg-amber-500'
                          : idx === 0 || idx === 2
                          ? 'bg-sky-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-zinc-200">{Math.round(rpm)}</span>
                  <span className="text-[9px] text-zinc-400 font-mono">{telem.motorThrustN[idx].toFixed(1)}N</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3: Electrical Power & Voltage Sag Meter */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Electrical Power & Sag
            </span>
            <span className="text-[10px] font-mono text-zinc-400">CNHL 6S</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Pack Terminal Voltage:</span>
                <span className="font-mono font-bold text-amber-300">{telem.batteryLoadedVoltageV.toFixed(2)} V</span>
              </div>
              {/* Sag bar */}
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, (telem.batteryLoadedVoltageV / 25.2) * 100))}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Current Draw</div>
                <div className="font-mono font-semibold text-zinc-200">{telem.batteryCurrentA.toFixed(1)} A</div>
              </div>
              <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Power Output</div>
                <div className="font-mono font-semibold text-zinc-200">
                  {(telem.batteryLoadedVoltageV * telem.batteryCurrentA).toFixed(0)} W
                </div>
              </div>
              <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400">Total Thrust</div>
                <div className="font-mono font-semibold text-emerald-400">{telem.totalThrustN.toFixed(1)} N</div>
              </div>
              <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800">
                <div className="text-[10px] text-zinc-400">T/W Ratio</div>
                <div className="font-mono font-semibold text-sky-400">{telem.thrustToWeightRatio}x</div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Fault Injection Suite */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-xl pointer-events-auto shadow-xl">
          <div className="flex items-center justify-between text-xs text-rose-400 font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Fault Injection Suite
            </span>
            <span className="text-[10px] font-mono text-zinc-400">Break & Test</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Motor 2 Cutout:</span>
              <button
                onClick={() => {
                  simulationEngine.failures.motorCutout[1] = !simulationEngine.failures.motorCutout[1];
                  setTelem(simulationEngine.getTelemetry());
                }}
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  simulationEngine.failures.motorCutout[1]
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {simulationEngine.failures.motorCutout[1] ? 'FAILED' : 'NOMINAL'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Prop 1 Chipped (-45% T):</span>
              <button
                onClick={() => {
                  simulationEngine.failures.chippedProp[0] = !simulationEngine.failures.chippedProp[0];
                  setTelem(simulationEngine.getTelemetry());
                }}
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  simulationEngine.failures.chippedProp[0]
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {simulationEngine.failures.chippedProp[0] ? 'CHIPPED' : 'INTACT'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300">RC Link Lost:</span>
              <button
                onClick={() => {
                  simulationEngine.failures.receiverLost = !simulationEngine.failures.receiverLost;
                  setTelem(simulationEngine.getTelemetry());
                }}
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  simulationEngine.failures.receiverLost
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {simulationEngine.failures.receiverLost ? 'FAILSAFE' : 'CONNECTED'}
              </button>
            </div>

            {/* Environmental Wind Control */}
            <div className="pt-1 border-t border-zinc-800/80">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  Wind Speed
                </span>
                <span className="font-mono text-zinc-200">{simulationEngine.env.windSpeedMps} m/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                value={simulationEngine.env.windSpeedMps}
                onChange={(e) => {
                  simulationEngine.env.windSpeedMps = parseFloat(e.target.value);
                  setTelem(simulationEngine.getTelemetry());
                }}
                className="w-full accent-cyan-500 h-1.5 bg-zinc-800 rounded cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
