/**
 * Virtual IoT Lab — Firmware & Flight Controller Configuration View
 *
 * Betaflight-style control engineering interface:
 * - PID loop tuning (Roll, Pitch, Yaw)
 * - Rate profiles & Presets
 * - Motor ESC protocol selection (DShot600, DShot300, PWM)
 * - Flight modes (Angle, Acro, Alt-Hold)
 * - Failsafe policies & Gyro filters
 */

import React from 'react';
import { useLabStore, labStore } from '../../core/labStore';
import { simulationEngine } from '../../core/simulationEngine/SimulationEngine';
import {
  Sliders,
  Cpu,
  ShieldAlert,
  Activity,
  CheckCircle2,
  RefreshCw,
  Zap,
  Radio,
  FileCode,
} from 'lucide-react';

export const FirmwareConfigView: React.FC = () => {
  const { pidSettings, flightMode, dshotProtocol, failsafeMode } = useLabStore();

  const presets = [
    {
      name: 'Freestyle 5" (Balanced)',
      pid: { rollP: 45, rollI: 80, rollD: 35, pitchP: 47, pitchI: 84, pitchD: 38, yawP: 42, yawI: 90, yawD: 0 },
    },
    {
      name: 'Cinematic Smooth (Low D)',
      pid: { rollP: 35, rollI: 95, rollD: 22, pitchP: 38, pitchI: 98, pitchD: 25, yawP: 30, yawI: 95, yawD: 0 },
    },
    {
      name: 'Aggressive Race (High P & D)',
      pid: { rollP: 58, rollI: 70, rollD: 44, pitchP: 62, pitchI: 72, pitchD: 48, yawP: 50, yawI: 80, yawD: 0 },
    },
  ];

  const applyPreset = (pid: typeof pidSettings) => {
    Object.entries(pid).forEach(([key, val]) => {
      labStore.updatePid(key as keyof typeof pidSettings, val);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Left 2 Columns: PID Loop Tuning Sliders */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-zinc-100">Attitude PID Controller Tuning</h2>
          </div>
          <div className="flex items-center gap-2">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.pid)}
                className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pt-4 pr-1 custom-scrollbar">
          {/* Roll Axis */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-sky-400">Roll Axis PID</span>
              <span className="text-xs font-mono text-zinc-400">
                P: {pidSettings.rollP} | I: {pidSettings.rollI} | D: {pidSettings.rollD}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Proportional (P-Gain) — Response sharpness</span>
                  <span className="font-mono text-zinc-200">{pidSettings.rollP}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={pidSettings.rollP}
                  onChange={(e) => labStore.updatePid('rollP', parseInt(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Integral (I-Gain) — Steady-state error trim</span>
                  <span className="font-mono text-zinc-200">{pidSettings.rollI}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={pidSettings.rollI}
                  onChange={(e) => labStore.updatePid('rollI', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Derivative (D-Gain) — Oscillation damping</span>
                  <span className="font-mono text-zinc-200">{pidSettings.rollD}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={pidSettings.rollD}
                  onChange={(e) => labStore.updatePid('rollD', parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Pitch Axis */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-emerald-400">Pitch Axis PID</span>
              <span className="text-xs font-mono text-zinc-400">
                P: {pidSettings.pitchP} | I: {pidSettings.pitchI} | D: {pidSettings.pitchD}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Proportional (P-Gain)</span>
                  <span className="font-mono text-zinc-200">{pidSettings.pitchP}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={pidSettings.pitchP}
                  onChange={(e) => labStore.updatePid('pitchP', parseInt(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Integral (I-Gain)</span>
                  <span className="font-mono text-zinc-200">{pidSettings.pitchI}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={pidSettings.pitchI}
                  onChange={(e) => labStore.updatePid('pitchI', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Derivative (D-Gain)</span>
                  <span className="font-mono text-zinc-200">{pidSettings.pitchD}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={pidSettings.pitchD}
                  onChange={(e) => labStore.updatePid('pitchD', parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Yaw Axis */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-purple-400">Yaw Axis PID</span>
              <span className="text-xs font-mono text-zinc-400">
                P: {pidSettings.yawP} | I: {pidSettings.yawI} | D: {pidSettings.yawD}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Proportional (P-Gain)</span>
                  <span className="font-mono text-zinc-200">{pidSettings.yawP}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={pidSettings.yawP}
                  onChange={(e) => labStore.updatePid('yawP', parseInt(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Integral (I-Gain)</span>
                  <span className="font-mono text-zinc-200">{pidSettings.yawI}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={pidSettings.yawI}
                  onChange={(e) => labStore.updatePid('yawI', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Protocols, Flight Modes & Failsafe */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-100">Firmware Protocols</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {/* Flight Mode Selection */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium mb-2">Flight Stabilization Mode</div>
            <div className="space-y-1.5">
              {[
                { id: 'angle', name: 'ANGLE (Self-Leveling)', desc: 'Auto-levels when sticks center. Max 35° tilt.' },
                { id: 'acro', name: 'ACRO (Rate Mode)', desc: 'Stick position controls angular rate. Manual flips.' },
                { id: 'alt_hold', name: 'ALTITUDE HOLD', desc: 'Barometric Z-axis lock assisting hover altitude.' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => labStore.setFlightMode(m.id as any)}
                  className={`w-full text-left p-2 rounded border transition-all ${
                    flightMode === m.id
                      ? 'bg-sky-950/60 border-sky-500 text-zinc-100'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{m.name}</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ESC Communication Protocol */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium mb-2">ESC Motor Protocol</div>
            <div className="grid grid-cols-3 gap-2">
              {['DShot600', 'DShot300', 'PWM'].map((proto) => (
                <button
                  key={proto}
                  className={`p-2 rounded border text-xs font-mono text-center transition-all ${
                    dshotProtocol === proto
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-zinc-400 mt-2">
              DShot600 transmits 16-bit digital frames at 600 kbit/s with CRC checksums and bidirectional RPM
              telemetry.
            </div>
          </div>

          {/* Failsafe Policy */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-2">
              <ShieldAlert className="w-4 h-4" />
              Radio Failsafe Action
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => labStore.setFailsafeMode('drop')}
                className={`p-2 rounded border text-xs text-center transition-all ${
                  failsafeMode === 'drop'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300 font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Drop (Motor Cut)
              </button>
              <button
                onClick={() => labStore.setFailsafeMode('land')}
                className={`p-2 rounded border text-xs text-center transition-all ${
                  failsafeMode === 'land'
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}
              >
                Auto-Descend
              </button>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2">
              If RC link is severed (via connection graph or fault injection), motors will automatically execute this
              failsafe protocol.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
