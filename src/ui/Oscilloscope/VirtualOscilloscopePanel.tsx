import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Activity,
  Play,
  Square,
  Sparkles,
  Maximize2,
  X,
  Sliders,
  ChevronDown,
  Info,
  Radio,
  BarChart3,
  Waves,
  Zap,
  Cable,
  Download,
} from 'lucide-react';
import { oscilloscopeStore, useOscilloscope } from '../../state/oscilloscope/oscilloscopeStore';
import { OscilloscopeSignalEngine } from '../../core/oscilloscope/OscilloscopeSignalEngine';
import { useProject, projectStore } from '../../state/project/projectStore';
import { SignalWaveformType, CouplingMode } from '../../core/oscilloscope/oscilloscopeTypes';

export const VirtualOscilloscopePanel: React.FC = () => {
  const oscState = useOscilloscope();
  const projectState = useProject();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Detect physical 3D jumper wires connected to any oscilloscope in the workspace
  const wiredTargets = useMemo(() => {
    const oscComp = projectState.components.find((c) => c.type === 'oscilloscope');
    if (!oscComp) return { ch1: null, ch2: null };

    const conn1 = projectState.connections.find(
      (c) =>
        (c.source.componentId === oscComp.id && (c.source.interfaceId === 'ch1_probe' || c.source.pinId === 'ch1_probe')) ||
        (c.target.componentId === oscComp.id && (c.target.interfaceId === 'ch1_probe' || c.target.pinId === 'ch1_probe'))
    );
    let ch1 = null;
    if (conn1) {
      const ep = conn1.source.componentId === oscComp.id ? conn1.target : conn1.source;
      const targetComp = projectState.components.find((c) => c.id === ep.componentId);
      const pin = targetComp?.pins.find((p) => p.id === (ep.interfaceId || ep.pinId));
      ch1 = {
        componentId: ep.componentId,
        pinId: ep.interfaceId || ep.pinId || '',
        name: `${targetComp?.name || 'Component'} — ${pin?.name || ep.interfaceId || ep.pinId}`,
      };
    }

    const conn2 = projectState.connections.find(
      (c) =>
        (c.source.componentId === oscComp.id && (c.source.interfaceId === 'ch2_probe' || c.source.pinId === 'ch2_probe')) ||
        (c.target.componentId === oscComp.id && (c.target.interfaceId === 'ch2_probe' || c.target.pinId === 'ch2_probe'))
    );
    let ch2 = null;
    if (conn2) {
      const ep = conn2.source.componentId === oscComp.id ? conn2.target : conn2.source;
      const targetComp = projectState.components.find((c) => c.id === ep.componentId);
      const pin = targetComp?.pins.find((p) => p.id === (ep.interfaceId || ep.pinId));
      ch2 = {
        componentId: ep.componentId,
        pinId: ep.interfaceId || ep.pinId || '',
        name: `${targetComp?.name || 'Component'} — ${pin?.name || ep.interfaceId || ep.pinId}`,
      };
    }

    return { ch1, ch2 };
  }, [projectState.components, projectState.connections]);

  // Available probe pin targets across all components on the workbench
  const availableProbeTargets = useMemo(() => {
    const list: { id: string; name: string; componentId: string; pinId: string; group: string }[] = [];

    projectState.components.forEach((comp) => {
      // Don't probe the oscilloscope itself
      if (comp.type === 'oscilloscope') return;

      if (comp.type === 'breadboard') {
        // Collect connected hole IDs to give wired nets priority
        const connectedHoles = new Set<string>();
        projectState.connections.forEach((cn) => {
          if (cn.source.componentId === comp.id) connectedHoles.add(cn.source.interfaceId || cn.source.pinId || '');
          if (cn.target.componentId === comp.id) connectedHoles.add(cn.target.interfaceId || cn.target.pinId || '');
        });

        // 1. Breadboard Rails
        list.push({
          id: `${comp.id}:rail_top_plus_1`,
          name: `${comp.name} — Top Rail (+) [5V Power Rail]`,
          componentId: comp.id,
          pinId: 'rail_top_plus_1',
          group: comp.name,
        });
        list.push({
          id: `${comp.id}:rail_top_minus_1`,
          name: `${comp.name} — Top Rail (-) [GND Bus]`,
          componentId: comp.id,
          pinId: 'rail_top_minus_1',
          group: comp.name,
        });
        list.push({
          id: `${comp.id}:rail_bot_plus_1`,
          name: `${comp.name} — Bottom Rail (+) [5V Power Rail]`,
          componentId: comp.id,
          pinId: 'rail_bot_plus_1',
          group: comp.name,
        });
        list.push({
          id: `${comp.id}:rail_bot_minus_1`,
          name: `${comp.name} — Bottom Rail (-) [GND Bus]`,
          componentId: comp.id,
          pinId: 'rail_bot_minus_1',
          group: comp.name,
        });

        // 2. Wired rows first
        for (let r = 1; r <= 30; r++) {
          const hasLeft = ['a', 'b', 'c', 'd', 'e'].some((c) => connectedHoles.has(`row_${r}_${c}`));
          const hasRight = ['f', 'g', 'h', 'i', 'j'].some((c) => connectedHoles.has(`row_${r}_${c}`));
          if (hasLeft) {
            list.push({
              id: `${comp.id}:row_${r}_a`,
              name: `${comp.name} — Row ${r} (A-E) [⚡ Wired Signal Net]`,
              componentId: comp.id,
              pinId: `row_${r}_a`,
              group: comp.name,
            });
          }
          if (hasRight) {
            list.push({
              id: `${comp.id}:row_${r}_f`,
              name: `${comp.name} — Row ${r} (F-J) [⚡ Wired Signal Net]`,
              componentId: comp.id,
              pinId: `row_${r}_f`,
              group: comp.name,
            });
          }
        }

        // 3. Unwired rows for direct tie selection
        for (let r = 1; r <= 30; r++) {
          const hasLeft = ['a', 'b', 'c', 'd', 'e'].some((c) => connectedHoles.has(`row_${r}_${c}`));
          if (!hasLeft) {
            list.push({
              id: `${comp.id}:row_${r}_a`,
              name: `${comp.name} — Row ${r} (Tie Holes A-E)`,
              componentId: comp.id,
              pinId: `row_${r}_a`,
              group: comp.name,
            });
          }
        }
        return;
      }

      comp.pins.forEach((pin) => {
        list.push({
          id: `${comp.id}:${pin.id}`,
          name: `${comp.name} — ${pin.name}`,
          componentId: comp.id,
          pinId: pin.id,
          group: comp.name,
        });
      });
    });

    return list;
  }, [projectState.components, projectState.connections]);

  // Handle live canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = (timestamp: number) => {
      animId = requestAnimationFrame(render);

      const state = oscilloscopeStore.getState();
      const proj = projectStore.getState();

      const width = canvas.width;
      const height = canvas.height;

      // Deep dark phosphor CRT oscilloscope background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      const padX = 36;
      const padY = 32;
      const gridW = width - padX * 2;
      const gridH = height - padY * 2;

      const xDivs = 10;
      const yDivs = 8;
      const dx = gridW / xDivs;
      const dy = gridH / yDivs;
      const midX = padX + gridW / 2;
      const midY = padY + gridH / 2;

      // 1. Dotted Graticule Background Grid
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      ctx.beginPath();
      for (let i = 1; i < xDivs; i++) {
        const x = padX + i * dx;
        ctx.moveTo(x, padY);
        ctx.lineTo(x, padY + gridH);
      }
      for (let j = 1; j < yDivs; j++) {
        const y = padY + j * dy;
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + gridW, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Outer Graticule Border
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padX, padY, gridW, gridH);

      // Center Axes with Minor Tick Marks
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + gridW, midY);
      ctx.moveTo(midX, padY);
      ctx.lineTo(midX, padY + gridH);
      ctx.stroke();

      // Minor subdivision ticks along center axes (5 subdivisions per major division)
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= xDivs * 5; i++) {
        const x = padX + (i * dx) / 5;
        const tickH = i % 5 === 0 ? 6 : 3;
        ctx.moveTo(x, midY - tickH);
        ctx.lineTo(x, midY + tickH);
      }
      for (let j = 0; j <= yDivs * 5; j++) {
        const y = padY + (j * dy) / 5;
        const tickW = j % 5 === 0 ? 6 : 3;
        ctx.moveTo(midX - tickW, y);
        ctx.lineTo(midX + tickW, y);
      }
      ctx.stroke();

      // 2. Evaluate Signals (check manual target or physical 3D oscilloscope probe wire)
      let resolvedTarget1 = state.ch1ProbeEndpoint;
      if (!resolvedTarget1) {
        const oscComp = proj.components.find((c) => c.type === 'oscilloscope');
        if (oscComp) {
          const conn1 = proj.connections.find(
            (c) =>
              (c.source.componentId === oscComp.id && (c.source.interfaceId === 'ch1_probe' || c.source.pinId === 'ch1_probe')) ||
              (c.target.componentId === oscComp.id && (c.target.interfaceId === 'ch1_probe' || c.target.pinId === 'ch1_probe'))
          );
          if (conn1) {
            const ep = conn1.source.componentId === oscComp.id ? conn1.target : conn1.source;
            resolvedTarget1 = { componentId: ep.componentId, pinId: ep.interfaceId || ep.pinId || '' };
          }
        }
      }

      let resolvedTarget2 = state.ch2ProbeEndpoint;
      if (!resolvedTarget2) {
        const oscComp = proj.components.find((c) => c.type === 'oscilloscope');
        if (oscComp) {
          const conn2 = proj.connections.find(
            (c) =>
              (c.source.componentId === oscComp.id && (c.source.interfaceId === 'ch2_probe' || c.source.pinId === 'ch2_probe')) ||
              (c.target.componentId === oscComp.id && (c.target.interfaceId === 'ch2_probe' || c.target.pinId === 'ch2_probe'))
          );
          if (conn2) {
            const ep = conn2.source.componentId === oscComp.id ? conn2.target : conn2.source;
            resolvedTarget2 = { componentId: ep.componentId, pinId: ep.interfaceId || ep.pinId || '' };
          }
        }
      }

      const sig1 = OscilloscopeSignalEngine.resolveChannelSignal(
        resolvedTarget1,
        proj.components,
        proj.connections,
        state.ch1
      );
      const sig2 = OscilloscopeSignalEngine.resolveChannelSignal(
        resolvedTarget2,
        proj.components,
        proj.connections,
        state.ch2
      );

      const totalTimeSpan = state.horizontal.timePerDiv * xDivs;
      const tNow = state.isRunning ? timestamp / 1000 : 0;
      const tStart = tNow + state.horizontal.offsetX;

      // Update computed measurements periodically
      if (Math.floor(timestamp) % 15 === 0) {
        const m1 = OscilloscopeSignalEngine.computeMeasurements(sig1, tStart, totalTimeSpan, 300);
        const m2 = OscilloscopeSignalEngine.computeMeasurements(sig2, tStart, totalTimeSpan, 300);
        oscilloscopeStore.updateMeasurements(m1, m2);
      }

      // 3. Render Mode: Time Domain Waveform or FFT Spectrum
      if (state.viewMode === 'time') {
        const drawTrace = (
          sig: typeof sig1,
          chSettings: typeof state.ch1,
          color: string,
          channelTag: string
        ) => {
          if (!chSettings.enabled || chSettings.coupling === 'gnd') return;

          const steps = 600;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.2;
          ctx.shadowColor = color;
          ctx.shadowBlur = 6;

          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const frac = i / steps;
            const t = tStart + frac * totalTimeSpan;
            let v = sig.voltageAtTime(t);

            // AC Coupling removes DC offset component
            if (chSettings.coupling === 'ac') {
              v -= sig.nominalOffset;
            }

            const vOffset = chSettings.offsetY * chSettings.voltsPerDiv;
            const deltaV = v - vOffset;
            const pixelsPerVolt = dy / chSettings.voltsPerDiv;
            const screenY = midY - deltaV * pixelsPerVolt;
            const screenX = padX + frac * gridW;

            const clampedY = Math.max(padY, Math.min(padY + gridH, screenY));

            if (i === 0) ctx.moveTo(screenX, clampedY);
            else ctx.lineTo(screenX, clampedY);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Channel Ground Reference Tag Indicator on left edge
          const groundTagY = midY - (-chSettings.offsetY * chSettings.voltsPerDiv) * (dy / chSettings.voltsPerDiv);
          const clampedTagY = Math.max(padY + 8, Math.min(padY + gridH - 8, groundTagY));
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(padX - 2, clampedTagY);
          ctx.lineTo(padX - 14, clampedTagY - 7);
          ctx.lineTo(padX - 14, clampedTagY + 7);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#030712';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText(channelTag, padX - 12, clampedTagY + 3);
        };

        // Draw CH2 then CH1
        drawTrace(sig2, state.ch2, state.ch2.color, '2');
        drawTrace(sig1, state.ch1, state.ch1.color, '1');

        // Trigger Level Indicator on right edge
        const trigY = midY - (state.trigger.level - (state.ch1.offsetY * state.ch1.voltsPerDiv)) * (dy / state.ch1.voltsPerDiv);
        const clampedTrigY = Math.max(padY + 8, Math.min(padY + gridH - 8, trigY));
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(padX + gridW + 2, clampedTrigY);
        ctx.lineTo(padX + gridW + 14, clampedTrigY - 7);
        ctx.lineTo(padX + gridW + 14, clampedTrigY + 7);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('T', padX + gridW + 5, clampedTrigY + 3);

      } else {
        // 4. FFT Frequency Spectrum View
        ctx.fillStyle = '#eab308';
        const numBars = 64;
        const barW = (gridW / numBars) * 0.8;
        const fFund = sig1.nominalFreq || 1000;

        for (let b = 1; b <= numBars; b++) {
          const barFreq = b * (fFund / 4);
          let power = 0;
          // Peak near fundamental and harmonics
          if (Math.abs(barFreq - fFund) < fFund * 0.2) {
            power = 0.9;
          } else if (Math.abs(barFreq - fFund * 2) < fFund * 0.2) {
            power = 0.45;
          } else if (Math.abs(barFreq - fFund * 3) < fFund * 0.2) {
            power = 0.28;
          } else {
            power = 0.05 + Math.random() * 0.04;
          }

          const barH = power * (gridH * 0.85);
          const bx = padX + (b - 1) * (gridW / numBars);
          const by = padY + gridH - barH;

          ctx.fillRect(bx, by, barW, barH);
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  if (!oscState.isOpen) return null;

  return (
    <div
      id="virtual-oscilloscope-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        {/* DSO Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Activity size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm tracking-wide text-white">
                  DS-1054Z Real-Time Digital Storage Oscilloscope
                </h3>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded font-mono">
                  100 MSa/s · Dual Channel
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Connected to circuit net: Probe breadboard holes, PWM outputs & analog sensors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Run / Stop Button */}
            <button
              id="osc-btn-run-stop"
              onClick={() => oscilloscopeStore.toggleRun()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                oscState.isRunning
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-500/20'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-xs shadow-red-500/20'
              }`}
            >
              {oscState.isRunning ? <Play size={13} fill="currentColor" /> : <Square size={13} fill="currentColor" />}
              <span>{oscState.isRunning ? 'RUN' : 'STOP'}</span>
            </button>

            {/* Auto-Set Button */}
            <button
              id="osc-btn-auto-set"
              onClick={() => oscilloscopeStore.autoSet(projectState.components, projectState.connections)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs shadow-blue-500/20 cursor-pointer"
              title="One-Touch AUTO-SET: Locks optimal Volts/Div and Time/Div"
            >
              <Sparkles size={13} />
              <span>AUTO-SET</span>
            </button>

            {/* Time / FFT Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => oscilloscopeStore.setViewMode('time')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  oscState.viewMode === 'time' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Waves size={13} className="inline mr-1" />
                Time
              </button>
              <button
                onClick={() => oscilloscopeStore.setViewMode('fft')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  oscState.viewMode === 'fft' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 size={13} className="inline mr-1" />
                FFT
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => oscilloscopeStore.closeOscilloscope()}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Oscilloscope (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Body: Display Canvas on Left, Precision Control Surface on Right */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: CRT Screen Display Area */}
          <div className="flex-1 flex flex-col p-4 bg-slate-950">
            {/* Top DSO Status Ribbon */}
            <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-t-lg text-slate-300">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${oscState.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <strong className={oscState.isRunning ? 'text-emerald-400' : 'text-red-400'}>
                    {oscState.isRunning ? 'TRIG\'D' : 'STOP'}
                  </strong>
                </span>
                <span>TD: {(oscState.horizontal.timePerDiv * 1000).toFixed(2)}ms/div</span>
                <span>HPos: {(oscState.horizontal.offsetX * 1000).toFixed(2)}ms</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Trig: {oscState.trigger.source.toUpperCase()} {oscState.trigger.slope === 'rising' ? '↑' : '↓'} {oscState.trigger.level.toFixed(2)}V</span>
                <span className="text-slate-400">100 MSa/s</span>
              </div>
            </div>

            {/* Phosphor Oscilloscope Screen Canvas */}
            <div className="relative border-x border-b border-slate-800 rounded-b-lg overflow-hidden bg-black flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={760}
                height={420}
                className="w-full h-auto aspect-[760/420] block cursor-crosshair"
              />
            </div>

            {/* Live Measurements Readout Banner */}
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-mono">
              {/* CH1 Measurements */}
              <div className="p-2.5 rounded-lg bg-yellow-950/20 border border-yellow-800/40 text-yellow-300 flex flex-col gap-1">
                <div className="flex items-center justify-between font-bold text-[11px] pb-1 border-b border-yellow-800/30">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                    CH1 Telemetry ({oscState.measurementsCH1.detectedType})
                  </span>
                  <span className="text-yellow-400/80 font-normal truncate max-w-[180px]">
                    {oscState.measurementsCH1.connectedSource || 'Floating'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>Vpp: <strong>{oscState.measurementsCH1.vpp}V</strong></div>
                  <div>Vrms: <strong>{oscState.measurementsCH1.vrms}V</strong></div>
                  <div>Freq: <strong>{oscState.measurementsCH1.frequency > 1000 ? `${(oscState.measurementsCH1.frequency / 1000).toFixed(2)}kHz` : `${oscState.measurementsCH1.frequency}Hz`}</strong></div>
                  <div>Duty: <strong>{oscState.measurementsCH1.dutyCycle}%</strong></div>
                </div>
              </div>

              {/* CH2 Measurements */}
              <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-cyan-300 flex flex-col gap-1">
                <div className="flex items-center justify-between font-bold text-[11px] pb-1 border-b border-cyan-800/30">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                    CH2 Telemetry ({oscState.measurementsCH2.detectedType})
                  </span>
                  <span className="text-cyan-400/80 font-normal truncate max-w-[180px]">
                    {oscState.measurementsCH2.connectedSource || 'Floating'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>Vpp: <strong>{oscState.measurementsCH2.vpp}V</strong></div>
                  <div>Vrms: <strong>{oscState.measurementsCH2.vrms}V</strong></div>
                  <div>Freq: <strong>{oscState.measurementsCH2.frequency > 1000 ? `${(oscState.measurementsCH2.frequency / 1000).toFixed(2)}kHz` : `${oscState.measurementsCH2.frequency}Hz`}</strong></div>
                  <div>Duty: <strong>{oscState.measurementsCH2.dutyCycle}%</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Instrument Physical Knobs & Control Rack */}
          <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/90 p-4 flex flex-col gap-4 overflow-y-auto max-h-[580px]">
            {/* 1. Probe Signal Targets (Probe Any Circuit Pin or Generator) */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Cable size={14} />
                  Active Probes
                </span>
                <span className="text-[10px] text-slate-400">Select circuit node</span>
              </div>

              {/* CH1 Probe Source Picker */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[11px] text-yellow-400 font-medium flex items-center justify-between">
                  <span>CH1 Input (Probe A)</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {wiredTargets.ch1 && !oscState.ch1ProbeEndpoint ? '3D Wire Active' : 'Yellow trace'}
                  </span>
                </label>
                <select
                  value={
                    oscState.ch1ProbeEndpoint
                      ? `${oscState.ch1ProbeEndpoint.componentId}:${oscState.ch1ProbeEndpoint.pinId}`
                      : 'auto'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto' || val === 'none') {
                      oscilloscopeStore.setProbeTarget('ch1', null);
                    } else {
                      const [compId, pinId] = val.split(':');
                      oscilloscopeStore.setProbeTarget('ch1', { componentId: compId, pinId });
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-yellow-500"
                >
                  <option value="auto">
                    {wiredTargets.ch1
                      ? `⚡ Auto: 3D Wire Connected (${wiredTargets.ch1.name})`
                      : '-- Auto: Follow 3D Wire / Ambient Pickup --'}
                  </option>
                  {availableProbeTargets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* CH2 Probe Source Picker */}
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-[11px] text-cyan-400 font-medium flex items-center justify-between">
                  <span>CH2 Input (Probe B)</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {wiredTargets.ch2 && !oscState.ch2ProbeEndpoint ? '3D Wire Active' : 'Cyan trace'}
                  </span>
                </label>
                <select
                  value={
                    oscState.ch2ProbeEndpoint
                      ? `${oscState.ch2ProbeEndpoint.componentId}:${oscState.ch2ProbeEndpoint.pinId}`
                      : 'auto'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'auto' || val === 'none') {
                      oscilloscopeStore.setProbeTarget('ch2', null);
                    } else {
                      const [compId, pinId] = val.split(':');
                      oscilloscopeStore.setProbeTarget('ch2', { componentId: compId, pinId });
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value="auto">
                    {wiredTargets.ch2
                      ? `⚡ Auto: 3D Wire Connected (${wiredTargets.ch2.name})`
                      : '-- Auto: Follow 3D Wire / Ambient Pickup --'}
                  </option>
                  {availableProbeTargets.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Horizontal Timebase Control Rack */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>HORIZONTAL (TIMEBASE)</span>
                <span className="font-mono text-blue-400 text-[11px]">
                  {(oscState.horizontal.timePerDiv * 1000).toFixed(2)} ms/div
                </span>
              </div>

              {/* Quick Preset Buttons for Timebase */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                {[
                  { label: '50µs', val: 0.00005 },
                  { label: '200µs', val: 0.0002 },
                  { label: '500µs', val: 0.0005 },
                  { label: '1ms', val: 0.001 },
                  { label: '2ms', val: 0.002 },
                  { label: '5ms', val: 0.005 },
                  { label: '10ms', val: 0.01 },
                  { label: '20ms', val: 0.02 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => oscilloscopeStore.setTimePerDiv(item.val)}
                    className={`py-1 rounded font-medium transition-colors cursor-pointer ${
                      Math.abs(oscState.horizontal.timePerDiv - item.val) < 0.00001
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Horizontal Position Offset Slider */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[11px] text-slate-400">H-Position:</span>
                <input
                  type="range"
                  min="-0.01"
                  max="0.01"
                  step="0.0001"
                  value={oscState.horizontal.offsetX}
                  onChange={(e) => oscilloscopeStore.setOffsetX(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <button
                  onClick={() => oscilloscopeStore.setOffsetX(0)}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  title="Zero Offset"
                >
                  0
                </button>
              </div>
            </div>

            {/* 3. Channel 1 Vertical Rack */}
            <div className="bg-slate-950/60 border border-yellow-900/50 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-yellow-400">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={oscState.ch1.enabled}
                    onChange={(e) => oscilloscopeStore.setChannelEnabled('ch1', e.target.checked)}
                    className="accent-yellow-500 rounded"
                  />
                  <span>CH1 VERTICAL SCALE</span>
                </div>
                <span className="font-mono text-[11px]">
                  {oscState.ch1.voltsPerDiv >= 1 ? `${oscState.ch1.voltsPerDiv}V` : `${oscState.ch1.voltsPerDiv * 1000}mV`}/div
                </span>
              </div>

              {/* CH1 Volts/Div Presets */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                {[
                  { label: '100mV', val: 0.1 },
                  { label: '200mV', val: 0.2 },
                  { label: '500mV', val: 0.5 },
                  { label: '1V', val: 1.0 },
                  { label: '2V', val: 2.0 },
                  { label: '5V', val: 5.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => oscilloscopeStore.setVoltsPerDiv('ch1', item.val)}
                    className={`py-1 rounded font-medium transition-colors cursor-pointer ${
                      Math.abs(oscState.ch1.voltsPerDiv - item.val) < 0.01
                        ? 'bg-yellow-600 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* CH1 Y Offset Position */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[11px] text-slate-400">V-Pos:</span>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={oscState.ch1.offsetY}
                  onChange={(e) => oscilloscopeStore.setOffsetY('ch1', parseFloat(e.target.value))}
                  className="flex-1 accent-yellow-500 cursor-pointer"
                />
                <button
                  onClick={() => oscilloscopeStore.setOffsetY('ch1', 0)}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  title="Zero Offset"
                >
                  0
                </button>
              </div>

              {/* CH1 Coupling: DC / AC / GND */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">Coupling:</span>
                <div className="flex bg-slate-800 rounded p-0.5 text-[10px]">
                  {(['dc', 'ac', 'gnd'] as CouplingMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => oscilloscopeStore.setCoupling('ch1', mode)}
                      className={`px-2 py-0.5 rounded uppercase font-mono ${
                        oscState.ch1.coupling === mode ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Channel 2 Vertical Rack */}
            <div className="bg-slate-950/60 border border-cyan-900/50 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={oscState.ch2.enabled}
                    onChange={(e) => oscilloscopeStore.setChannelEnabled('ch2', e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>CH2 VERTICAL SCALE</span>
                </div>
                <span className="font-mono text-[11px]">
                  {oscState.ch2.voltsPerDiv >= 1 ? `${oscState.ch2.voltsPerDiv}V` : `${oscState.ch2.voltsPerDiv * 1000}mV`}/div
                </span>
              </div>

              {/* CH2 Volts/Div Presets */}
              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                {[
                  { label: '100mV', val: 0.1 },
                  { label: '200mV', val: 0.2 },
                  { label: '500mV', val: 0.5 },
                  { label: '1V', val: 1.0 },
                  { label: '2V', val: 2.0 },
                  { label: '5V', val: 5.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => oscilloscopeStore.setVoltsPerDiv('ch2', item.val)}
                    className={`py-1 rounded font-medium transition-colors cursor-pointer ${
                      Math.abs(oscState.ch2.voltsPerDiv - item.val) < 0.01
                        ? 'bg-cyan-600 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* CH2 Y Offset Position */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[11px] text-slate-400">V-Pos:</span>
                <input
                  type="range"
                  min="-4"
                  max="4"
                  step="0.1"
                  value={oscState.ch2.offsetY}
                  onChange={(e) => oscilloscopeStore.setOffsetY('ch2', parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <button
                  onClick={() => oscilloscopeStore.setOffsetY('ch2', 0)}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  title="Zero Offset"
                >
                  0
                </button>
              </div>

              {/* CH2 Coupling */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400">Coupling:</span>
                <div className="flex bg-slate-800 rounded p-0.5 text-[10px]">
                  {(['dc', 'ac', 'gnd'] as CouplingMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => oscilloscopeStore.setCoupling('ch2', mode)}
                      className={`px-2 py-0.5 rounded uppercase font-mono ${
                        oscState.ch2.coupling === mode ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Trigger Rack */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>TRIGGER SETTINGS</span>
                <span className="font-mono text-orange-400 text-[11px]">
                  {oscState.trigger.source.toUpperCase()} {oscState.trigger.level.toFixed(2)}V
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Source:</span>
                  <div className="flex bg-slate-800 rounded p-0.5 text-[11px]">
                    <button
                      onClick={() => oscilloscopeStore.setTrigger({ source: 'ch1' })}
                      className={`flex-1 py-1 rounded font-mono ${
                        oscState.trigger.source === 'ch1' ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      CH1
                    </button>
                    <button
                      onClick={() => oscilloscopeStore.setTrigger({ source: 'ch2' })}
                      className={`flex-1 py-1 rounded font-mono ${
                        oscState.trigger.source === 'ch2' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      CH2
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Slope:</span>
                  <div className="flex bg-slate-800 rounded p-0.5 text-[11px]">
                    <button
                      onClick={() => oscilloscopeStore.setTrigger({ slope: 'rising' })}
                      className={`flex-1 py-1 rounded font-mono ${
                        oscState.trigger.slope === 'rising' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      ↑ Rise
                    </button>
                    <button
                      onClick={() => oscilloscopeStore.setTrigger({ slope: 'falling' })}
                      className={`flex-1 py-1 rounded font-mono ${
                        oscState.trigger.slope === 'falling' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      ↓ Fall
                    </button>
                  </div>
                </div>
              </div>

              {/* Trigger Level Slider */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[11px] text-slate-400">Level:</span>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={oscState.trigger.level}
                  onChange={(e) => oscilloscopeStore.setTrigger({ level: parseFloat(e.target.value) })}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <button
                  onClick={() => oscilloscopeStore.setTrigger({ level: 1.5 })}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  title="TTL 1.5V Level"
                >
                  1.5V
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
