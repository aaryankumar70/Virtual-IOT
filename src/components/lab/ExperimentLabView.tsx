/**
 * Virtual IoT Lab — Scientific Experimentation Suite
 *
 * Provides a real experimental protocol for engineering students:
 * - Curated research questions & physical hypotheses
 * - Baseline Trial vs Modified Hardware Trial data logging
 * - Automated delta calculation matrix (RPM, Amps, Watts, AUW, Flight Time)
 * - Hypothesis validation and physical conclusion generation
 */

import React, { useState, useEffect } from 'react';
import {
  experimentEngine,
  CURATED_EXPERIMENTS,
  ExperimentMetricSample,
} from '../../core/experimentEngine/ExperimentEngine';
import {
  FlaskConical,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  BookOpen,
  HelpCircle,
  FileText,
  Target,
} from 'lucide-react';

export const ExperimentLabView: React.FC = () => {
  const [, setTick] = useState(0);
  const [studentNotes, setStudentNotes] = useState(experimentEngine.studentNotes);

  useEffect(() => {
    return experimentEngine.subscribe(() => setTick((t) => t + 1));
  }, []);

  const activeExp = experimentEngine.activeExperiment;
  const baseline = experimentEngine.baselineRun;
  const modified = experimentEngine.modifiedRun;
  const comparison = experimentEngine.computeComparison();

  const handleSelectExp = (id: string) => {
    experimentEngine.selectExperiment(id);
    setStudentNotes('');
  };

  const handleCapture = (type: 'baseline' | 'modified') => {
    experimentEngine.captureTrial(type);
  };

  const handleReset = () => {
    experimentEngine.clearTrials();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Column 1: Experiment Protocol & Curriculum Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-zinc-100">Lab Experiments</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Trials
          </button>
        </div>

        {/* Experiment Selector List */}
        <div className="space-y-2 my-3">
          {CURATED_EXPERIMENTS.map((exp) => (
            <button
              key={exp.id}
              onClick={() => handleSelectExp(exp.id)}
              className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                activeExp.id === exp.id
                  ? 'bg-indigo-950/60 border-indigo-500 text-zinc-100'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-xs font-semibold">{exp.title}</div>
              <div className="text-[11px] text-zinc-400 truncate mt-0.5">{exp.objective}</div>
            </button>
          ))}
        </div>

        {/* Experiment Protocol Details */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-2 pr-1 custom-scrollbar text-xs">
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
              <Target className="w-3.5 h-3.5" />
              Scientific Objective
            </div>
            <p className="text-zinc-300 leading-relaxed text-[11px]">{activeExp.objective}</p>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Physical Hypothesis
            </div>
            <p className="text-zinc-300 leading-relaxed text-[11px]">{activeExp.hypothesis}</p>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-zinc-400 font-semibold mb-1">Independent Variable:</div>
            <p className="text-sky-300 font-medium text-[11px]">{activeExp.independentVariable}</p>

            <div className="text-zinc-400 font-semibold mt-2 mb-1">Dependent Measured Variables:</div>
            <ul className="list-disc list-inside text-zinc-300 space-y-0.5 text-[11px]">
              {activeExp.dependentVariables.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Recommended Procedure
            </div>
            <div className="space-y-1 text-zinc-300 text-[11px]">
              {activeExp.setupProcedure.map((step, i) => (
                <div key={i}>{step}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Data Acquisition Bench (Trial 1 vs Trial 2) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <FlaskConical className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-semibold text-zinc-100">Trial Data Acquisition</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {/* Trial 1: Baseline Card */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-400">TRIAL 1: BASELINE SETUP</span>
              <button
                onClick={() => handleCapture('baseline')}
                className="text-xs px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium shadow-sm transition-colors"
              >
                {baseline ? 'Re-Capture Baseline' : 'Capture Baseline'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">Reference: {activeExp.suggestedBaseline}</p>

            {baseline ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Avg Motor RPM</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{baseline.metrics.rpmAverage} RPM</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Current Draw</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{baseline.metrics.currentDrawA} A</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Power Consumption</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{baseline.metrics.powerWatts} W</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">T/W Ratio & Mass</div>
                  <div className="text-zinc-100 font-bold mt-0.5">
                    {baseline.metrics.thrustToWeightRatio}x ({baseline.metrics.auwMassGrams}g)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-900/50 rounded border border-dashed border-zinc-800 text-center text-zinc-400 text-xs">
                No baseline trial recorded yet. Hover the drone and click "Capture Baseline".
              </div>
            )}
          </div>

          {/* Trial 2: Modified Setup Card */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-400">TRIAL 2: MODIFIED HARDWARE SETUP</span>
              <button
                onClick={() => handleCapture('modified')}
                className="text-xs px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow-sm transition-colors"
              >
                {modified ? 'Re-Capture Modified' : 'Capture Modified'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">Modification: {activeExp.suggestedModified}</p>

            {modified ? (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Avg Motor RPM</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{modified.metrics.rpmAverage} RPM</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Current Draw</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{modified.metrics.currentDrawA} A</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">Power Consumption</div>
                  <div className="text-zinc-100 font-bold mt-0.5">{modified.metrics.powerWatts} W</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
                  <div className="text-[10px] text-zinc-400 font-sans">T/W Ratio & Mass</div>
                  <div className="text-zinc-100 font-bold mt-0.5">
                    {modified.metrics.thrustToWeightRatio}x ({modified.metrics.auwMassGrams}g)
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-900/50 rounded border border-dashed border-zinc-800 text-center text-zinc-400 text-xs">
                Modify the drone hardware in BUILD mode, re-hover, and click "Capture Modified".
              </div>
            )}
          </div>

          {/* Student Lab Notebook */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Student Laboratory Observations & Notes
            </div>
            <textarea
              value={studentNotes}
              onChange={(e) => {
                setStudentNotes(e.target.value);
                experimentEngine.studentNotes = e.target.value;
              }}
              placeholder="Record observations, physical mechanisms, and unexpected aerodynamic behavior here..."
              className="w-full h-20 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Column 3: Automated Delta Analysis & Scientific Validation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-zinc-100">Comparative Delta Matrix</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {comparison ? (
            <>
              {/* Delta Statistics Table */}
              <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2.5">
                <div className="text-xs text-zinc-400 font-medium">Parametric Shift (Modified vs Baseline)</div>

                {/* Motor RPM Delta */}
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Δ Motor RPM:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      comparison.deltaRpm.abs > 0 ? 'text-amber-400' : 'text-sky-400'
                    }`}
                  >
                    {comparison.deltaRpm.abs > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {comparison.deltaRpm.abs > 0 ? `+${comparison.deltaRpm.abs}` : comparison.deltaRpm.abs} RPM (
                    {comparison.deltaRpm.pct}%)
                  </span>
                </div>

                {/* Current Draw Delta */}
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Δ Electrical Current:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      comparison.deltaCurrent.abs > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {comparison.deltaCurrent.abs > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    {comparison.deltaCurrent.abs > 0
                      ? `+${comparison.deltaCurrent.abs}`
                      : comparison.deltaCurrent.abs}{' '}
                    A ({comparison.deltaCurrent.pct}%)
                  </span>
                </div>

                {/* Power Delta */}
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Δ Electrical Power:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      comparison.deltaPower.abs > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {comparison.deltaPower.abs > 0 ? `+${comparison.deltaPower.abs}` : comparison.deltaPower.abs} W (
                    {comparison.deltaPower.pct}%)
                  </span>
                </div>

                {/* Flight Time Delta */}
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Δ Est. Hover Endurance:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      comparison.deltaFlightTime.abs >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {comparison.deltaFlightTime.abs > 0
                      ? `+${comparison.deltaFlightTime.abs}`
                      : comparison.deltaFlightTime.abs}{' '}
                    minutes
                  </span>
                </div>

                {/* Mass Delta */}
                <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Δ All-Up Weight:</span>
                  <span className="font-mono font-bold text-zinc-200">
                    {comparison.deltaMass.abs > 0 ? `+${comparison.deltaMass.abs}` : comparison.deltaMass.abs} grams
                  </span>
                </div>
              </div>

              {/* Physical Conclusion Card */}
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/60 rounded-lg">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Hypothesis Validation & Physical Finding
                </div>
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  The comparative empirical findings corroborate aerodynamic momentum disk theory:{' '}
                  {comparison.deltaPower.abs > 0
                    ? `The modified hardware required a net +${comparison.deltaPower.pct}% power increase (${comparison.deltaPower.abs}W), demonstrating increased aerodynamic drag and shortening endurance by ${Math.abs(comparison.deltaFlightTime.abs)} minutes.`
                    : `The modified hardware optimized electrical efficiency, reducing current consumption by ${Math.abs(comparison.deltaCurrent.pct)}% and extending hover time.`}
                </p>
              </div>
            </>
          ) : (
            <div className="p-8 bg-zinc-950 rounded-lg border border-zinc-800 text-center text-zinc-400 text-xs">
              <TrendingUp className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              Capture both Trial 1 (Baseline) and Trial 2 (Modified) to generate automated scientific delta metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
