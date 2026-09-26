/**
 * Virtual IoT Lab — Virtual Instrument Bench View
 *
 * Professional test and measurement equipment:
 * 1. Digital Multimeter (DMM) with selectable test points & modes
 * 2. Dual-Channel Oscilloscope with live canvas waveform rendering & triggering
 * 3. Blackbox Flight Telemetry Data Logger with CSV export
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  instrumentEngine,
  MultimeterMode,
  MultimeterTestPoint,
  ScopeChannelSource,
} from '../../core/instrumentEngine/InstrumentEngine';
import { simulationEngine } from '../../core/simulationEngine/SimulationEngine';
import {
  Activity,
  Gauge,
  Sliders,
  Download,
  Play,
  Pause,
  Zap,
  Radio,
  Clock,
  Eye,
} from 'lucide-react';

export const InstrumentBenchView: React.FC = () => {
  const [dmmMode, setDmmMode] = useState<MultimeterMode>(instrumentEngine.dmmMode);
  const [dmmPoint, setDmmPoint] = useState<MultimeterTestPoint>(instrumentEngine.dmmTestPoint);
  const [isHold, setIsHold] = useState(instrumentEngine.dmmHold);
  const [ch1Source, setCh1Source] = useState<ScopeChannelSource>(instrumentEngine.scopeCh1Source);
  const [ch2Source, setCh2Source] = useState<ScopeChannelSource>(instrumentEngine.scopeCh2Source);
  const [scopeRunning, setScopeRunning] = useState(instrumentEngine.scopeRunning);
  const [timebase, setTimebase] = useState(instrumentEngine.scopeTimebaseMs);
  const [isLogging, setIsLogging] = useState(instrumentEngine.isLogging);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setTick] = useState(0);

  // Sampling loop for instruments
  useEffect(() => {
    const interval = setInterval(() => {
      instrumentEngine.sample(0.016);
      setTick((t) => t + 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Draw oscilloscope waveforms on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background: Dark CRT green-gray
    ctx.fillStyle = '#090d0b';
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope Grid Lines (10x8 divisions)
    ctx.strokeStyle = '#14291e';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += width / 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += height / 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center Crosshairs
    ctx.strokeStyle = '#1e3f2e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const buffer = instrumentEngine.waveformBuffer;
    if (buffer.length < 2) return;

    // Draw Channel 1: Bright Yellow-Green Phosphor
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const midY1 = height * 0.38;
    buffer.forEach((pt, i) => {
      const x = (i / (buffer.length - 1)) * width;
      // Auto-scale signal height
      const y = midY1 - pt.ch1Val * 12;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Channel 2: Bright Sky-Blue Phosphor
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const midY2 = height * 0.68;
    buffer.forEach((pt, i) => {
      const x = (i / (buffer.length - 1)) * width;
      const y = midY2 - pt.ch2Val * 12;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;
  }, [instrumentEngine.waveformBuffer.length, ch1Source, ch2Source]);

  const dmmReading = instrumentEngine.getDmmReading();

  const handleExportCsv = () => {
    const csvContent = instrumentEngine.exportLogAsCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `system_telemetry_blackbox_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Column 1: Precision Digital Multimeter */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-zinc-100">Digital Multimeter (DMM)</h2>
          </div>
          <button
            onClick={() => {
              instrumentEngine.toggleDmmHold();
              setIsHold(!isHold);
            }}
            className={`text-xs px-2.5 py-1 rounded font-mono font-bold transition-all ${
              isHold ? 'bg-amber-500 text-zinc-950 shadow-md' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
            }`}
          >
            {isHold ? 'HOLD ON' : 'HOLD'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {/* Virtual High-Contrast LCD Screen */}
          <div className="bg-[#0b1712] border-2 border-[#163a28] p-4 rounded-xl shadow-inner font-mono text-emerald-400">
            <div className="flex justify-between text-[11px] text-emerald-600 font-bold tracking-widest uppercase">
              <span>AUTO-RANGE 6000 COUNT</span>
              <span>{dmmPoint}</span>
            </div>
            <div className="flex items-baseline justify-end gap-2 py-4">
              <span className="text-5xl font-black tracking-tight">{dmmReading.value.toFixed(2)}</span>
              <span className="text-xl font-bold text-emerald-500">{dmmReading.unit}</span>
            </div>
            <div className="text-xs text-emerald-600/90 truncate border-t border-emerald-950/80 pt-2">
              {dmmReading.description}
            </div>
          </div>

          {/* Test Point Rotary Selector */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <label className="text-xs text-zinc-400 font-medium block mb-2">Probe Test Point (Red & Black Lead)</label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(
                [
                  { id: 'BAT_XT60', label: 'Battery XT60 (V)' },
                  { id: 'ESC_TOTAL_CURRENT', label: 'ESC Total Current (A)' },
                  { id: 'FC_5V_REG', label: 'FC 5V BEC Rail' },
                  { id: 'CURRENT_SHUNT_MV', label: 'Current Shunt (mV)' },
                  { id: 'MOTOR_1_PHASE', label: 'Motor 1 Phase RMS' },
                  { id: 'MOTOR_2_PHASE', label: 'Motor 2 Phase RMS' },
                  { id: 'MOTOR_3_PHASE', label: 'Motor 3 Phase RMS' },
                  { id: 'MOTOR_4_PHASE', label: 'Motor 4 Phase RMS' },
                ] as const
              ).map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => {
                    instrumentEngine.dmmTestPoint = tp.id;
                    setDmmPoint(tp.id);
                  }}
                  className={`p-2 rounded border text-left transition-all ${
                    dmmPoint === tp.id
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300 font-medium'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Measurement Notes */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-400 space-y-1.5">
            <div className="font-semibold text-zinc-200">Circuit Probe Notes:</div>
            <p className="leading-relaxed text-[11px]">
              - Battery XT60 displays live terminal voltage under current load, showing physical voltage sag.
            </p>
            <p className="leading-relaxed text-[11px]">
              - Motor phase measurement probes the high-frequency inverter bridge, measuring effective back-EMF RMS.
            </p>
          </div>
        </div>
      </div>

      {/* Column 2: Dual-Channel Digital Oscilloscope */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Dual-Channel Digital Oscilloscope</h2>
          </div>
          <button
            onClick={() => {
              instrumentEngine.scopeRunning = !scopeRunning;
              setScopeRunning(!scopeRunning);
            }}
            className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
              scopeRunning ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-emerald-600 text-white'
            }`}
          >
            {scopeRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {scopeRunning ? 'Freeze' : 'Trigger'}
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-3 pt-3 overflow-hidden">
          {/* Live Waveform Canvas */}
          <div className="w-full flex-1 min-h-[220px] rounded-xl overflow-hidden border-2 border-zinc-800 bg-[#090d0b] relative">
            <canvas ref={canvasRef} width={500} height={260} className="w-full h-full object-cover" />
            {/* Channel Legend Overlay */}
            <div className="absolute top-2 left-2 flex gap-3 text-[10px] font-mono pointer-events-none">
              <span className="text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-emerald-600/40">
                CH1: {ch1Source}
              </span>
              <span className="text-sky-400 font-bold bg-black/60 px-1.5 py-0.5 rounded border border-sky-600/40">
                CH2: {ch2Source}
              </span>
            </div>
          </div>

          {/* Scope Controls */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">CH1 Source (Green)</label>
                <select
                  value={ch1Source}
                  onChange={(e) => {
                    const src = e.target.value as ScopeChannelSource;
                    instrumentEngine.scopeCh1Source = src;
                    setCh1Source(src);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200"
                >
                  <option value="M1_DSHOT">Motor 1 DShot Burst</option>
                  <option value="GYRO_ROLL_RATE">ICM42688 Gyro Roll Rate</option>
                  <option value="BATTERY_VOLTAGE">Battery Voltage Sag</option>
                  <option value="ACCEL_Z">Accelerometer Z (G)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">CH2 Source (Cyan)</label>
                <select
                  value={ch2Source}
                  onChange={(e) => {
                    const src = e.target.value as ScopeChannelSource;
                    instrumentEngine.scopeCh2Source = src;
                    setCh2Source(src);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200"
                >
                  <option value="M2_DSHOT">Motor 2 DShot Burst</option>
                  <option value="GYRO_PITCH_RATE">ICM42688 Gyro Pitch Rate</option>
                  <option value="TOTAL_CURRENT">Total ESC Current (A)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <span>Timebase: {timebase} ms / div</span>
              <div className="flex gap-1">
                {[5, 10, 20, 50].map((tb) => (
                  <button
                    key={tb}
                    onClick={() => {
                      instrumentEngine.scopeTimebaseMs = tb;
                      setTimebase(tb);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      timebase === tb
                        ? 'bg-zinc-800 border-zinc-600 text-zinc-100 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tb}ms
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Blackbox Flight Telemetry Data Logger */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-zinc-100">Blackbox System Telemetry Logger</h2>
          </div>
          <button
            onClick={() => {
              instrumentEngine.isLogging = !isLogging;
              setIsLogging(!isLogging);
            }}
            className={`text-xs px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
              isLogging
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            {isLogging ? 'REC ACTIVE' : 'Start Logging'}
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-3 pt-3 overflow-hidden">
          {/* Log Records Table */}
          <div className="flex-1 overflow-y-auto bg-zinc-950 rounded-lg border border-zinc-800 p-2 font-mono text-[11px] custom-scrollbar">
            {instrumentEngine.logRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-4">
                <Clock className="w-6 h-6 text-zinc-400 mb-1" />
                Click "Start Logging" to capture real-time electromechanical and electrical telemetry records.
              </div>
            ) : (
              <table className="w-full text-left text-zinc-300">
                <thead className="text-[10px] uppercase text-zinc-400 border-b border-zinc-800 sticky top-0 bg-zinc-950">
                  <tr>
                    <th className="py-1">Time(s)</th>
                    <th>R/P/Y(°)</th>
                    <th>M1-RPM</th>
                    <th>Volts</th>
                    <th>Amps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {instrumentEngine.logRecords.slice(-15).map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-900/50">
                      <td className="py-1 text-zinc-400">{row.t.toFixed(2)}</td>
                      <td>
                        {row.rollDeg}/{row.pitchDeg}/{row.yawDeg}
                      </td>
                      <td className="text-sky-300">{row.m1Rpm}</td>
                      <td className="text-amber-300">{row.volts.toFixed(1)}V</td>
                      <td className="text-emerald-300">{row.amps.toFixed(1)}A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Export Actions */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div className="text-xs text-zinc-400">
              Captured Records: <span className="font-mono text-zinc-200">{instrumentEngine.logRecords.length}</span>
            </div>
            <button
              onClick={handleExportCsv}
              disabled={instrumentEngine.logRecords.length === 0}
              className="text-xs px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 text-white rounded font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
