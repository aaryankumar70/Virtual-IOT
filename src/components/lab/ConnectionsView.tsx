/**
 * Virtual IoT Lab — Connections Engine View
 *
 * Interactive electrical wiring, signal buses, and mechanical couplings.
 * Enables students to disconnect cables, inspect continuity, trace pinouts,
 * and observe functional consequences on the drone system.
 */

import React, { useState, useEffect } from 'react';
import { connectionGraph, LabConnection } from '../../core/connectionEngine/ConnectionGraph';
import { simulationEngine } from '../../core/simulationEngine/SimulationEngine';
import {
  Cable,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Power,
  Radio,
  Video,
  Layers,
  HelpCircle,
} from 'lucide-react';

export const ConnectionsView: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return connectionGraph.subscribe(() => setTick((t) => t + 1));
  }, []);

  const connections = connectionGraph.getAll();
  const telem = simulationEngine.getTelemetry();

  const handleToggle = (connId: string, current: boolean) => {
    connectionGraph.setConnectionState(connId, !current);
  };

  const getCategoryIcon = (category: LabConnection['category']) => {
    switch (category) {
      case 'power':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'phase-motor':
        return <RotateCw className="w-4 h-4 text-sky-400" />;
      case 'signal-digital':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'analog-video':
        return <Video className="w-4 h-4 text-rose-400" />;
      case 'mechanical-shaft':
        return <Layers className="w-4 h-4 text-purple-400" />;
      default:
        return <Cable className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Left 2 Columns: Interactive Wiring Diagram & Harness Netlist */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Cable className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-zinc-100">Electrical, Signal & Mechanical Netlist</h2>
          </div>
          <button
            onClick={() => connectionGraph.resetDefaultConnections()}
            className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reset All Connections
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 custom-scrollbar">
          {connections.map((conn) => {
            return (
              <div
                key={conn.id}
                className={`p-3 rounded-lg border transition-all ${
                  conn.isConnected
                    ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
                    : 'bg-rose-950/20 border-rose-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 mt-0.5">
                      {getCategoryIcon(conn.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-100">{conn.name}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          {conn.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">{conn.description}</p>
                      <div className="text-[11px] font-mono text-zinc-400 mt-2 flex items-center gap-2">
                        <span className="text-sky-300 font-medium">{conn.sourceInterfaceId}</span>
                        <span>⟶</span>
                        <span className="text-emerald-300 font-medium">{conn.targetInterfaceId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                        conn.isConnected
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/80'
                      }`}
                    >
                      {conn.isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Connected
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Severed / Open
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => handleToggle(conn.id, conn.isConnected)}
                      className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                        conn.isConnected
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                          : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800'
                      }`}
                    >
                      {conn.isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Electrical Circuit & Telemetry Impact Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-zinc-100">Circuit Continuity Impact</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {/* Main Power Circuit Status */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Main Battery XT60 Circuit</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  connectionGraph.isBatteryPowered()
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {connectionGraph.isBatteryPowered() ? 'ENERGIZED' : '0V DEAD'}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-zinc-100">
                {connectionGraph.isBatteryPowered() ? telem.batteryLoadedVoltageV.toFixed(2) : '0.00'}
              </span>
              <span className="text-sm font-medium text-zinc-400">Volts DC</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              {connectionGraph.isBatteryPowered()
                ? 'Nominal 6S LiPo power distributed to 4-in-1 ESC and onboard 5V/9V regulators.'
                : 'CRITICAL: Disconnecting XT60 removes all power from the ESC inverters and BECs. Flight controller and motors cannot operate.'}
            </p>
          </div>

          {/* Motor 3-Phase Continuity Table */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium mb-2">Motor Power & Mechanical Coupling Status</div>
            <div className="space-y-2 text-xs">
              {[0, 1, 2, 3].map((idx) => {
                const wired = connectionGraph.isMotorElectricallyConnected(idx);
                const propCoupled = connectionGraph.isPropellerCoupled(idx);

                return (
                  <div key={idx} className="p-2 bg-zinc-900 rounded border border-zinc-800">
                    <div className="flex items-center justify-between font-medium text-zinc-200">
                      <span>Motor {idx + 1} (M{idx + 1})</span>
                      <span className="font-mono text-zinc-400">{Math.round(telem.motorRpm[idx])} RPM</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                      <span className={wired ? 'text-emerald-400' : 'text-rose-400'}>
                        Phases: {wired ? 'Continuity OK' : 'Open Circuit'}
                      </span>
                      <span className={propCoupled ? 'text-emerald-400' : 'text-amber-400'}>
                        Prop Nut: {propCoupled ? 'Locked' : 'Uncoupled'}
                      </span>
                    </div>
                    {!propCoupled && wired && (
                      <div className="text-[10px] text-amber-300 mt-1">
                        Warning: Motor spins freely with no aerodynamic resistance; 0N thrust generated!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Note */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-900/60 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
              <HelpCircle className="w-4 h-4" />
              Engineering Laboratory Principle
            </div>
            <p className="text-[11px] text-indigo-200/80 leading-relaxed">
              In real hardware, electrical disconnection (open circuit) or mechanical decoupling (loose prop nut)
              immediately alters the physical system. Experimenting with these failures helps engineers design robust
              failsafes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
