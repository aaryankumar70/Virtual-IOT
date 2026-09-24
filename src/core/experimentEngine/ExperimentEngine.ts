/**
 * Virtual IoT Lab — Experiment Engine
 *
 * First-class scientific experiment framework for engineering education.
 * Supports baseline vs modified trials, hypothesis validation, metric logging,
 * and automated statistical delta analysis.
 */

import { simulationEngine } from '../simulationEngine/SimulationEngine';
import { assemblyGraph } from '../assemblyEngine/AssemblyGraph';
import { connectionGraph } from '../connectionEngine/ConnectionGraph';

export interface ExperimentMetricSample {
  rpmAverage: number;
  currentDrawA: number;
  loadedVoltageV: number;
  powerWatts: number;
  thrustN: number;
  hoverThrottlePercent: number;
  thrustToWeightRatio: number;
  auwMassGrams: number;
  estimatedFlightTimeMin: number;
}

export interface ExperimentRun {
  id: string;
  label: string;
  timestamp: string;
  notes: string;
  metrics: ExperimentMetricSample;
}

export interface LabExperimentDefinition {
  id: string;
  title: string;
  objective: string;
  hypothesis: string;
  independentVariable: string;
  dependentVariables: string[];
  setupProcedure: string[];
  suggestedBaseline: string;
  suggestedModified: string;
}

export const CURATED_EXPERIMENTS: LabExperimentDefinition[] = [
  {
    id: 'exp_prop_pitch',
    title: 'Effect of Propeller Pitch on Hover Efficiency',
    objective: 'Investigate how propeller blade pitch affects motor electrical current draw, RPM, and hover endurance at steady altitude.',
    hypothesis: 'Higher propeller pitch will produce required hover thrust at lower RPM, but will incur higher aerodynamic profile drag and increase current draw, shortening battery hover endurance.',
    independentVariable: 'Propeller Pitch (4.0" vs 3.0" vs 4.8")',
    dependentVariables: ['Motor Hover RPM', 'Total Electrical Current (A)', 'Power Dissipation (W)', 'Hover Flight Time (min)'],
    setupProcedure: [
      '1. Arm drone in Angle flight mode and set throttle to hover (~38%).',
      '2. Record Baseline Trial measurements once altitude settles.',
      '3. In BUILD mode, modify the propellers or change propeller blade count.',
      '4. Re-hover and record the Modified Trial measurements.',
      '5. Compare deltas in hover RPM and electrical power consumption.',
    ],
    suggestedBaseline: 'Standard HQProp Ethix S5 5.0x4.0x3 Props',
    suggestedModified: 'High-Pitch 5.0x4.8x3 or Low-Pitch 5.0x3.0x3 Props',
  },
  {
    id: 'exp_battery_sag',
    title: 'Battery Internal Resistance & High-Throttle Sag',
    objective: 'Quantify internal resistance voltage drop across the LiPo pack during maximum 100% full-throttle punchouts.',
    hypothesis: 'Under maximum motor load (~90A), internal resistance creates immediate Ohm-law voltage sag (V = OCV - I*R), reducing peak available motor RPM.',
    independentVariable: 'Discharge Current Load (Hover ~12A vs Full Throttle ~85A)',
    dependentVariables: ['Battery Terminal Voltage (V)', 'Voltage Sag Delta (V)', 'Peak Motor RPM', 'Current Draw (A)'],
    setupProcedure: [
      '1. Record baseline voltage at idle/hover.',
      '2. Punch throttle to 100% full climb for 3 seconds.',
      '3. Record modified punchout voltage on Multimeter or Oscilloscope.',
      '4. Calculate effective pack internal resistance R_int = deltaV / deltaI.',
    ],
    suggestedBaseline: 'Hover Load (~12A)',
    suggestedModified: 'Full-Throttle Burst (~85A)',
  },
  {
    id: 'exp_motor_loss',
    title: 'Asymmetric Thrust Dynamics from Motor 2 Removal',
    objective: 'Demonstrate physical and aerodynamic response when an arm loses thrust due to physical motor removal or electrical cutout.',
    hypothesis: 'Quadcopter flight requires balanced 4-quadrant torque and thrust. Removing Motor 2 creates uncompensatable roll/pitch moments, causing immediate roll departure and attitude loss.',
    independentVariable: 'Motor 2 State (Mounted & Connected vs Physically Unmounted)',
    dependentVariables: ['Roll Angular Velocity (deg/s)', 'Pitch Angle Divergence', 'Attitude Stability Index', 'Total Thrust (N)'],
    setupProcedure: [
      '1. Stabilize quadcopter in hover.',
      '2. In BUILD mode, click "Unmount" on Motor 2 (or inject motor cutout fault).',
      '3. Observe physical attitude departure in the 3D Flight Scene.',
      '4. Record telemetry and compare dynamic stability vs baseline.',
    ],
    suggestedBaseline: 'All 4 Motors Operating Normally',
    suggestedModified: 'Motor 2 Unmounted / Disconnected',
  },
  {
    id: 'exp_payload_mass',
    title: 'Payload Mass vs Thrust-to-Weight Ratio & Flight Time',
    objective: 'Evaluate the degradation in thrust-to-weight ratio and climb rate as payload (camera, sensors) is added to the airframe.',
    hypothesis: 'Adding mass shifts center of gravity and increases required hover thrust linearly, forcing motors to spin faster at hover and drastically reducing flight time.',
    independentVariable: 'Additional Payload Mass (0g vs 150g GoPro vs 300g LiDAR)',
    dependentVariables: ['All-Up Weight (g)', 'Thrust-to-Weight Ratio (x)', 'Hover Throttle %', 'Estimated Flight Time (min)'],
    setupProcedure: [
      '1. Record baseline weight and T/W ratio with empty frame.',
      '2. In BUILD mode, mount optional camera / payload accessories.',
      '3. Record modified weight, required hover throttle, and endurance.',
      '4. Analyze payload sensitivity curve.',
    ],
    suggestedBaseline: 'Acro Drone Baseline (0g Extra Payload, AUW ~430g)',
    suggestedModified: 'Heavy Payload Mounted (+150g or +300g)',
  },
];

