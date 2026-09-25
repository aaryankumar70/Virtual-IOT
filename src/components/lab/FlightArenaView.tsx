/**
 * Virtual IoT Lab — Dedicated 3D Flight Arena (FLY Mode)
 *
 * Full 6-DOF physics aircraft simulation, virtual radio transmitter gimbals,
 * Betaflight-style FPV OSD HUD, live motor RPM / thrust bars,
 * environmental wind generator, and fault injection suite.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ModularDroneMesh } from '../../components3d/Drone/ModularDroneMesh';
import { simulationEngine, DomainTelemetry } from '../../core/simulationEngine/SimulationEngine';
import { environmentEngine } from '../../core/environmentEngine/EnvironmentEngine';
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

export const FlightArenaView: React.FC = () => {
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
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
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
            className="text-xs px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Position
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

          <button
            onClick={() => labStore.toggleEngineeringOverlay()}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
              showEngineeringOverlay
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Vectors & CoM</span>
          </button>
        </div>

        {/* Center: Flight Mode & Atmosphere Indicator */}
        <div className="flex items-center gap-2 pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3.5 py-1.5 rounded-xl shadow-lg text-xs font-mono">
          <span className="text-zinc-400">FLIGHT MODE:</span>
          <span className="text-sky-400 font-bold uppercase">{flightMode}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">ENV:</span>
          <span className="text-emerald-400 font-semibold">{environmentEngine.activePresetId.replace('-', ' ')}</span>
        </div>

        {/* Right: Camera Switcher */}
        <div className="flex items-center gap-1 pointer-events-auto bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1 rounded-xl shadow-lg">
          {(['chase', 'fpv', 'orbit', 'engineering'] as const).map((cam) => (
            <button
              key={cam}
              onClick={() => labStore.setCameraMode(cam)}
              className={`text-xs px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                cameraMode === cam
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Canvas Flight Arena */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [0, 4, 8], fov: 50, near: 0.1, far: 500 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[15, 25, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-15, 10, -10]} intensity={0.4} />

          {/* Sky & Environment */}
          <color attach="background" args={['#090d16']} />
          <fog attach="fog" args={['#090d16', 30, 180]} />

          {/* Grid Ground Runway */}
          <gridHelper args={[200, 100, '#38bdf8', '#1e293b']} position={[0, 0, 0]} />

          {/* Flight Arena Obstacle Course Gate Pillars */}
          {[
            [-10, 0, -20],
            [10, 0, -20],
            [-15, 0, -50],
            [15, 0, -50],
            [0, 0, -80],
          ].map(([gx, gy, gz], idx) => (
            <group key={idx} position={[gx, gy, gz]}>
              <mesh position={[0, 5, 0]}>
                <torusGeometry args={[4, 0.25, 12, 32]} />
                <meshStandardMaterial
                  color="#0284c7"
                  emissive="#0284c7"
                  emissiveIntensity={0.6}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 1, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 2, 12]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
            </group>
          ))}

          {/* The Live Drone Rigid Body with 6-DOF Integration */}
          <FlightDroneRigidBody
            cameraMode={cameraMode}
            showEngineeringOverlay={showEngineeringOverlay}
          />
        </Canvas>

        {/* Betaflight-style FPV OSD HUD Layer (when in FPV or Orbit) */}
        {cameraMode === 'fpv' && (
          <div className="absolute inset-0 pointer-events-none font-mono text-xs text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <div className="tracking-wider font-bold">GEPRC MARK4 5"</div>
                <div>SPD: {(telem.speedMps * 3.6).toFixed(1)} KM/H</div>
                <div>ALT: {Math.max(0, telem.position.y - 0.08).toFixed(2)} M</div>
              </div>
              <div className="text-center">
                <div className="text-emerald-400 font-bold">{isArmed ? 'ARMED [ACRO]' : 'DISARMED'}</div>
                <div>AIR: {environmentEngine.airDensityKgM3} KG/M³</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-amber-400">{telem.batteryLoadedVoltageV.toFixed(2)}V (6S)</div>
                <div>{telem.batteryCurrentA.toFixed(1)}A | {Math.round(telem.batteryConsumedMah)} MAH</div>
                <div>WIND: {environmentEngine.wind.speedMps} M/S</div>
              </div>
            </div>

            {/* Artificial Horizon Pitch Ladder */}
            <div className="self-center flex flex-col items-center">
              <div className="w-16 h-[2px] bg-white/70 mb-1" />
              <div className="text-[10px]">-- 0 --</div>
              <div className="w-16 h-[2px] bg-white/70 mt-1" />
            </div>

            <div className="flex justify-between items-end">
              <div>THR: {Math.round(throttle * 100)}%</div>
              <div className="text-center text-[10px] text-zinc-400">RC RSSI: 99% (CRSF 2.4GHz)</div>
              <div>T/W: {telem.thrustToWeightRatio.toFixed(2)} : 1</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Transmitter Gimbals & Telemetry Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between pointer-events-none">
        {/* Left Gimbal (Mode 2: Throttle & Yaw) */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-zinc-400 mb-1">Throttle (Y) & Yaw (X)</span>
            <div className="relative w-28 h-28 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center">
              {/* Grid crosshairs */}
              <div className="absolute inset-x-0 h-[1px] bg-zinc-800" />
              <div className="absolute inset-y-0 w-[1px] bg-zinc-800" />
              {/* Virtual Gimbal Stick Thumb */}
              <div
                className="w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-md shadow-sky-500/50 absolute"
                style={{
                  left: `${((yaw + 1) / 2) * 88 + 6}px`,
                  bottom: `${throttle * 88 + 6}px`,
                }}
              />
            </div>
            <div className="flex justify-between w-full text-[10px] text-zinc-400 font-mono mt-1">
              <span>THR: {Math.round(throttle * 100)}%</span>
              <span>YAW: {yaw.toFixed(2)}</span>
            </div>
          </div>

          {/* Throttle Slider for easy desktop control */}
          <div className="flex flex-col items-center h-28 justify-between">
            <span className="text-[10px] text-zinc-500">100%</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={throttle}
              onChange={(e) => setThrottle(parseFloat(e.target.value))}
              className="h-20 -rotate-90 w-20 accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500">0%</span>
          </div>
        </div>

        {/* Center: Live 4-Motor Thrust & Dynamics Cluster */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-5 py-3 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-6">
          {/* Motor RPM Gauges */}
          <div className="grid grid-cols-2 gap-2 text-center">
            {telem.motorRpm.map((rpm, idx) => (
              <div key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800/80 min-w-[72px]">
                <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-semibold">
                  <span>M{idx + 1}</span>
                  <span className="text-[9px] text-sky-400 font-mono">
                    {telem.motorThrustN[idx].toFixed(1)}N
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
                  {Math.round(rpm)}
                </div>
                <div className="w-full bg-zinc-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(100, (rpm / 35000) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Aggregated Physics Metrics */}
          <div className="flex flex-col gap-1.5 border-l border-zinc-800 pl-4 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Total Thrust:</span>
              <span className="text-sky-400 font-bold">{telem.totalThrustN.toFixed(2)} N</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">AUW Mass:</span>
              <span className="text-zinc-200 font-semibold">{Math.round(telem.totalMassKg * 1000)} g</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">T/W Ratio:</span>
              <span className={`font-bold ${telem.thrustToWeightRatio >= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {telem.thrustToWeightRatio.toFixed(2)} : 1
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-400">Bat Sag:</span>
              <span className="text-amber-400 font-semibold">{telem.batteryLoadedVoltageV.toFixed(2)} V</span>
            </div>
          </div>
        </div>

        {/* Right Gimbal (Mode 2: Pitch & Roll) */}
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-3 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-zinc-400 mb-1">Pitch (Y) & Roll (X)</span>
            <div
              className="relative w-28 h-28 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-center cursor-crosshair select-none"
              onMouseMove={(e) => {
                if (e.buttons === 1) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                  const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
                  setRoll(Math.max(-1, Math.min(1, nx)));
                  setPitch(Math.max(-1, Math.min(1, ny)));
                }
              }}
              onMouseUp={() => {
                setRoll(0);
                setPitch(0);
              }}
            >
              {/* Grid crosshairs */}
              <div className="absolute inset-x-0 h-[1px] bg-zinc-800" />
              <div className="absolute inset-y-0 w-[1px] bg-zinc-800" />
              {/* Virtual Gimbal Stick Thumb */}
              <div
                className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-md shadow-emerald-500/50 absolute"
                style={{
                  left: `${((roll + 1) / 2) * 88 + 6}px`,
                  bottom: `${((pitch + 1) / 2) * 88 + 6}px`,
                }}
              />
            </div>
            <div className="flex justify-between w-full text-[10px] text-zinc-400 font-mono mt-1">
              <span>ROL: {roll.toFixed(2)}</span>
              <span>PIT: {pitch.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
