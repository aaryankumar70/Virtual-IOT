import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Activity,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  ChevronDown,
  Layers,
  Radio,
  Zap,
  RotateCcw,
  BarChart3,
  Waves,
  Eye,
  EyeOff,
  Cpu,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import {
  ComponentSignalResolver,
  ComponentSignalProfile,
  PinSignalInfo,
} from '../../core/signals/componentSignalResolver';

interface WaveformPoint {
  time: string;
  tVal: number;
  [pinKey: string]: number | string;
}

export const RealtimeSignalOverlay: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const [isPaused, setIsPaused] = useState(false);
  const [viewMode, setViewMode] = useState<'waveforms' | 'levels' | 'split'>('waveforms');
  const [timeWindowMs, setTimeWindowMs] = useState<number>(30); // 10ms, 30ms, 60ms, 100ms
  const [activePinIds, setActivePinIds] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Identify active target component: prioritize selected component, or fallback to first active component in scene
  const targetComponent = useMemo(() => {
    const selectedId = viewState.selectedComponentIds[0];
    if (selectedId) {
      const comp = projectState.components.find((c) => c.id === selectedId);
      if (comp) return comp;
    }
    // Fallback: look for a logic gate, microcontroller, or sensor
    return (
      projectState.components.find((c) => c.type.startsWith('gate-')) ||
      projectState.components.find((c) => c.type === 'arduino-uno' || c.type === 'esp32') ||
      projectState.components.find((c) => c.type === 'led' || c.type === 'resistor') ||
      projectState.components[0] ||
      null
    );
  }, [viewState.selectedComponentIds, projectState.components]);

  // Compute signal profile for target component
  const profile: ComponentSignalProfile | null = useMemo(() => {
    if (!targetComponent) return null;
    return ComponentSignalResolver.resolveComponentSignals(
      targetComponent,
      projectState.components,
      projectState.connections
    );
  }, [targetComponent, projectState.components, projectState.connections]);

  // Reset or update active monitored pins when target changes
  useEffect(() => {
    if (profile) {
      setActivePinIds(profile.primaryPinIds.length > 0 ? profile.primaryPinIds : profile.pins.map((p) => p.pinId));
    }
  }, [profile?.componentId]);

  // Real-time animation buffer state
  const [chartData, setChartData] = useState<WaveformPoint[]>([]);
  const [instantVoltages, setInstantVoltages] = useState<{ pinId: string; name: string; voltage: number; color: string; pattern: string }[]>([]);
  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!viewState.signalOverlayOpen || isPaused || !profile) return;

    const sampleCount = 36;
    const intervalMs = timeWindowMs / sampleCount;

    const tick = (nowMs: number) => {
      // Throttle render ticks to ~30-40fps for optimal performance
      if (nowMs - lastUpdateRef.current >= 28) {
        lastUpdateRef.current = nowMs;
        timeRef.current += 0.0016; // advance simulation time
        const currentSimTime = timeRef.current;

        // Generate time-window slice
        const newPoints: WaveformPoint[] = [];
        for (let i = 0; i < sampleCount; i++) {
          const tOffset = (i - sampleCount) * (intervalMs / 1000);
          const t = currentSimTime + tOffset;
          const pt: WaveformPoint = {
            time: `${((i * intervalMs)).toFixed(1)}ms`,
            tVal: i * intervalMs,
          };

          profile.pins.forEach((pin) => {
            if (activePinIds.includes(pin.pinId)) {
              const rawV = pin.evaluator(t);
              pt[pin.pinId] = Number(rawV.toFixed(2));
            }
          });
          newPoints.push(pt);
        }

        setChartData(newPoints);

        // Compute current instantaneous snapshot
        const levels = profile.pins.map((pin) => {
          const currentV = Number(pin.evaluator(currentSimTime).toFixed(2));
          return {
            pinId: pin.pinId,
            name: pin.pinName,
            voltage: Math.max(0, currentV),
            color: pin.color,
            pattern: pin.patternType,
          };
        });
        setInstantVoltages(levels);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewState.signalOverlayOpen, isPaused, profile, timeWindowMs, activePinIds]);

  if (!viewState.signalOverlayOpen) return null;

  // Minimized floating pill
  if (viewState.signalOverlayMinimized) {
    return (
      <div
        id="signal-overlay-minimized"
        onClick={() => viewStore.setSignalOverlayMinimized(false)}
        className="absolute bottom-16 right-4 z-20 flex items-center gap-2.5 bg-slate-900/90 text-white px-3.5 py-2 rounded-full shadow-lg border border-slate-700/80 backdrop-blur-md cursor-pointer hover:bg-slate-900 transition-all group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <Activity size={14} className="text-cyan-400" />
        <span className="text-xs font-medium">Signals: {profile ? profile.componentName : 'No Component'}</span>
        <Maximize2 size={13} className="text-slate-400 group-hover:text-white transition-colors" />
      </div>
    );
  }

  const togglePin = (pinId: string) => {
    setActivePinIds((prev) =>
      prev.includes(pinId) ? (prev.length > 1 ? prev.filter((id) => id !== pinId) : prev) : [...prev, pinId]
    );
  };

  return (
    <div
      id="realtime-signal-overlay"
      className="absolute bottom-3 right-3 z-20 w-[440px] sm:w-[480px] max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-2xl overflow-hidden select-none transition-all flex flex-col font-sans"
    >
      {/* 1. Header Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <Activity size={13} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 truncate">
                Signal Visualization
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-700 bg-cyan-100/80 px-1.5 py-0.2 rounded font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                Recharts Live
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">
              {profile ? profile.componentName : 'Select a component to inspect'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause / Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume live signal stream' : 'Pause signal waveform'}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-100 text-amber-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
            }`}
          >
            {isPaused ? <Play size={13} className="fill-current" /> : <Pause size={13} className="fill-current" />}
          </button>

          {/* Minimize */}
          <button
            onClick={() => viewStore.setSignalOverlayMinimized(true)}
            title="Minimize to floating pill"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <Minimize2 size={13} />
          </button>

          {/* Close */}
          <button
            onClick={() => viewStore.setSignalOverlay(false)}
            title="Close signal overlay"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. Component Switcher & View Mode Toolbar */}
      <div className="px-3.5 py-1.5 border-b border-slate-100 bg-white flex items-center justify-between text-xs gap-2">
        {/* Component Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSelectorOpen(!isSelectorOpen)}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-700 hover:text-blue-600 bg-slate-100/80 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer max-w-[210px]"
          >
            <Cpu size={12} className="text-slate-500 shrink-0" />
            <span className="truncate">{targetComponent ? targetComponent.name : 'Select Component'}</span>
            <ChevronDown size={11} className="text-slate-400 shrink-0" />
          </button>

          {isSelectorOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-30 text-[11px]">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Circuit Components
              </div>
              {projectState.components.length === 0 ? (
                <div className="px-3 py-2 text-slate-400 text-[11px]">No components in scene</div>
              ) : (
                projectState.components.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      viewStore.selectComponent(c.id);
                      setIsSelectorOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors cursor-pointer ${
                      targetComponent?.id === c.id ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[9.5px] text-slate-400 font-mono capitalize ml-1 shrink-0">{c.type}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* View Mode Segmented Control: Waveforms vs Levels vs Split */}
        <div className="flex items-center gap-0.5 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
          <button
            onClick={() => setViewMode('waveforms')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'waveforms' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Waves size={11} />
            <span>Waveform</span>
          </button>
          <button
            onClick={() => setViewMode('levels')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'levels' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={11} />
            <span>Levels</span>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'split' ? 'bg-white text-blue-600 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={11} />
            <span>Dual</span>
          </button>
        </div>

        {/* Timebase Selection (for Waveform) */}
        {viewMode !== 'levels' && (
          <div className="flex items-center gap-1">
            {[10, 30, 60].map((ms) => (
              <button
                key={ms}
                onClick={() => setTimeWindowMs(ms)}
                className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                  timeWindowMs === ms
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ms}ms
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Pin Channel Selector Chips */}
      {profile && (
        <div className="px-3.5 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            Channels:
          </span>
          {profile.pins.map((pin) => {
            const isActive = activePinIds.includes(pin.pinId);
            return (
              <button
                key={pin.pinId}
                onClick={() => togglePin(pin.pinId)}
                title={`Toggle ${pin.pinName} visibility on waveform`}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-white shadow-2xs border-slate-300 font-medium'
                    : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? pin.color : '#94a3b8' }}
                />
                <span className={isActive ? 'text-slate-800' : 'text-slate-400 line-through'}>
                  {pin.pinName}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Chart Content Area */}
      <div className="p-3 bg-white flex flex-col gap-3">
        {/* Mode A: Waveforms (Recharts AreaChart / Multi-Channel Line) */}
        {(viewMode === 'waveforms' || viewMode === 'split') && (
          <div className="w-full">
            <div className="flex items-center justify-between text-[11px] mb-1 text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-slate-700 font-semibold font-sans">
                <Waves size={12} className="text-cyan-600" />
                Live Voltage Waveforms V(t)
              </span>
              <span>Time Window: {timeWindowMs}ms</span>
            </div>

            <div className={`w-full ${viewMode === 'split' ? 'h-36' : 'h-48'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    {profile?.pins.map((pin) => (
                      <linearGradient key={`grad-${pin.pinId}`} id={`grad-${pin.pinId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={pin.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={pin.color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[-0.2, 5.5]}
                    ticks={[0, 1.5, 3.3, 5.0]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${v}V`}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  {/* Reference Lines for Standard Electronics Levels */}
                  <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: '5V VCC', fill: '#ef4444', fontSize: 8, position: 'right' }} />
                  <ReferenceLine y={3.3} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={1} label={{ value: '3.3V', fill: '#a855f7', fontSize: 8, position: 'right' }} />
                  <ReferenceLine y={0.0} stroke="#64748b" strokeWidth={1} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '6px 10px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '2px' }}
                    formatter={(val: any, name: any) => {
                      const pin = profile?.pins.find((p) => p.pinId === name);
                      return [`${val} V`, pin ? pin.pinName : name];
                    }}
                  />

                  {profile?.pins
                    .filter((pin) => activePinIds.includes(pin.pinId))
                    .map((pin) => (
                      <Area
                        key={pin.pinId}
                        type="monotone"
                        dataKey={pin.pinId}
                        stroke={pin.color}
                        strokeWidth={2}
                        fill={`url(#grad-${pin.pinId})`}
                        isAnimationActive={false}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Mode B: Voltage Levels (Recharts BarChart) */}
        {(viewMode === 'levels' || viewMode === 'split') && (
          <div className="w-full">
            <div className="flex items-center justify-between text-[11px] mb-1 text-slate-500 font-mono">
              <span className="flex items-center gap-1 text-slate-700 font-semibold font-sans">
                <BarChart3 size={12} className="text-emerald-600" />
                Instantaneous Pin Voltage Levels
              </span>
              <span>Range: 0.0V – 5.0V</span>
            </div>

            <div className={`w-full ${viewMode === 'split' ? 'h-32' : 'h-48'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={instantVoltages} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[0, 5.5]}
                    ticks={[0, 1.5, 3.3, 5.0]}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    tickFormatter={(v) => `${v}V`}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine y={3.3} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={1} />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} V (${item.payload.pattern})`,
                      'Voltage',
                    ]}
                  />

                  <Bar dataKey="voltage" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {instantVoltages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 5. Live Telemetry Metric Cards */}
        {profile && (
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
            {profile.pins.slice(0, 3).map((pin) => {
              const currentV = instantVoltages.find((v) => v.pinId === pin.pinId)?.voltage ?? pin.nominalVoltage;
              return (
                <div
                  key={pin.pinId}
                  className="bg-slate-50/90 border border-slate-200/70 rounded-lg p-2 flex flex-col gap-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-semibold truncate">
                      {pin.pinName}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: pin.color }}
                    />
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 leading-tight">
                    {currentV.toFixed(2)}
                    <span className="text-[10px] font-normal text-slate-500 ml-0.5">V</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono truncate">
                    {pin.patternType}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Footer Tip */}
      <div className="px-3.5 py-1.5 bg-slate-50/80 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 truncate">
          <Zap size={11} className="text-amber-500 shrink-0" />
          <span className="truncate">Click any 3D component to instantly visualize its signal voltages.</span>
        </span>
        <button
          onClick={() => {
            if (targetComponent) viewStore.triggerCamera('focusSelected');
          }}
          className="text-blue-600 hover:text-blue-700 font-medium ml-2 shrink-0 cursor-pointer text-[10px]"
        >
          Focus 3D
        </button>
      </div>
    </div>
  );
};
