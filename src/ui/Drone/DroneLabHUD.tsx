import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Power,
  Layers,
  Sliders,
  Wind,
  AlertTriangle,
  Play,
  Square,
  BookmarkPlus,
  Compass,
  Zap,
  Gauge,
  Eye,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { useDroneSim, droneSimStore, DroneCameraMode } from '../../core/drone/droneSimStore';
import {
  DRONE_MOTORS_CATALOG,
  DRONE_PROPELLERS_CATALOG,
  DRONE_BATTERIES_CATALOG,
} from '../../core/drone/droneCatalog';

export const DroneLabHUD: React.FC = () => {
  const sim = useDroneSim();
  const {
    config,
    telemetry,
    failures,
    controlInputs,
    cameraMode,
    showEngineeringOverlay,
    selectedSubsystemTab,
    activeEnvironment,
    isRecording,
    savedExperiments,
    comparisonConfig,
  } = sim;

  const [showControlsModal, setShowControlsModal] = useState(false);
  const [showInspectorModal, setShowInspectorModal] = useState(false);

  // Keyboard controls listener (W/S=Throttle, A/D=Yaw, Arrows or I/K/J/L=Pitch/Roll, Space=Arm toggle)
  useEffect(() => {
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      keysDown.add(e.code);

      if (e.code === 'Space') {
        e.preventDefault();
        droneSimStore.toggleArmed();
        return;
      }
      if (e.code === 'KeyR') {
        droneSimStore.resetFlightPosition();
        return;
      }
      if (e.code === 'KeyC') {
        const modes: DroneCameraMode[] = ['chase', 'fpv', 'third_person', 'engineering'];
        const currentIdx = modes.indexOf(sim.cameraMode);
        droneSimStore.setCameraMode(modes[(currentIdx + 1) % modes.length]);
        return;
      }
      if (e.code === 'KeyO') {
        droneSimStore.toggleEngineeringOverlay();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.code);
    };

    // Continuous poll for smooth control stick inputs
    const interval = setInterval(() => {
      if (!sim.isActive) return;

      let throttleDelta = 0;
      let roll = 0;
      let pitch = 0;
      let yaw = 0;

      // Throttle: W/S or KeyE/KeyQ
      if (keysDown.has('KeyW')) throttleDelta += 0.025;
      if (keysDown.has('KeyS')) throttleDelta -= 0.025;

      // Yaw: A/D
      if (keysDown.has('KeyA')) yaw -= 0.8;
      if (keysDown.has('KeyD')) yaw += 0.8;

      // Pitch: ArrowUp / ArrowDown or KeyI / KeyK
      if (keysDown.has('ArrowUp') || keysDown.has('KeyI')) pitch += 0.8;
      if (keysDown.has('ArrowDown') || keysDown.has('KeyK')) pitch -= 0.8;

      // Roll: ArrowLeft / ArrowRight or KeyJ / KeyL
      if (keysDown.has('ArrowLeft') || keysDown.has('KeyJ')) roll -= 0.8;
      if (keysDown.has('ArrowRight') || keysDown.has('KeyL')) roll += 0.8;

      const currentThrottle = droneSimStore.getState().controlInputs.throttle;
      const nextThrottle = Math.max(0, Math.min(1.0, currentThrottle + throttleDelta));

      droneSimStore.setControlInputs({
        throttle: nextThrottle,
        roll,
        pitch,
        yaw,
      });
    }, 25);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(interval);
    };
  }, [sim.isActive, sim.cameraMode]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-3 select-none">
      {/* 1. TOP STATUS & ENGINEERING BAR */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Platform Title & Flight Mode Badge */}
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-lg text-white shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold tracking-wide flex items-center gap-2">
                <span>{config.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/80 font-mono">
                  {config.battery.cellCount}S LiPo
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Mass: {(telemetry.totalMassKg * 1000).toFixed(0)}g • T/W: {telemetry.thrustToWeightRatio}x
              </div>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Return to Electronics Workbench Button */}
          <button
            onClick={() => droneSimStore.exitDroneSim()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded border border-slate-600 transition-colors"
            title="Return to IoT Lab Workbench"
          >
            <LogOut size={13} />
            <span>Exit Flight Lab</span>
          </button>
        </div>

        {/* Center: Camera & Display Mode Toolbar */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg text-xs text-slate-300 shadow-lg">
          <span className="text-[10px] uppercase font-semibold text-slate-400 px-2">Cam:</span>
          {(['chase', 'fpv', 'third_person', 'engineering'] as DroneCameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => droneSimStore.setCameraMode(mode)}
              className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                cameraMode === mode
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-slate-700 mx-1" />

          {/* Engineering Overlay Toggle */}
          <button
            onClick={() => droneSimStore.toggleEngineeringOverlay()}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              showEngineeringOverlay
                ? 'bg-emerald-600/80 text-white'
                : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Thrust Vectors & CG Overlay (O)"
          >
            <Gauge size={13} />
            <span>Vectors</span>
          </button>

          {/* Controls Guide Dialog */}
          <button
            onClick={() => setShowControlsModal(true)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300"
            title="Keyboard Controls"
          >
            <HelpCircle size={15} />
          </button>
        </div>

        {/* Right: Subsystem Inspector & Experiment Drawer Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInspectorModal(!showInspectorModal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-colors pointer-events-auto border ${
              showInspectorModal
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Sliders size={14} />
            <span>Subsystems & Experiments</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY FLIGHT TELEMETRY HUD (OVERLAY) */}
      <div className="grid grid-cols-3 gap-4 pointer-events-none mt-2">
        {/* Left HUD: Attitude, Speed & Altimeter */}
        <div className="flex flex-col gap-2 w-56">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-white shadow-xl">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-1 border-b border-slate-800">
              <span>PRIMARY FLIGHT</span>
              <span className={telemetry.armed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {telemetry.armed ? 'ARMED' : 'DISARMED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
              <div>
                <div className="text-[10px] text-slate-400">ALTITUDE</div>
                <div className="text-base font-bold text-sky-400">
                  {telemetry.altitudeM.toFixed(1)} <span className="text-[10px] font-normal">m</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">SPEED</div>
                <div className="text-base font-bold text-sky-400">
                  {(telemetry.speedMps * 3.6).toFixed(1)}{' '}
                  <span className="text-[10px] font-normal">km/h</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PITCH / ROLL</div>
                <div className="text-xs font-semibold">
                  {telemetry.rotationEulerDeg.pitch.toFixed(1)}° /{' '}
                  {telemetry.rotationEulerDeg.roll.toFixed(1)}°
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">VERTICAL SPD</div>
                <div className="text-xs font-semibold">
                  {telemetry.verticalSpeedMps > 0 ? '+' : ''}
                  {telemetry.verticalSpeedMps.toFixed(1)} m/s
                </div>
              </div>
            </div>
          </div>

          {/* Motor RPM Status Bars */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-white shadow-xl font-mono text-[11px]">
            <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
              <span>MOTOR OUTPUT</span>
              <span>TOTAL: {telemetry.totalThrustN.toFixed(1)} N</span>
            </div>
            <div className="space-y-1">
              {telemetry.motorRpm.map((rpm, i) => {
                const maxRpm = config.motors[i].maxRpm || 38000;
                const pct = Math.min(100, Math.round((rpm / maxRpm) * 100));
                return (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-6 text-slate-400">M{i + 1}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          failures.motorFailure[i]
                            ? 'bg-red-500'
                            : failures.propellerDamage[i]
                            ? 'bg-amber-500'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right">{rpm.toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Flight Pitch Ladder / Artificial Horizon */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-36 flex items-center justify-center pointer-events-none">
            {/* Center Reticle */}
            <div className="w-8 h-8 border-2 border-emerald-400/80 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            </div>
            {/* Horizon bar */}
            <div
              className="absolute w-40 h-[2px] bg-emerald-400/70 shadow-sm"
              style={{
                transform: `rotate(${-telemetry.rotationEulerDeg.roll}deg) translateY(${
                  telemetry.rotationEulerDeg.pitch * 1.5
                }px)`,
              }}
            />
          </div>
        </div>

        {/* Right HUD: Battery & Power Telemetry */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-white shadow-xl w-56 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1">
                <Zap size={12} className="text-amber-400" /> POWER MONITOR
              </span>
              <span
                className={`font-bold ${
                  telemetry.batterySocPercent < 20
                    ? 'text-red-400 animate-pulse'
                    : telemetry.batterySocPercent < 40
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {telemetry.batterySocPercent}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <div className="text-[10px] text-slate-400">PACK VOLTAGE</div>
                <div className="text-sm font-bold text-amber-300">
                  {telemetry.batteryVoltageV.toFixed(2)} V
                </div>
                <div className="text-[9px] text-slate-400">
                  {(telemetry.batteryVoltageV / config.battery.cellCount).toFixed(2)} V/cell
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">CURRENT DRAW</div>
                <div className="text-sm font-bold text-amber-300">
                  {telemetry.batteryCurrentA.toFixed(1)} A
                </div>
                <div className="text-[9px] text-slate-400">
                  {telemetry.batteryMahDrawn} mAh drawn
                </div>
              </div>
            </div>

            <div className="mt-2 pt-1 border-t border-slate-800 text-[10px] flex justify-between text-slate-300">
              <span>EST. FLIGHT TIME:</span>
              <span className="font-bold text-emerald-400">
                {telemetry.estimatedFlightTimeRemainingMin} min
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Arm / Disarm */}
            <button
              onClick={() => droneSimStore.toggleArmed()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-colors border ${
                telemetry.armed
                  ? 'bg-red-600 hover:bg-red-700 border-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white'
              }`}
            >
              <Power size={14} />
              <span>{telemetry.armed ? 'DISARM (Space)' : 'ARM (Space)'}</span>
            </button>

            {/* Reset Flight */}
            <button
              onClick={() => droneSimStore.resetFlightPosition()}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg shadow-lg"
              title="Reset Position (R)"
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM CONTROL STICKS & DATA RECORDER BAR */}
      <div className="flex items-end justify-between pointer-events-auto w-full mt-auto">
        {/* Left Stick (Throttle & Yaw) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl text-white shadow-xl flex items-center gap-3 text-xs">
          <div className="relative w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
            {/* Center crosshair */}
            <div className="absolute w-full h-[1px] bg-slate-700" />
            <div className="absolute h-full w-[1px] bg-slate-700" />
            {/* Stick Position Dot */}
            <div
              className="w-3.5 h-3.5 bg-blue-500 rounded-full shadow-md transition-all duration-75"
              style={{
                transform: `translate(${controlInputs.yaw * 24}px, ${
                  (0.5 - controlInputs.throttle) * 48
                }px)`,
              }}
            />
          </div>
          <div className="font-mono text-[10px]">
            <div className="text-slate-400 font-bold">LEFT GIMBAL</div>
            <div>THR: {(controlInputs.throttle * 100).toFixed(0)}% (W/S)</div>
            <div>YAW: {controlInputs.yaw.toFixed(2)} (A/D)</div>
          </div>
        </div>

        {/* Center: Live Experiment Data Recorder */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-xl text-white shadow-xl flex items-center gap-3 text-xs">
          <button
            onClick={() => droneSimStore.toggleRecording()}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-xs transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isRecording ? <Square size={12} /> : <Play size={12} />}
            <span>{isRecording ? 'Stop Recording' : 'Record Telemetry'}</span>
          </button>

          <span className="text-slate-500 font-mono text-[11px]">
            {sim.recordingHistory.length} samples
          </span>

          <button
            onClick={() => droneSimStore.saveCurrentAsExperiment()}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            title="Snapshot current configuration for comparison"
          >
            <BookmarkPlus size={13} />
            <span>Save Benchmark</span>
          </button>
        </div>

        {/* Right Stick (Pitch & Roll) */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl text-white shadow-xl flex items-center gap-3 text-xs">
          <div className="font-mono text-[10px] text-right">
            <div className="text-slate-400 font-bold">RIGHT GIMBAL</div>
            <div>PITCH: {controlInputs.pitch.toFixed(2)} (↑/↓)</div>
            <div>ROLL: {controlInputs.roll.toFixed(2)} (←/→)</div>
          </div>
          <div className="relative w-16 h-16 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center">
            <div className="absolute w-full h-[1px] bg-slate-700" />
            <div className="absolute h-full w-[1px] bg-slate-700" />
            <div
              className="w-3.5 h-3.5 bg-blue-500 rounded-full shadow-md transition-all duration-75"
              style={{
                transform: `translate(${controlInputs.roll * 24}px, ${
                  -controlInputs.pitch * 24
                }px)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. SUBSYSTEMS & EXPERIMENTATION DRAWER (MODAL) */}
      {showInspectorModal && (
        <div className="fixed inset-y-12 right-4 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-4 text-white z-50 flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-blue-400" />
              <span className="font-bold text-sm">Drone Engineering Lab</span>
            </div>
            <button
              onClick={() => setShowInspectorModal(false)}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            >
              Close
            </button>
          </div>

          {/* Subsystem Tabs */}
          <div className="flex items-center gap-1 mt-3 bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
            {(
              [
                { id: 'hierarchy', label: 'Stack' },
                { id: 'hardware', label: 'Swap Parts' },
                { id: 'failures', label: 'Failures' },
                { id: 'environment', label: 'Env' },
                { id: 'experiment', label: 'Compare' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => droneSimStore.setSubsystemTab(tab.id)}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  selectedSubsystemTab === tab.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3 text-xs">
            {/* TAB 1: HIERARCHY */}
            {selectedSubsystemTab === 'hierarchy' && (
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  Connected Drone Subsystems
                </div>
                {[
                  {
                    name: config.frame.name,
                    spec: `${config.frame.wheelbaseMm}mm True-X • ${config.frame.frameMassGrams}g Carbon`,
                    type: 'Airframe',
                  },
                  {
                    name: config.flightController.name,
                    spec: `${config.flightController.mcu} • ${config.flightController.gyro}`,
                    type: 'Flight Controller',
                  },
                  {
                    name: config.esc.name,
                    spec: `${config.esc.continuousCurrentA}A • ${config.esc.protocol}`,
                    type: 'ESC',
                  },
                  {
                    name: `4x ${config.motors[0].name}`,
                    spec: `${config.motors[0].kv} KV • ${config.motors[0].maxThrustGrams}g thrust/motor`,
                    type: 'Brushless Motors',
                  },
                  {
                    name: `4x ${config.propellers[0].name}`,
                    spec: `${config.propellers[0].diameterInches}" dia • ${config.propellers[0].pitchInches}" pitch • ${config.propellers[0].blades}-blade`,
                    type: 'Propellers',
                  },
                  {
                    name: config.battery.name,
                    spec: `${config.battery.cellCount}S ${config.battery.capacityMah}mAh • ${config.battery.cRatingContinuous}C`,
                    type: 'LiPo Power',
                  },
                  ...config.payloads.map((p) => ({
                    name: p.name,
                    spec: `${p.massGrams}g • ${p.currentDrawMa}mA`,
                    type: p.type.toUpperCase(),
                  })),
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
                    <div className="flex justify-between items-center text-[10px] text-blue-400 font-mono">
                      <span>{item.type}</span>
                      <span className="text-emerald-400">NOMINAL</span>
                    </div>
                    <div className="font-semibold text-slate-100 mt-0.5">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.spec}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: HARDWARE SWAPPING */}
            {selectedSubsystemTab === 'hardware' && (
              <div className="space-y-3">
                {/* Motor Selector */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    BRUSHLESS MOTORS (4x)
                  </label>
                  <select
                    value={config.motors[0].id}
                    onChange={(e) => droneSimStore.replaceAllMotors(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {DRONE_MOTORS_CATALOG.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.kv}KV, {m.statorSize})
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Max Thrust: {config.motors[0].maxThrustGrams * 4}g total • Current:{' '}
                    {config.motors[0].maxCurrentA}A max
                  </div>
                </div>

                {/* Propeller Selector */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    PROPELLERS (4x)
                  </label>
                  <select
                    value={config.propellers[0].id}
                    onChange={(e) => droneSimStore.replaceAllPropellers(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {DRONE_PROPELLERS_CATALOG.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Diameter: {config.propellers[0].diameterInches}" • Pitch:{' '}
                    {config.propellers[0].pitchInches}" • Ct: {config.propellers[0].thrustCoefficientCt}
                  </div>
                </div>

                {/* Battery Selector */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    LIPO BATTERY PACK
                  </label>
                  <select
                    value={config.battery.id}
                    onChange={(e) => droneSimStore.replaceBattery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                  >
                    {DRONE_BATTERIES_CATALOG.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {config.battery.cellCount}S ({config.battery.cellNominalVoltage * config.battery.cellCount}V) •{' '}
                    {config.battery.capacityMah}mAh • Mass: {config.battery.massGrams}g
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FAILURE INJECTION */}
            {selectedSubsystemTab === 'failures' && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  Inject Realistic Hardware Faults
                </div>

                {/* Motor Failures */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
                  <span className="font-bold text-slate-200 block text-[11px]">Motor Loss (Cutout):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => droneSimStore.toggleMotorFailure(idx)}
                        className={`py-1 px-2 rounded text-[11px] font-semibold flex items-center justify-between border ${
                          failures.motorFailure[idx]
                            ? 'bg-red-600/80 border-red-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>Motor {idx + 1}</span>
                        <span>{failures.motorFailure[idx] ? 'DEAD' : 'OK'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Propeller Damage */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1.5">
                  <span className="font-bold text-slate-200 block text-[11px]">
                    Propeller Blade Damage (-45% thrust):
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[0, 1, 2, 3].map((idx) => (
                      <button
                        key={idx}
                        onClick={() => droneSimStore.togglePropellerDamage(idx)}
                        className={`py-1 px-2 rounded text-[11px] font-semibold flex items-center justify-between border ${
                          failures.propellerDamage[idx]
                            ? 'bg-amber-600/80 border-amber-500 text-white'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>Prop {idx + 1}</span>
                        <span>{failures.propellerDamage[idx] ? 'DAMAGED' : 'INTACT'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Radio Receiver Signal Loss */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">RC Failsafe (Signal Loss)</div>
                    <div className="text-[10px] text-slate-400">Forces throttle to 0 drops drone</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={failures.receiverSignalLoss}
                    onChange={(e) =>
                      droneSimStore.setFailureMode({ receiverSignalLoss: e.target.checked })
                    }
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: ENVIRONMENT */}
            {selectedSubsystemTab === 'environment' && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">
                  Flight Environment Preset
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['field', 'hangar', 'obstacles', 'terrain'] as const).map((envId) => (
                    <button
                      key={envId}
                      onClick={() => droneSimStore.setEnvironmentType(envId)}
                      className={`p-2 rounded-lg text-left capitalize font-semibold border ${
                        activeEnvironment.id === envId
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {envId}
                    </button>
                  ))}
                </div>

                {/* Wind Controls */}
                <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>Wind Speed:</span>
                    <span className="text-sky-400">{activeEnvironment.windSpeedMps} m/s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={activeEnvironment.windSpeedMps}
                    onChange={(e) =>
                      droneSimStore.setEnvironment({ windSpeedMps: parseFloat(e.target.value) })
                    }
                    className="w-full accent-blue-500 cursor-pointer"
                  />

                  <div className="flex justify-between font-semibold mt-2">
                    <span>Wind Direction:</span>
                    <span className="text-sky-400">{activeEnvironment.windDirectionDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={activeEnvironment.windDirectionDeg}
                    onChange={(e) =>
                      droneSimStore.setEnvironment({ windDirectionDeg: parseFloat(e.target.value) })
                    }
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* TAB 5: EXPERIMENT COMPARISON */}
            {selectedSubsystemTab === 'experiment' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-300 font-bold uppercase tracking-wider block">
                      A/B Hardware Benchmarks
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Record test flights, compare configurations & analyze deltas
                    </span>
                  </div>
                  <button
                    onClick={() => droneSimStore.saveCurrentAsExperiment()}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-semibold transition-colors shadow-xs"
                    title="Take snapshot of current hardware configuration and telemetry"
                  >
                    + Snapshot
                  </button>
                </div>

                {/* Current Live Hardware Snapshot Card */}
                <div className="p-2.5 bg-blue-950/40 rounded-lg border border-blue-600/50 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-blue-400 font-bold">CURRENT ACTIVE SETUP</span>
                    <span className="text-emerald-400">LIVE</span>
                  </div>
                  <div className="font-semibold text-slate-100 text-xs">
                    {config.name} ({config.battery.cellCount}S • {config.motors[0].kv}KV • {config.propellers[0].diameterInches}x{config.propellers[0].pitchInches}")
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                    <div>Mass: {(telemetry.totalMassKg * 1000).toFixed(0)}g AUW</div>
                    <div>T/W Ratio: {telemetry.thrustToWeightRatio}x</div>
                    <div>Thrust: {telemetry.totalThrustN.toFixed(1)} N</div>
                    <div>Current: {telemetry.totalCurrentA.toFixed(1)} A</div>
                    <div>Hover Est: {telemetry.estimatedFlightTimeRemainingMin} min</div>
                    <div>Battery: {telemetry.batteryVoltageV.toFixed(1)}V ({telemetry.batterySocPercent.toFixed(0)}%)</div>
                  </div>
                </div>

                {/* Empty State */}
                {savedExperiments.length === 0 && (
                  <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 text-center space-y-1.5">
                    <p className="text-slate-400 text-xs">No benchmark snapshots saved yet.</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Click "+ Snapshot" above after flying or modifying motors/props to save a benchmark point for side-by-side comparison.
                    </p>
                  </div>
                )}

                {/* List of Saved Experiments with Delta Comparison */}
                {savedExperiments.map((exp, idx) => {
                  const massDiff = (telemetry.totalMassKg - exp.totalMassKg) * 1000;
                  const twDiff = Number((telemetry.thrustToWeightRatio - exp.thrustToWeightRatio).toFixed(2));
                  const thrustDiff = Number((telemetry.totalThrustN - exp.maxThrustN).toFixed(1));

                  return (
                    <div
                      key={exp.id}
                      className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80 space-y-1.5"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span className="text-xs">
                          {idx + 1}. {exp.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{exp.date}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                        <div>Mass: {(exp.totalMassKg * 1000).toFixed(0)}g</div>
                        <div>T/W Ratio: {exp.thrustToWeightRatio}x</div>
                        <div>Max Thrust: {exp.maxThrustN} N</div>
                        <div>Max Current: {exp.maxCurrentA} A</div>
                        <div>Hover Est: {exp.estimatedHoverTimeMin} min</div>
                        <div>Peak RPM: {exp.peakRpm.toFixed(0)}</div>
                      </div>

                      {/* Live Delta comparison against this snapshot */}
                      <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Δ vs Current:</span>
                        <span className={massDiff <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {massDiff > 0 ? `+${massDiff.toFixed(0)}g` : `${massDiff.toFixed(0)}g`} mass
                        </span>
                        <span className={twDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {twDiff > 0 ? `+${twDiff}x` : `${twDiff}x`} T/W
                        </span>
                        <button
                          onClick={() => droneSimStore.applyConfiguration(exp.config)}
                          className="px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-sans"
                          title="Restore this hardware setup to active drone"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. CONTROLS GUIDE MODAL */}
      {showControlsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Gauge className="text-blue-400" size={18} /> Drone Flight Controls
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">Spacebar</span>
                <span className="text-emerald-400 font-mono">Arm / Disarm Motors</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">W / S</span>
                <span className="text-sky-400 font-mono">Throttle Up / Down</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">A / D</span>
                <span className="text-sky-400 font-mono">Yaw Left / Right</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">↑ / ↓ (or I / K)</span>
                <span className="text-sky-400 font-mono">Pitch Down (Forward) / Pitch Up</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">← / → (or J / L)</span>
                <span className="text-sky-400 font-mono">Roll Left / Right</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">C</span>
                <span className="text-amber-400 font-mono">Cycle Cameras (Chase, FPV, Orbit)</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-800/60 rounded">
                <span className="font-semibold text-white">R</span>
                <span className="text-red-400 font-mono">Reset Drone to Tarmac</span>
              </div>
            </div>

            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
            >
              Got it, start flying!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
