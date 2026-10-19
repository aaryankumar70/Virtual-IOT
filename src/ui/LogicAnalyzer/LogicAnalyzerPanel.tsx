import React, { useState } from 'react';
import {
  Activity,
  Play,
  Square,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Sliders,
  ChevronDown,
  Download,
  RotateCcw,
  Binary,
  Cpu,
  Radio,
  FileText,
  Search,
  Zap,
  Cable,
  CheckCircle2,
  ListFilter,
  Layers,
} from 'lucide-react';
import {
  logicAnalyzerStore,
  useLogicAnalyzer,
} from '../../state/logicAnalyzer/logicAnalyzerStore';
import { useProject } from '../../state/project/projectStore';
import { DigitalWaveformView } from './DigitalWaveformView';
import { PacketTableView } from './PacketTableView';
import { ProtocolType } from '../../core/logicAnalyzer/logicAnalyzerTypes';

export const LogicAnalyzerPanel: React.FC = () => {
  const state = useLogicAnalyzer();
  const projectState = useProject();

  const [activeTab, setActiveTab] = useState<'waveforms' | 'table' | 'split'>('split');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  if (!state.isOpen) return null;

  // Minimized floating badge
  if (state.isMinimized) {
    return (
      <div
        id="logic-analyzer-minimized"
        onClick={() => logicAnalyzerStore.toggleMinimized()}
        className="absolute bottom-16 left-4 z-30 flex items-center gap-2.5 bg-[#0a0f1d]/95 text-white px-3.5 py-2 rounded-full shadow-xl border border-slate-700/80 backdrop-blur-md cursor-pointer hover:bg-[#0f172a] transition-all group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        <Binary size={14} className="text-blue-400" />
        <span className="text-xs font-medium font-sans">
          Logic Analyzer ({state.activeProtocol.toUpperCase()} · {state.packets.length} pkts)
        </span>
        <Maximize2 size={13} className="text-slate-400 group-hover:text-white transition-colors" />
      </div>
    );
  }

  const handleAutoHookProbes = () => {
    logicAnalyzerStore.autoDetectCircuitProbes(
      projectState.components,
      projectState.connections
    );
  };

  return (
    <div
      id="logic-analyzer-modal"
      className="fixed inset-x-4 bottom-3 top-16 md:inset-x-8 md:bottom-4 md:top-18 z-30 flex flex-col bg-[#080d1a] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden text-white select-none backdrop-blur-xl transition-all"
    >
      {/* 1. Master Header Bar */}
      <div className="h-12 border-b border-slate-800 bg-[#0d1424] px-4 flex items-center justify-between shrink-0">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <Binary size={15} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs tracking-tight font-sans text-white">
                  Digital Logic Analyzer & Protocol Decoder
                </span>
                <span
                  className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                    state.isRunning
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      state.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {state.isRunning ? 'CAPTURING' : 'STOPPED'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
                Real-time capture & multi-protocol decoding (I2C · SPI · UART)
              </span>
            </div>
          </div>

          <div className="w-px h-5 bg-slate-800 mx-1 hidden lg:block" />

          {/* Protocol Selector Tabs */}
          <div className="hidden lg:flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800">
            {(['all', 'i2c', 'spi', 'uart'] as const).map((proto) => {
              const isActive = state.activeProtocol === proto;
              return (
                <button
                  key={proto}
                  onClick={() => logicAnalyzerStore.setProtocol(proto)}
                  className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {proto === 'all' ? 'All Protocols' : proto.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Capture Controls & Actions */}
        <div className="flex items-center gap-1.5">
          {/* Run / Stop Toggle */}
          <button
            onClick={() => logicAnalyzerStore.toggleRun()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans font-semibold transition-all cursor-pointer shadow-xs ${
              state.isRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {state.isRunning ? <Square size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
            <span>{state.isRunning ? 'Stop' : 'Run'}</span>
          </button>

          {/* Single Capture */}
          <button
            onClick={() => logicAnalyzerStore.singleCapture()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-sans font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Single Shot Capture"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Single</span>
          </button>

          {/* Auto-Hook Circuit Probes */}
          <button
            onClick={handleAutoHookProbes}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-sans font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 transition-colors cursor-pointer"
            title="Auto-Detect I2C/SPI/UART pins from 3D circuit"
          >
            <Cable size={12} className="text-cyan-400" />
            <span className="hidden xl:inline">Auto Probes</span>
          </button>

          {/* Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-sans font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Sparkles size={12} className="text-yellow-400" />
              <span className="hidden md:inline">Presets</span>
              <ChevronDown size={11} className="text-slate-400" />
            </button>

            {isPresetsOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-[#0d1424] border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-[11px] font-sans">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Protocol Traffic Presets
                </div>
                <button
                  onClick={() => {
                    logicAnalyzerStore.setProtocol('i2c');
                    setIsPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex flex-col text-slate-200 cursor-pointer"
                >
                  <span className="font-semibold text-cyan-300">OLED SSD1306 Display (I2C)</span>
                  <span className="text-[10px] text-slate-400">Address 0x3C Write + Init sequence</span>
                </button>
                <button
                  onClick={() => {
                    logicAnalyzerStore.setProtocol('i2c');
                    setIsPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex flex-col text-slate-200 cursor-pointer"
                >
                  <span className="font-semibold text-cyan-300">MPU-6050 6-DOF IMU (I2C)</span>
                  <span className="text-[10px] text-slate-400">Address 0x68 WHO_AM_I & Wakeup</span>
                </button>
                <button
                  onClick={() => {
                    logicAnalyzerStore.setProtocol('spi');
                    setIsPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex flex-col text-slate-200 cursor-pointer"
                >
                  <span className="font-semibold text-purple-300">SPI Flash Memory W25Q128</span>
                  <span className="text-[10px] text-slate-400">0x9F JEDEC ID & 0x02 Page Program</span>
                </button>
                <button
                  onClick={() => {
                    logicAnalyzerStore.setProtocol('uart');
                    setIsPresetsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex flex-col text-slate-200 cursor-pointer"
                >
                  <span className="font-semibold text-amber-300">UART Serial Telemetry Log</span>
                  <span className="text-[10px] text-slate-400">115200 Baud 8-N-1 ASCII messages</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: View Mode, Export, Minimize, Close */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle: Split vs Waveform vs Table */}
          <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2 py-1 rounded text-[10.5px] font-sans font-medium transition-colors cursor-pointer ${
                activeTab === 'split' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('waveforms')}
              className={`px-2 py-1 rounded text-[10.5px] font-sans font-medium transition-colors cursor-pointer ${
                activeTab === 'waveforms' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Waveforms
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`px-2 py-1 rounded text-[10.5px] font-sans font-medium transition-colors cursor-pointer ${
                activeTab === 'table' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Packets ({state.packets.length})
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Export captured data"
            >
              <Download size={14} />
            </button>
            {isExportMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-36 bg-[#0d1424] border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-[11px] font-sans">
                <button
                  onClick={() => {
                    logicAnalyzerStore.exportTraffic('csv');
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Export CSV Table
                </button>
                <button
                  onClick={() => {
                    logicAnalyzerStore.exportTraffic('json');
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Export JSON Dataset
                </button>
                <button
                  onClick={() => {
                    logicAnalyzerStore.exportTraffic('txt');
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 cursor-pointer"
                >
                  Export Text Summary
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => logicAnalyzerStore.toggleMinimized()}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minimize2 size={14} />
          </button>

          <button
            onClick={() => logicAnalyzerStore.closeLogicAnalyzer()}
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Main Content Views */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#090e1c]">
        {/* Waveforms Section */}
        {(activeTab === 'waveforms' || activeTab === 'split') && (
          <div className="shrink-0 overflow-hidden">
            <DigitalWaveformView
              channels={state.channels}
              packets={state.packets}
              waveforms={state.waveforms}
              timeWindowUs={state.timeWindowUs}
              offsetUs={state.offsetUs}
              totalTimeUs={state.totalCaptureTimeUs}
              selectedPacketId={state.selectedPacketId}
              cursorAUs={state.cursorAUs}
              cursorBUs={state.cursorBUs}
            />
          </div>
        )}

        {/* Packet Table Section */}
        {(activeTab === 'table' || activeTab === 'split') && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <PacketTableView
              packets={state.packets}
              selectedPacketId={state.selectedPacketId}
              selectedProtocolTab={state.selectedProtocolTab}
              searchFilter={state.searchFilter}
            />
          </div>
        )}
      </div>

      {/* 3. Footer Status Bar */}
      <div className="h-6 px-3 bg-[#070b14] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>Sample Rate: <strong>{(state.sampleRateKsps / 1000).toFixed(1)} MS/s</strong></span>
          <span>·</span>
          <span>Baud Rate: <strong>{state.baudRate}</strong></span>
          <span>·</span>
          <span>Total Packets: <strong>{state.packets.length}</strong></span>
          <span>·</span>
          <span>Total Captured Time: <strong>{(state.totalCaptureTimeUs / 1000).toFixed(2)} ms</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>Shortcut: Press <strong>L</strong> to toggle Logic Analyzer</span>
        </div>
      </div>
    </div>
  );
};