export class ExperimentEngine {
  public activeExperiment: LabExperimentDefinition = CURATED_EXPERIMENTS[0];
  public baselineRun: ExperimentRun | null = null;
  public modifiedRun: ExperimentRun | null = null;
  public studentNotes: string = '';

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public selectExperiment(experimentId: string) {
    const found = CURATED_EXPERIMENTS.find((e) => e.id === experimentId);
    if (found) {
      this.activeExperiment = found;
      this.baselineRun = null;
      this.modifiedRun = null;
      this.studentNotes = '';
      this.notify();
    }
  }

  /**
   * Capture a live experiment snapshot trial
   */
  public captureTrial(type: 'baseline' | 'modified', customLabel?: string) {
    const telem = simulationEngine.getTelemetry();
    const props = assemblyGraph.computeAggregatePhysicalProperties();

    const activeRpm = telem.motorRpm.filter((r) => r > 100);
    const avgRpm = activeRpm.length > 0 ? activeRpm.reduce((a, b) => a + b, 0) / activeRpm.length : 0;
    const powerW = telem.batteryLoadedVoltageV * telem.batteryCurrentA;
    const estHoverMin = telem.batteryCurrentA > 1 ? Number(((1.1 * 60) / telem.batteryCurrentA).toFixed(1)) : 12;

    const metrics: ExperimentMetricSample = {
      rpmAverage: Math.round(avgRpm),
      currentDrawA: Number(telem.batteryCurrentA.toFixed(2)),
      loadedVoltageV: Number(telem.batteryLoadedVoltageV.toFixed(2)),
      powerWatts: Number(powerW.toFixed(1)),
      thrustN: Number(telem.totalThrustN.toFixed(2)),
      hoverThrottlePercent: Math.round(simulationEngine.inputs.throttle * 100),
      thrustToWeightRatio: telem.thrustToWeightRatio,
      auwMassGrams: Math.round(props.totalMassKg * 1000),
      estimatedFlightTimeMin: estHoverMin,
    };

    const run: ExperimentRun = {
      id: `run_${type}_${Date.now()}`,
      label: customLabel || (type === 'baseline' ? 'Trial 1: Baseline' : 'Trial 2: Modified Setup'),
      timestamp: new Date().toLocaleTimeString(),
      notes: '',
      metrics,
    };

    if (type === 'baseline') {
      this.baselineRun = run;
    } else {
      this.modifiedRun = run;
    }

    this.notify();
  }

  public clearTrials() {
    this.baselineRun = null;
    this.modifiedRun = null;
    this.notify();
  }

  /**
   * Compute comparative deltas between baseline and modified trials
   */
  public computeComparison() {
    if (!this.baselineRun || !this.modifiedRun) return null;

    const b = this.baselineRun.metrics;
    const m = this.modifiedRun.metrics;

    const deltaRpm = m.rpmAverage - b.rpmAverage;
    const deltaRpmPct = b.rpmAverage > 0 ? (deltaRpm / b.rpmAverage) * 100 : 0;

    const deltaCurrent = m.currentDrawA - b.currentDrawA;
    const deltaCurrentPct = b.currentDrawA > 0 ? (deltaCurrent / b.currentDrawA) * 100 : 0;

    const deltaPower = m.powerWatts - b.powerWatts;
    const deltaPowerPct = b.powerWatts > 0 ? (deltaPower / b.powerWatts) * 100 : 0;

    const deltaThrust = m.thrustN - b.thrustN;
    const deltaMass = m.auwMassGrams - b.auwMassGrams;
    const deltaTwRatio = m.thrustToWeightRatio - b.thrustToWeightRatio;
    const deltaFlightTime = m.estimatedFlightTimeMin - b.estimatedFlightTimeMin;

    return {
      deltaRpm: { abs: deltaRpm, pct: Number(deltaRpmPct.toFixed(1)) },
      deltaCurrent: { abs: Number(deltaCurrent.toFixed(2)), pct: Number(deltaCurrentPct.toFixed(1)) },
      deltaPower: { abs: Number(deltaPower.toFixed(1)), pct: Number(deltaPowerPct.toFixed(1)) },
      deltaThrust: { abs: Number(deltaThrust.toFixed(2)) },
      deltaMass: { abs: deltaMass },
      deltaTwRatio: { abs: Number(deltaTwRatio.toFixed(2)) },
      deltaFlightTime: { abs: Number(deltaFlightTime.toFixed(1)) },
    };
  }
}

export const experimentEngine = new ExperimentEngine();
