/**
 * Virtual IoT Lab — Firmware & Control Engine View (CODE Mode)
 *
 * Virtual MCU / STM32F405 runtime control workbench:
 * 1. Attitude PID loop tuning & rate profiles
 * 2. Virtual Hardware Register & Pin Inspector (GPIO, ADC, SPI, PWM, UART)
 * 3. Interactive Embedded C Flight Routine Script Editor with Compile & Flash
 */

import React, { useState, useEffect } from 'react';
import { useLabStore, labStore } from '../../core/labStore';
import { virtualMcu } from '../../core/firmwareEngine/VirtualMCU';
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
  Terminal,
  Play,
  Layers,
} from 'lucide-react';

export const FirmwareLabView: React.FC = () => {
  const { pidSettings, flightMode, dshotProtocol, failsafeMode } = useLabStore();
  const [subTab, setSubTab] = useState<'pid' | 'registers' | 'editor'>('pid');
  const [scriptText, setScriptText] = useState(virtualMcu.firmwareScript);
  const [compileResult, setCompileResult] = useState<{ success: boolean; message: string } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    return virtualMcu.subscribe(() => setTick((t) => t + 1));
  }, []);

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

  const handleCompileFlash = () => {
    virtualMcu.setScript(scriptText);
    const res = virtualMcu.compileAndFlash();
    setCompileResult(res);
  };

  const pinsArray = Array.from(virtualMcu.pins.values());
  const uartsArray = Array.from(virtualMcu.uarts.values());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Left 2 Columns: Active Sub-Mode (PID | Registers | Code Editor) */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        {/* Sub-navigation tabs */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setSubTab('pid')}
              className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                subTab === 'pid' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>PID & Rates</span>
            </button>
            <button
              onClick={() => setSubTab('registers')}
              className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                subTab === 'registers' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>MCU Registers & GPIO</span>
            </button>
            <button
              onClick={() => setSubTab('editor')}
              className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                subTab === 'editor' ? 'bg-sky-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Firmware Script Editor</span>
            </button>
          </div>

          {subTab === 'pid' && (
            <div className="flex items-center gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p.pid)}
                  className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {subTab === 'editor' && (
            <button
              onClick={handleCompileFlash}
              className="text-xs px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded border border-emerald-500 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              Compile & Flash Virtual MCU
            </button>
          )}
        </div>

        {/* 1. PID Tuning Tab */}
        {subTab === 'pid' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
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
                    className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Derivative (D-Gain) — Oscillation dampening</span>
                    <span className="font-mono text-zinc-200">{pidSettings.rollD}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={pidSettings.rollD}
                    onChange={(e) => labStore.updatePid('rollD', parseInt(e.target.value))}
                    className="w-full accent-sky-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
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
                    className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
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
                    min="5"
                    max="80"
                    value={pidSettings.pitchD}
                    onChange={(e) => labStore.updatePid('pitchD', parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Yaw Axis */}
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-400">Yaw Axis PID</span>
                <span className="text-xs font-mono text-zinc-400">
                  P: {pidSettings.yawP} | I: {pidSettings.yawI}
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
                    className="w-full accent-purple-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Virtual Registers & GPIO Inspector */}
        {subTab === 'registers' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
            {/* Live CPU Core State */}
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
              <span className="text-xs font-semibold text-sky-400 block mb-2">STM32F405 Core Registers</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-[10px] text-zinc-500 block">PC Address</span>
                  <span className="text-sky-300 font-bold">0x{virtualMcu.registers.programCounter.toString(16).toUpperCase()}</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-[10px] text-zinc-500 block">Clock Freq</span>
                  <span className="text-zinc-200 font-bold">{virtualMcu.clockMhz} MHz</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-[10px] text-zinc-500 block">Loop Period</span>
                  <span className="text-emerald-400 font-bold">{virtualMcu.registers.loopTimeUs} μs (8kHz)</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-[10px] text-zinc-500 block">CPU Cycles</span>
                  <span className="text-zinc-400">{(virtualMcu.registers.cycleCount / 1e6).toFixed(1)} M</span>
                </div>
              </div>

              {/* ADC Registers */}
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
                <div className="bg-zinc-900 p-2 rounded flex justify-between">
                  <span className="text-zinc-400">ADC1_V_BAT:</span>
                  <span className="text-amber-400 font-bold">{virtualMcu.registers.batteryAdcRaw} / 4095</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded flex justify-between">
                  <span className="text-zinc-400">ADC1_I_BAT:</span>
                  <span className="text-amber-400 font-bold">{virtualMcu.registers.currentAdcRaw} / 4095</span>
                </div>
              </div>
            </div>

            {/* GPIO Pin Map Table */}
            <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
              <span className="text-xs font-semibold text-zinc-200 block mb-2">Hardware GPIO Pin States</span>
              <div className="space-y-1.5">
                {pinsArray.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400 font-bold w-12">{pin.id}</span>
                      <span className="text-zinc-300">{pin.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {pin.mode}
                      </span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          pin.state ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-zinc-700'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. Firmware Script Editor */}
        {subTab === 'editor' && (
          <div className="flex-1 flex flex-col pt-3 overflow-hidden">
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="flex-1 w-full bg-zinc-950 text-sky-200 font-mono text-xs p-3.5 rounded-lg border border-zinc-800 outline-none resize-none focus:border-sky-500"
              spellCheck={false}
            />

            {compileResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs font-mono border ${
                  compileResult.success
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-700 text-rose-300'
                }`}
              >
                {compileResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Protocols, Rates, and Flight Controller Hardware */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden space-y-4">
        <div className="pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">SpeedyBee F405 V3 FC</h2>
          </div>
          <span className="text-xs text-zinc-400 mt-1 block">STM32F405RGT6 @ 168MHz • BMI270 Gyro</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Motor Protocol Selection */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-200 block mb-2">ESC Telemetry Protocol</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['DShot600', 'DShot300', 'PWM'] as const).map((proto) => (
                <button
                  key={proto}
                  onClick={() => labStore.setDshotProtocol(proto)}
                  className={`text-xs py-1.5 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                    dshotProtocol === proto
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
              DShot600 transmits 16-bit digital packets at 600 kbit/s with hardware CRC verification.
            </p>
          </div>

          {/* Flight Mode Selection */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-200 block mb-2">Receiver Armed Flight Mode</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'angle', label: 'Angle' },
                { id: 'acro', label: 'Acro' },
                { id: 'alt_hold', label: 'Alt Hold' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => labStore.setFlightMode(m.id as typeof flightMode)}
                  className={`text-xs py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    flightMode === m.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Failsafe Policy */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-200">RC Loss Failsafe</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['drop', 'land'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => labStore.setFailsafeMode(mode)}
                  className={`text-xs py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    failsafeMode === mode
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* UART Port Assignment */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-200 block mb-2">Serial Port Bus Mapping</span>
            <div className="space-y-1.5 text-xs font-mono">
              {uartsArray.map((u) => (
                <div key={u.id} className="p-2 bg-zinc-900 rounded border border-zinc-800/80">
                  <div className="flex justify-between text-sky-400 font-bold">
                    <span>{u.id}</span>
                    <span>{u.baudRate} bps</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">{u.connectedDevice}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
