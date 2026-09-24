import { useSyncExternalStore } from 'react';
import {
  DroneConfiguration,
  EnvironmentSettings,
  FailureModes,
  FlightControlInputs,
  FlightTelemetry,
  FlightTelemetryRecordPoint,
} from './droneTypes';
import {
  DEFAULT_DRONE_CONFIG,
  DRONE_MOTORS_CATALOG,
  DRONE_PROPELLERS_CATALOG,
  DRONE_BATTERIES_CATALOG,
} from './droneCatalog';
import { DronePhysicsEngine } from './DronePhysicsEngine';

export type DroneCameraMode = 'chase' | 'third_person' | 'fpv' | 'free' | 'engineering';
export type DroneSubsystemTab = 'hierarchy' | 'hardware' | 'failures' | 'environment' | 'experiment';

export interface SavedExperiment {
  id: string;
  name: string;
  date: string;
  config: DroneConfiguration;
  peakRpm: number;
  maxThrustN: number;
  maxCurrentA: number;
  thrustToWeightRatio: number;
  estimatedHoverTimeMin: number;
  totalMassKg: number;
}

export interface DroneSimulationState {
  isActive: boolean; // In Flight Sim Mode vs Electronics Workbench
  selectedSubsystemTab: DroneSubsystemTab;
  cameraMode: DroneCameraMode;
  showEngineeringOverlay: boolean;
  activeEnvironment: EnvironmentSettings;
  config: DroneConfiguration;
  controlInputs: FlightControlInputs;
  failures: FailureModes;
  telemetry: FlightTelemetry;
  selectedComponentPart: string | null; // e.g. 'motor_1', 'prop_1', 'battery', etc.
  isRecording: boolean;
  recordingHistory: FlightTelemetryRecordPoint[];
  savedExperiments: SavedExperiment[];
  comparisonConfig: DroneConfiguration | null;
}

const DEFAULT_ENVIRONMENT: EnvironmentSettings = {
  id: 'field',
  name: 'Open Airfield',
  gravityMps2: 9.80665,
  airDensityKgM3: 1.225,
  windSpeedMps: 0.0,
  windDirectionDeg: 0,
  windGustIntensity: 0.0,
  bounds: {
    minX: -60,
    maxX: 60,
    minZ: -60,
    maxZ: 60,
    maxY: 45,
  },
};

const DEFAULT_FAILURES: FailureModes = {
  motorFailure: [false, false, false, false],
  propellerDamage: [false, false, false, false],
  gpsFailure: false,
  receiverSignalLoss: false,
  batteryOverheatOrSag: false,
};

const DEFAULT_CONTROLS: FlightControlInputs = {
  throttle: 0.0,
  roll: 0.0,
  pitch: 0.0,
  yaw: 0.0,
  armSwitch: false,
};

// Internal engine singleton
const physicsEngine = new DronePhysicsEngine();

