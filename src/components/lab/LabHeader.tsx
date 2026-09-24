/**
 * Virtual IoT Lab — Engineering Laboratory Header & Workflow Navigator
 *
 * Provides primary workflow switching across the 6 core engineering domains:
 * Build -> Connect -> Code/Config -> Simulate -> Measure -> Experiment
 */

import React from 'react';
import { useLabStore, labStore, LabWorkflowMode } from '../../core/labStore';
import {
  Wrench,
  Cable,
  Cpu,
  Play,
  Activity,
  FlaskConical,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface LabHeaderProps {
  onToggleBreadboardCAD?: () => void;
  isBreadboardCAD?: boolean;
}

export const LabHeader: React.FC<LabHeaderProps> = ({ onToggleBreadboardCAD, isBreadboardCAD }) => {
  const { currentMode } = useLabStore();

  const workflowSteps: Array<{
    id: LabWorkflowMode;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
  }> = [
    {
      id: 'build',
      label: 'Build',
      subtitle: 'Assembly & Mass',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'connect',
      label: 'Connect',
      subtitle: 'Wiring & Pinouts',
      icon: <Cable className="w-4 h-4" />,
    },
    {
      id: 'code',
      label: 'Configure',
      subtitle: 'PID & Firmware',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'simulate',
      label: 'Simulate',
      subtitle: 'Flight Arena',
      icon: <Play className="w-4 h-4" />,
    },
    {
      id: 'measure',
      label: 'Measure',
      subtitle: 'DMM & Scope',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'experiment',
      label: 'Experiment',
      subtitle: 'A/B Scientific',
      icon: <FlaskConical className="w-4 h-4" />,
    },
  ];

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Product & Platform Identification */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-zinc-100 tracking-tight">Virtual Engineering Laboratory</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-medium">
              V2.0 Core
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span>Reference System:</span>
            <span className="text-zinc-300 font-medium">GEPRC Mark4 5" FPV Quadcopter</span>
          </div>
        </div>
      </div>

      {/* Center: The 6 Engineering Workflow Steps */}
      <nav className="flex items-center bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80">
        {workflowSteps.map((step, idx) => {
          const isActive = currentMode === step.id && !isBreadboardCAD;
          return (
            <button
              key={step.id}
              onClick={() => {
                labStore.setMode(step.id);
                if (isBreadboardCAD && onToggleBreadboardCAD) {
                  onToggleBreadboardCAD();
                }
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all relative ${
                isActive
                  ? 'bg-zinc-800 text-sky-400 font-semibold shadow-xs border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <div className={isActive ? 'text-sky-400' : 'text-zinc-400'}>{step.icon}</div>
              <div className="text-left">
                <div className="leading-tight">{step.label}</div>
                <div className="text-[9px] text-zinc-400 font-normal leading-none mt-0.5">{step.subtitle}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Right: Breadboard Sandbox Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleBreadboardCAD}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
            isBreadboardCAD
              ? 'bg-indigo-950 text-indigo-300 border-indigo-700 shadow-sm'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
          }`}
        >
          {isBreadboardCAD ? 'Return to Drone Lab' : 'Circuit Breadboard CAD'}
        </button>
      </div>
    </header>
  );
};
