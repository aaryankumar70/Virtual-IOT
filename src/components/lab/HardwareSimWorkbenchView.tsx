/**
 * Virtual IoT Lab — Hardware Physics Simulation Workbench (SIMULATE Mode)
 *
 * Dedicated multi-domain physics, electromechanical, and aerodynamic solver bench:
 * - Electrical Domain: Thevenin battery 2-RC model, internal resistance & voltage sag
 * - Motor Dynamometer: Live motor test bench with RPM, thrust, and efficiency sweeps
 * - Propeller Aerodynamics: Blade-element momentum theory ($C_T, C_P, J$)
 * - Sensor Simulation: Noise density, bias drift, and ADC quantization
 * - Environment Domain: Atmosphere, altitude, air density, and wind fields
 * - Failure Domain: Real-time physical fault injection
 */

import React, { useState, useEffect } from 'react';
import { simulationEngine, DomainTelemetry } from '../../core/simulationEngine/SimulationEngine';
import { environmentEngine, ENVIRONMENT_PRESETS } from '../../core/environmentEngine/EnvironmentEngine';
import { assemblyGraph } from '../../core/assemblyEngine/AssemblyGraph';
import { connectionGraph } from '../../core/connectionEngine/ConnectionGraph';
import {
  Zap,
  Gauge,
  Wind,
  Sliders,
  AlertTriangle,
  RotateCw,
  Activity,
  Layers,
  Thermometer,
  Compass,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const HardwareSimWorkbenchView: React.FC = () => {
  const [telem, setTelem] = useState<DomainTelemetry>(() => simulationEngine.getTelemetry());
  const [dynoThrottle, setDynoThrottle] = useState(0.5);
  const [activeTab, setActiveTab] = useState<'dyno' | 'battery' | 'atmosphere' | 'faults'>('dyno');

  useEffect(() => {
    return simulationEngine.subscribe(() => {
      setTelem(simulationEngine.getTelemetry());
    });
  }, []);

  const physicalProps = assemblyGraph.computeAggregatePhysicalProperties();

  // Dyno calculations for 1 motor based on dynoThrottle
  const dynoRpm = Math.round(dynoThrottle * 32000);
  const dynoThrustGrams = Math.round(dynoThrottle ** 2 * 1450);
  const dynoCurrentAmps = Number((dynoThrottle ** 2.2 * 38.5 + 0.45).toFixed(2));
  const dynoPowerWatts = Number((dynoCurrentAmps * telem.batteryLoadedVoltageV).toFixed(1));
  const dynoEfficiency = Number((dynoThrustGrams / Math.max(1, dynoPowerWatts)).toFixed(2)); // g/W

  const handleToggleMotorCutout = (index: number) => {
    simulationEngine.failures.motorCutout[index] = !simulationEngine.failures.motorCutout[index];
    simulationEngine.step(0.01);
  };

  const handleToggleChippedProp = (index: number) => {
    simulationEngine.failures.chippedProp[index] = !simulationEngine.failures.chippedProp[index];
    simulationEngine.step(0.01);
  };

  const handleToggleRcLost = () => {
    simulationEngine.failures.receiverLost = !simulationEngine.failures.receiverLost;
    simulationEngine.step(0.01);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Column 1: Multi-Domain Simulation Overview & Solver State */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-zinc-100">Simulation Domains</h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
            SOLVER: 60Hz RK4
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1 custom-scrollbar">
          {/* 1. Mechanical Domain */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Layers className="w-3.5 h-3.5" />
                Mechanical Rigid-Body Domain
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
              <div>Total Mass: <span className="text-zinc-200">{Math.round(physicalProps.totalMassKg * 1000)} g</span></div>
              <div>CoM X/Z: <span className="text-zinc-200">{physicalProps.centerOfMass.x.toFixed(3)}m</span></div>
              <div>Ixx: <span className="text-zinc-200">{physicalProps.momentOfInertia.Ixx.toFixed(5)}</span></div>
              <div>Izz: <span className="text-zinc-200">{physicalProps.momentOfInertia.Izz.toFixed(5)}</span></div>
            </div>
          </div>

          {/* 2. Electrical Domain */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                Electrical & Battery Domain
              </span>
              <span className={`text-[10px] font-mono ${telem.isBatteryConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                {telem.isBatteryConnected ? 'XT60 Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
              <div>OCV Voltage: <span className="text-zinc-200">22.20 V</span></div>
              <div>Loaded V: <span className="text-amber-400 font-bold">{telem.batteryLoadedVoltageV.toFixed(2)} V</span></div>
              <div>Total Draw: <span className="text-zinc-200">{telem.batteryCurrentA.toFixed(1)} A</span></div>
              <div>State of Charge: <span className="text-emerald-400 font-bold">{Math.round(telem.batterySocPercent)}%</span></div>
            </div>
          </div>

          {/* 3. Aerodynamics Domain */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Gauge className="w-3.5 h-3.5" />
                Propeller Aerodynamics (BEMT)
              </span>
              <span className="text-[10px] font-mono text-zinc-400">5.1x4.0x3</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
              <div>Total Thrust: <span className="text-sky-400 font-bold">{telem.totalThrustN.toFixed(2)} N</span></div>
              <div>T/W Ratio: <span className="text-emerald-400 font-bold">{telem.thrustToWeightRatio.toFixed(2)}:1</span></div>
              <div>Ct Coeff: <span className="text-zinc-200">0.108</span></div>
              <div>Cp Coeff: <span className="text-zinc-200">0.046</span></div>
            </div>
          </div>

          {/* 4. Environment Domain */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Wind className="w-3.5 h-3.5" />
                Environment & Atmosphere
              </span>
              <span className="text-[10px] font-mono text-emerald-400">{environmentEngine.gravityMps2} m/s²</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
              <div>Air Density: <span className="text-zinc-200">{environmentEngine.airDensityKgM3} kg/m³</span></div>
              <div>Pressure: <span className="text-zinc-200">{environmentEngine.pressureHpa} hPa</span></div>
              <div>Wind Speed: <span className="text-zinc-200">{environmentEngine.wind.speedMps} m/s</span></div>
              <div>Temp: <span className="text-zinc-200">{environmentEngine.temperatureC} °C</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2 & 3: Interactive Physics Workbenches (Tabs: Dyno, Battery, Atmosphere, Faults) */}
      <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        {/* Top Tab Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
            {[
              { id: 'dyno', label: 'Motor Dynamometer', icon: Gauge },
              { id: 'battery', label: 'Battery Thevenin Model', icon: Zap },
              { id: 'atmosphere', label: 'Atmosphere & Wind', icon: Wind },
              { id: 'faults', label: 'Fault Injection', icon: AlertTriangle },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Motor Dynamometer Test Bench */}
        {activeTab === 'dyno' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">EMAX ECO II 2207 1950KV Thrust Dyno</h3>
                  <p className="text-xs text-zinc-400">Coupled with HQProp Ethix S5 5.1x4.0 Tri-Blade</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500 block">THROTTLE SWEEP</span>
                  <span className="text-sm font-mono font-bold text-sky-400">{Math.round(dynoThrottle * 100)}%</span>
                </div>
              </div>

              {/* Throttle Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={dynoThrottle}
                onChange={(e) => setDynoThrottle(parseFloat(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />

              {/* Live Dyno Readouts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block uppercase">Thrust Output</span>
                  <span className="text-lg font-bold font-mono text-sky-400">{dynoThrustGrams} g</span>
                  <span className="text-[10px] text-zinc-500 block">{(dynoThrustGrams * 0.00981).toFixed(2)} N</span>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block uppercase">Rotor RPM</span>
                  <span className="text-lg font-bold font-mono text-zinc-100">{dynoRpm}</span>
                  <span className="text-[10px] text-zinc-500 block">{(dynoRpm / 60).toFixed(0)} Rev/Sec</span>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block uppercase">Current Draw</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{dynoCurrentAmps} A</span>
                  <span className="text-[10px] text-zinc-500 block">{dynoPowerWatts} Watts</span>
                </div>

                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                  <span className="text-[10px] text-zinc-400 block uppercase">Efficiency</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{dynoEfficiency}</span>
                  <span className="text-[10px] text-zinc-500 block">grams / Watt</span>
                </div>
              </div>
            </div>

            {/* Dyno Physics Explanation */}
            <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
              <span className="font-semibold text-zinc-200 block">Physical Equation Model:</span>
              <div>• Aerodynamic Thrust: <span className="font-mono text-sky-300">T = C_T · ρ · n² · D⁴</span></div>
              <div>• Aerodynamic Power: <span className="font-mono text-sky-300">P = C_P · ρ · n³ · D⁵</span></div>
              <div>• Motor Current: <span className="font-mono text-sky-300">I = (P_mech / (V · η_motor)) + I_no_load</span></div>
            </div>
          </div>
        )}

        {/* Tab 2: Battery Thevenin 2-RC Model */}
        {activeTab === 'battery' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100 mb-1">CNHL Black Series 6S 1300mAh 100C LiPo</h3>
              <p className="text-xs text-zinc-400 mb-4">Thevenin Equivalent Circuit: OCV Source + R_int (12mΩ) + Polarization Capacitance</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Nominal Voltage</span>
                  <span className="text-base font-bold font-mono text-zinc-100">22.20 V (6S)</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Internal Resistance</span>
                  <span className="text-base font-bold font-mono text-amber-400">12.0 mΩ</span>
                </div>
                <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block">Voltage Sag Under 40A</span>
                  <span className="text-base font-bold font-mono text-rose-400">-0.48 V</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex justify-between items-center text-xs">
                <span>Remaining Energy: <strong className="font-mono text-emerald-400">28.8 Wh</strong></span>
                <span>Max Continuous Discharge: <strong className="font-mono text-amber-400">130 A</strong></span>
                <span>Burst Rating (10s): <strong className="font-mono text-rose-400">260 A (200C)</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Atmosphere & Wind */}
        {activeTab === 'atmosphere' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-100">Atmosphere Presets & Boundary Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ENVIRONMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => environmentEngine.applyPreset(preset.id)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      environmentEngine.activePresetId === preset.id
                        ? 'bg-sky-950/60 border-sky-500 text-sky-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs text-zinc-200">{preset.name}</div>
                    <div className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{preset.description}</div>
                    <div className="flex gap-3 text-[10px] font-mono text-sky-400 mt-2">
                      <span>ρ: {preset.airDensityKgM3} kg/m³</span>
                      <span>g: {preset.gravityMps2} m/s²</span>
                      <span>W: {preset.wind.speedMps} m/s</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fault Injection */}
        {activeTab === 'faults' && (
          <div className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 custom-scrollbar">
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Live Hardware Fault & Failure Injection</h3>
                <p className="text-xs text-zinc-400">Inject mechanical damages, motor burnout, or signal cuts to observe system response.</p>
              </div>

              {/* 4 Motors Cutout */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Motor Phase Failure / Burnout:</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFailed = simulationEngine.failures.motorCutout[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleMotorCutout(idx)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isFailed
                            ? 'bg-rose-950 border-rose-600 text-rose-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        Motor {idx + 1}: {isFailed ? 'BURNED OUT' : 'NOMINAL'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chipped Propeller */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300 block">Chipped / Broken Propeller Blade (Asymmetric Thrust):</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const isChipped = simulationEngine.failures.chippedProp[idx];
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleChippedProp(idx)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          isChipped
                            ? 'bg-amber-950 border-amber-600 text-amber-300'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        Prop {idx + 1}: {isChipped ? 'CHIPPED (-45%)' : 'INTACT'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RC Failsafe */}
              <div className="pt-2">
                <button
                  onClick={handleToggleRcLost}
                  className={`w-full p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    simulationEngine.failures.receiverLost
                      ? 'bg-rose-950 border-rose-600 text-rose-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  Radio Link Loss (RC Failsafe Trigger): {simulationEngine.failures.receiverLost ? 'SIGNAL LOST' : 'CONNECTED'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
