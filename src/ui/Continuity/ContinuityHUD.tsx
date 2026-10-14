import React, { useMemo, useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
  Crosshair,
  Volume2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import {
  checkContinuity,
  continuityAudio,
  testPinContinuity,
} from '../../core/circuit/continuityChecker';

export const ContinuityHUD: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const [isExpanded, setIsExpanded] = useState(true);

  const report = useMemo(() => {
    return checkContinuity(projectState.components, projectState.connections);
  }, [projectState.components, projectState.connections]);

  const probePins = viewState.probeSelectedPins;
  const probeLead1 = probePins[0] || null;
  const probeLead2 = probePins[1] || null;

  const probeLead1Info = useMemo(() => {
    if (!probeLead1) return null;
    const comp = projectState.components.find((c) => c.id === probeLead1.componentId);
    const pin = comp?.pins?.find((p) => p.id === probeLead1.pinId);
    return {
      compName: comp?.name || 'Component',
      pinName: pin?.name || probeLead1.pinId,
    };
  }, [probeLead1, projectState.components]);

  const probeLead2Info = useMemo(() => {
    if (!probeLead2) return null;
    const comp = projectState.components.find((c) => c.id === probeLead2.componentId);
    const pin = comp?.pins?.find((p) => p.id === probeLead2.pinId);
    return {
      compName: comp?.name || 'Component',
      pinName: pin?.name || probeLead2.pinId,
    };
  }, [probeLead2, projectState.components]);

  if (!viewState.continuityMode) return null;

  const handleTestBeep = () => {
    continuityAudio.playContinuityBeep(260);
  };

  const handleClearProbes = () => {
    viewStore.clearProbe();
  };

  return (
    <div
      id="continuity-checker-panel"
      className="absolute top-14 left-4 z-20 max-w-sm w-88 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-xl overflow-hidden select-none transition-all duration-200"
    >
      {/* Top Header Bar */}
      <div
        className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
          report.hasShortCircuit
            ? 'bg-red-500/10 border-red-200 text-red-900'
            : report.hasBrokenPaths
            ? 'bg-amber-500/10 border-amber-200 text-amber-900'
            : 'bg-emerald-500/10 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2">
          {report.hasShortCircuit ? (
            <div className="w-6 h-6 rounded-md bg-red-600 text-white flex items-center justify-center shadow-2xs animate-pulse">
              <AlertOctagon size={14} className="stroke-[2.5]" />
            </div>
          ) : report.hasBrokenPaths ? (
            <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <AlertTriangle size={14} className="stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={14} className="stroke-[2.5]" />
            </div>
          )}
          <div>
            <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Continuity Checker</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold uppercase tracking-wider ${
                  report.hasShortCircuit
                    ? 'bg-red-200 text-red-800'
                    : report.hasBrokenPaths
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {report.hasShortCircuit
                  ? 'Short Circuit'
                  : report.hasBrokenPaths
                  ? 'Broken Path'
                  : 'All Sound'}
              </span>
            </div>
            <div className="text-[10.5px] opacity-80 leading-tight">
              {report.totalValid} valid connection{report.totalValid === 1 ? '' : 's'} highlighted in{' '}
              <span className="font-semibold text-emerald-700">green</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            onClick={() => viewStore.setContinuityMode(false)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            title="Close Continuity Checker"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 text-xs space-y-3 max-h-[75vh] overflow-y-auto">
          {/* Status Message / Diagnostics */}
          {report.hasShortCircuit ? (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 space-y-1.5">
              <div className="font-semibold text-red-800 flex items-center gap-1.5 text-[11.5px]">
                <AlertOctagon size={13} className="text-red-600 shrink-0" />
                Short Circuit Warning Detected
              </div>
              <p className="text-[11px] text-red-700 leading-snug">
                {report.diagnostics.find((d) => d.type === 'short-circuit')?.description ||
                  'Power line shorted to ground or both terminals of a component connected together.'}
              </p>
            </div>
          ) : report.hasBrokenPaths ? (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 space-y-1.5">
              <div className="font-semibold text-amber-800 flex items-center gap-1.5 text-[11.5px]">
                <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                Broken Electrical Path / Open Circuit
              </div>
              <p className="text-[11px] text-amber-700 leading-snug">
                {report.diagnostics.find((d) => d.type === 'broken-path')?.description ||
                  'A component terminal is dangling without complete circuit return loop.'}
              </p>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="font-semibold text-emerald-800 flex items-center gap-1.5 text-[11.5px]">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                Valid Closed Path Continuity
              </div>
              <p className="text-[11px] text-emerald-700 leading-snug">
                All connected conduits form sound electrical paths. Current loops and signal nets are verified continuous.
              </p>
            </div>
          )}

          {/* Interactive Multimeter Probe Mode */}
          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11.5px]">
                <Crosshair size={13} className="text-blue-600" />
                <span>Multimeter Continuity Probes</span>
              </div>
              <button
                onClick={() => viewStore.toggleProbeMode()}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
                  viewState.continuityProbeMode
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {viewState.continuityProbeMode ? 'Probing Active' : 'Start Probing'}
              </button>
            </div>

            <p className="text-[10.5px] text-slate-500 leading-tight">
              Click any two pins, leads, or breadboard tie-points in the 3D scene to test electrical continuity between them.
            </p>

            {/* Probe Leads Visualizer */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              {/* Lead 1 (Red probe) */}
              <div
                className={`p-2 rounded border flex flex-col gap-0.5 transition-colors ${
                  probeLead1
                    ? 'bg-red-50/80 border-red-300 text-red-900'
                    : 'bg-white border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  Lead 1 (Red +)
                </div>
                <div className="font-medium truncate">
                  {probeLead1Info
                    ? `${probeLead1Info.compName} · ${probeLead1Info.pinName}`
                    : 'Click a pin to probe'}
                </div>
              </div>

              {/* Lead 2 (Black probe) */}
              <div
                className={`p-2 rounded border flex flex-col gap-0.5 transition-colors ${
                  probeLead2
                    ? 'bg-slate-100 border-slate-400 text-slate-900'
                    : 'bg-white border-dashed border-slate-300 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                  Lead 2 (Black -)
                </div>
                <div className="font-medium truncate">
                  {probeLead2Info
                    ? `${probeLead2Info.compName} · ${probeLead2Info.pinName}`
                    : 'Click second pin'}
                </div>
              </div>
            </div>

            {/* Probe Result Box */}
            {viewState.probeResult && (
              <div
                className={`mt-2 p-2 rounded-lg border text-[11px] space-y-1 ${
                  viewState.probeResult.isShortCircuit
                    ? 'bg-red-100 border-red-300 text-red-900'
                    : viewState.probeResult.isContinuous
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    {viewState.probeResult.isContinuous ? (
                      <Volume2 size={13} className="text-emerald-700 animate-pulse" />
                    ) : (
                      <Info size={13} className="text-slate-500" />
                    )}
                    {viewState.probeResult.resistanceEstimate}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {viewState.probeResult.isShortCircuit
                      ? 'SHORT'
                      : viewState.probeResult.isContinuous
                      ? 'BEEP (CLOSED)'
                      : 'OPEN'}
                  </span>
                </div>
                <p className="text-[10.5px] leading-tight opacity-90">
                  {viewState.probeResult.message}
                </p>
              </div>
            )}

            {/* Probe action buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleTestBeep}
                className="text-[10.5px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium hover:underline"
              >
                <Volume2 size={12} />
                Test Buzzer Audio
              </button>
              {probePins.length > 0 && (
                <button
                  onClick={handleClearProbes}
                  className="text-[10.5px] text-red-600 hover:text-red-700 font-medium hover:underline flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  Clear Probes
                </button>
              )}
            </div>
          </div>

          {/* Quick Info Legend */}
          <div className="space-y-1 text-[10.5px] text-slate-500 pt-1 border-t border-slate-100">
            <div className="font-semibold text-slate-700 text-[11px] mb-1">Color Legend:</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span>
                <strong className="text-emerald-700 font-semibold">Green:</strong> Valid continuous electrical connection
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span>
                <strong className="text-red-700 font-semibold">Red:</strong> Short circuit / power loop hazard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <span>
                <strong className="text-amber-700 font-semibold">Amber:</strong> Broken path / open terminal
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