let state: DroneSimulationState = {
  isActive: false,
  selectedSubsystemTab: 'hierarchy',
  cameraMode: 'chase',
  showEngineeringOverlay: true,
  activeEnvironment: DEFAULT_ENVIRONMENT,
  config: DEFAULT_DRONE_CONFIG,
  controlInputs: DEFAULT_CONTROLS,
  failures: DEFAULT_FAILURES,
  telemetry: physicsEngine.step(
    0.016,
    DEFAULT_CONTROLS,
    DEFAULT_DRONE_CONFIG,
    DEFAULT_ENVIRONMENT,
    DEFAULT_FAILURES
  ),
  selectedComponentPart: null,
  isRecording: false,
  recordingHistory: [],
  savedExperiments: [
    {
      id: 'exp_stock_4s',
      name: 'Stock Mark4 (4S 1500mAh + 5043 Props)',
      date: 'Baseline',
      config: DEFAULT_DRONE_CONFIG,
      peakRpm: 34200,
      maxThrustN: 54.2,
      maxCurrentA: 142.0,
      thrustToWeightRatio: 8.52,
      estimatedHoverTimeMin: 7.2,
      totalMassKg: 0.648,
    },
  ],
  comparisonConfig: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const droneSimStore = {
  getState(): DroneSimulationState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getPhysicsEngine() {
    return physicsEngine;
  },

  enterDroneSim() {
    physicsEngine.resetState(0.08);
    state = {
      ...state,
      isActive: true,
      controlInputs: { ...DEFAULT_CONTROLS },
    };
    notify();
  },

  exitDroneSim() {
    state = {
      ...state,
      isActive: false,
      controlInputs: { ...DEFAULT_CONTROLS, armSwitch: false },
    };
    notify();
  },

  setCameraMode(mode: DroneCameraMode) {
    state = { ...state, cameraMode: mode };
    notify();
  },

  setSubsystemTab(tab: DroneSubsystemTab) {
    state = { ...state, selectedSubsystemTab: tab };
    notify();
  },

  toggleEngineeringOverlay() {
    state = { ...state, showEngineeringOverlay: !state.showEngineeringOverlay };
    notify();
  },

  selectComponentPart(partId: string | null) {
    state = { ...state, selectedComponentPart: partId };
    notify();
  },

  setControlInputs(partial: Partial<FlightControlInputs>) {
    state = {
      ...state,
      controlInputs: {
        ...state.controlInputs,
        ...partial,
      },
    };
    notify();
  },

  toggleArmed() {
    const nextArmed = !state.controlInputs.armSwitch;
    state = {
      ...state,
      controlInputs: {
        ...state.controlInputs,
        armSwitch: nextArmed,
      },
    };
    notify();
  },

  resetFlightPosition() {
    physicsEngine.resetState(0.08);
    state = {
      ...state,
      controlInputs: {
        ...state.controlInputs,
        throttle: 0,
        roll: 0,
        pitch: 0,
        yaw: 0,
      },
    };
    notify();
  },

  // HARDWARE REPLACEMENTS
  replaceMotor(motorIndex: number, motorSpecId: string) {
    const spec = DRONE_MOTORS_CATALOG.find((m) => m.id === motorSpecId);
    if (!spec) return;

    const newMotors = [...state.config.motors] as [any, any, any, any];
    newMotors[motorIndex] = spec;

    state = {
      ...state,
      config: {
        ...state.config,
        motors: newMotors,
      },
    };
    notify();
  },

  replaceAllMotors(motorSpecId: string) {
    const spec = DRONE_MOTORS_CATALOG.find((m) => m.id === motorSpecId);
    if (!spec) return;

    state = {
      ...state,
      config: {
        ...state.config,
        motors: [spec, spec, spec, spec],
      },
    };
    notify();
  },

  replacePropeller(propIndex: number, propSpecId: string) {
    const spec = DRONE_PROPELLERS_CATALOG.find((p) => p.id === propSpecId);
    if (!spec) return;

    const newProps = [...state.config.propellers] as [any, any, any, any];
    newProps[propIndex] = spec;

    state = {
      ...state,
      config: {
        ...state.config,
        propellers: newProps,
      },
    };
    notify();
  },

  replaceAllPropellers(propSpecId: string) {
    const spec = DRONE_PROPELLERS_CATALOG.find((p) => p.id === propSpecId);
    if (!spec) return;

    state = {
      ...state,
      config: {
        ...state.config,
        propellers: [spec, spec, spec, spec],
      },
    };
    notify();
  },

  replaceBattery(batterySpecId: string) {
    const spec = DRONE_BATTERIES_CATALOG.find((b) => b.id === batterySpecId);
    if (!spec) return;

    state = {
      ...state,
      config: {
        ...state.config,
        battery: spec,
      },
    };
    notify();
  },

  applyConfiguration(newConfig: DroneConfiguration) {
    state = {
      ...state,
      config: JSON.parse(JSON.stringify(newConfig)),
    };
    notify();
  },

  // ENVIRONMENT & FAILURES
  setEnvironment(env: Partial<EnvironmentSettings>) {
    state = {
      ...state,
      activeEnvironment: {
        ...state.activeEnvironment,
        ...env,
      },
    };
    notify();
  },

  setEnvironmentType(type: 'field' | 'hangar' | 'obstacles' | 'terrain') {
    let newEnv = { ...state.activeEnvironment, id: type };
    if (type === 'field') {
      newEnv.name = 'Open Airfield';
      newEnv.windSpeedMps = 0;
    } else if (type === 'hangar') {
      newEnv.name = 'Indoor Flight Hangar';
      newEnv.windSpeedMps = 0;
      newEnv.bounds = { minX: -20, maxX: 20, minZ: -20, maxZ: 20, maxY: 14 };
    } else if (type === 'obstacles') {
      newEnv.name = 'Obstacle Slalom Arena';
      newEnv.windSpeedMps = 3.5;
    } else if (type === 'terrain') {
      newEnv.name = 'Rolling Hillside Terrain';
      newEnv.windSpeedMps = 6.0;
    }
    state = { ...state, activeEnvironment: newEnv };
    notify();
  },

  setFailureMode(partial: Partial<FailureModes>) {
    state = {
      ...state,
      failures: {
        ...state.failures,
        ...partial,
      },
    };
    notify();
  },

  toggleMotorFailure(index: number) {
    const arr = [...state.failures.motorFailure] as [boolean, boolean, boolean, boolean];
    arr[index] = !arr[index];
    state = {
      ...state,
      failures: {
        ...state.failures,
        motorFailure: arr,
      },
    };
    notify();
  },

  togglePropellerDamage(index: number) {
    const arr = [...state.failures.propellerDamage] as [boolean, boolean, boolean, boolean];
    arr[index] = !arr[index];
    state = {
      ...state,
      failures: {
        ...state.failures,
        propellerDamage: arr,
      },
    };
    notify();
  },

  // RECORDING & EXPERIMENTS
  toggleRecording() {
    const nextRec = !state.isRecording;
    state = {
      ...state,
      isRecording: nextRec,
      recordingHistory: nextRec ? [] : state.recordingHistory,
    };
    notify();
  },

  saveCurrentAsExperiment(customName?: string) {
    const t = state.telemetry;
    const exp: SavedExperiment = {
      id: `exp_${Date.now()}`,
      name:
        customName ||
        `${state.config.motors[0].name.split(' ')[0]} + ${state.config.propellers[0].diameterInches}x${state.config.propellers[0].pitchInches} + ${state.config.battery.cellCount}S`,
      date: new Date().toLocaleTimeString(),
      config: JSON.parse(JSON.stringify(state.config)),
      peakRpm: Math.max(...t.motorRpm),
      maxThrustN: Number((t.totalThrustN).toFixed(1)),
      maxCurrentA: Number(t.totalCurrentA.toFixed(1)),
      thrustToWeightRatio: t.thrustToWeightRatio,
      estimatedHoverTimeMin: t.estimatedFlightTimeRemainingMin,
      totalMassKg: t.totalMassKg,
    };

    state = {
      ...state,
      savedExperiments: [exp, ...state.savedExperiments],
      comparisonConfig: state.comparisonConfig || exp.config,
    };
    notify();
  },

  setComparisonConfig(config: DroneConfiguration | null) {
    state = {
      ...state,
      comparisonConfig: config,
    };
    notify();
  },

  // Simulation Update Loop Step
  updateSimulation(dt: number) {
    if (!state.isActive) return;

    const telem = physicsEngine.step(
      dt,
      state.controlInputs,
      state.config,
      state.activeEnvironment,
      state.failures
    );

    // Record if enabled
    let nextHistory = state.recordingHistory;
    if (state.isRecording) {
      nextHistory = [
        ...state.recordingHistory,
        {
          timeSec: Number(physicsEngine.simTimeSec.toFixed(2)),
          altitude: telem.altitudeM,
          speed: telem.speedMps,
          totalThrustN: telem.totalThrustN,
          batteryVoltage: telem.batteryVoltageV,
          currentA: telem.batteryCurrentA,
          motorRpm: telem.motorRpm,
          rollDeg: telem.rotationEulerDeg.roll,
          pitchDeg: telem.rotationEulerDeg.pitch,
          yawDeg: telem.rotationEulerDeg.yaw,
          throttleInput: state.controlInputs.throttle,
        },
      ];
      // Keep within 500 samples
      if (nextHistory.length > 500) {
        nextHistory = nextHistory.slice(-500);
      }
    }

    state = {
      ...state,
      telemetry: telem,
      recordingHistory: nextHistory,
    };
    notify();
  },
};

export function useDroneSim(): DroneSimulationState {
  return useSyncExternalStore(droneSimStore.subscribe, droneSimStore.getState);
}
