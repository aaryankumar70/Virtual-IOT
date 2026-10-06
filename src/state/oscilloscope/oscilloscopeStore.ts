import { useSyncExternalStore } from 'react';
import {
  OscilloscopeState,
  ChannelSettings,
  HorizontalSettings,
  TriggerSettings,
  CouplingMode,
  SignalWaveformType,
} from '../../core/oscilloscope/oscilloscopeTypes';
import { OscilloscopeSignalEngine } from '../../core/oscilloscope/OscilloscopeSignalEngine';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { Connection } from '../../core/connections/Connection';

const initialCH1: ChannelSettings = {
  enabled: true,
  voltsPerDiv: 1.0, // 1V / div
  offsetY: 0.0,
  coupling: 'dc',
  probeAttenuation: 1,
  color: '#facc15', // Electric bright yellow (authentic CH1)
  label: 'CH1',
  generatorMode: 'auto',
  generatorFrequency: 1000,
  generatorAmplitude: 5.0,
  generatorDutyCycle: 50,
  generatorOffset: 0.0,
};

const initialCH2: ChannelSettings = {
  enabled: true,
  voltsPerDiv: 1.0, // 1V / div
  offsetY: -1.5,
  coupling: 'dc',
  probeAttenuation: 1,
  color: '#06b6d4', // Cyan (authentic CH2)
  label: 'CH2',
  generatorMode: 'auto',
  generatorFrequency: 490,
  generatorAmplitude: 5.0,
  generatorDutyCycle: 50,
  generatorOffset: 0.0,
};

const initialHorizontal: HorizontalSettings = {
  timePerDiv: 0.0005, // 500µs / div
  offsetX: 0.0,
};

const initialTrigger: TriggerSettings = {
  source: 'ch1',
  mode: 'auto',
  slope: 'rising',
  level: 1.5, // 1.5V TTL threshold
  triggered: true,
};

let state: OscilloscopeState = {
  isOpen: false,
  isRunning: true,
  singleTriggerArmed: false,
  viewMode: 'time',
  horizontal: initialHorizontal,
  trigger: initialTrigger,
  ch1: initialCH1,
  ch2: initialCH2,
  measurementsCH1: {
    vpp: 0,
    vrms: 0,
    vavg: 0,
    vmax: 0,
    vmin: 0,
    frequency: 0,
    period: 0,
    dutyCycle: 0,
    detectedType: 'Disconnected',
    connectedSource: null,
  },
  measurementsCH2: {
    vpp: 0,
    vrms: 0,
    vavg: 0,
    vmax: 0,
    vmin: 0,
    frequency: 0,
    period: 0,
    dutyCycle: 0,
    detectedType: 'Disconnected',
    connectedSource: null,
  },
  ch1ProbeEndpoint: null,
  ch2ProbeEndpoint: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export const oscilloscopeStore = {
  getState(): OscilloscopeState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  openOscilloscope() {
    state = { ...state, isOpen: true };
    notify();
  },

  closeOscilloscope() {
    state = { ...state, isOpen: false };
    notify();
  },

  toggleOscilloscope() {
    state = { ...state, isOpen: !state.isOpen };
    notify();
  },

  setRunning(running: boolean) {
    state = { ...state, isRunning: running };
    notify();
  },

  toggleRun() {
    state = { ...state, isRunning: !state.isRunning };
    notify();
  },

  setViewMode(mode: 'time' | 'fft') {
    state = { ...state, viewMode: mode };
    notify();
  },

  setChannelEnabled(channel: 'ch1' | 'ch2', enabled: boolean) {
    state = {
      ...state,
      [channel]: {
        ...state[channel],
        enabled,
      },
    };
    notify();
  },

  setVoltsPerDiv(channel: 'ch1' | 'ch2', volts: number) {
    const clamped = Math.max(0.01, Math.min(20, volts));
    state = {
      ...state,
      [channel]: {
        ...state[channel],
        voltsPerDiv: clamped,
      },
    };
    notify();
  },

  setTimePerDiv(seconds: number) {
    const clamped = Math.max(0.000001, Math.min(1.0, seconds));
    state = {
      ...state,
      horizontal: {
        ...state.horizontal,
        timePerDiv: clamped,
      },
    };
    notify();
  },

  setOffsetY(channel: 'ch1' | 'ch2', offsetY: number) {
    state = {
      ...state,
      [channel]: {
        ...state[channel],
        offsetY,
      },
    };
    notify();
  },

  setOffsetX(offsetX: number) {
    state = {
      ...state,
      horizontal: {
        ...state.horizontal,
        offsetX,
      },
    };
    notify();
  },

  setCoupling(channel: 'ch1' | 'ch2', coupling: CouplingMode) {
    state = {
      ...state,
      [channel]: {
        ...state[channel],
        coupling,
      },
    };
    notify();
  },

  setTrigger(settings: Partial<TriggerSettings>) {
    state = {
      ...state,
      trigger: {
        ...state.trigger,
        ...settings,
      },
    };
    notify();
  },

  setProbeTarget(channel: 'ch1' | 'ch2', target: { componentId: string; pinId: string } | null) {
    if (channel === 'ch1') {
      state = { ...state, ch1ProbeEndpoint: target };
    } else {
      state = { ...state, ch2ProbeEndpoint: target };
    }
    notify();
  },

  setGeneratorMode(
    channel: 'ch1' | 'ch2',
    mode: SignalWaveformType,
    params?: { frequency?: number; amplitude?: number; dutyCycle?: number; offset?: number }
  ) {
    state = {
      ...state,
      [channel]: {
        ...state[channel],
        generatorMode: mode,
        ...(params?.frequency !== undefined && { generatorFrequency: params.frequency }),
        ...(params?.amplitude !== undefined && { generatorAmplitude: params.amplitude }),
        ...(params?.dutyCycle !== undefined && { generatorDutyCycle: params.dutyCycle }),
        ...(params?.offset !== undefined && { generatorOffset: params.offset }),
      },
    };
    notify();
  },

  updateMeasurements(ch1: Partial<OscilloscopeState['measurementsCH1']>, ch2: Partial<OscilloscopeState['measurementsCH2']>) {
    state = {
      ...state,
      measurementsCH1: { ...state.measurementsCH1, ...ch1 },
      measurementsCH2: { ...state.measurementsCH2, ...ch2 },
    };
    notify();
  },

  /**
   * One-touch AUTO-SET: Analyzes active channel signals and locks timebase, volts/div, and trigger
   */
  autoSet(components: VirtualComponent[], connections: Connection[]) {
    // 1. Resolve probe for CH1 or CH2
    const target = state.ch1ProbeEndpoint || state.ch2ProbeEndpoint;
    const chKey = state.ch1.enabled ? 'ch1' : 'ch2';
    const activeTarget = chKey === 'ch1' ? state.ch1ProbeEndpoint : state.ch2ProbeEndpoint;

    const signal = OscilloscopeSignalEngine.resolveChannelSignal(
      activeTarget,
      components,
      connections,
      state[chKey]
    );

    // Compute optimal Volts/Div: 8 divisions vertical screen
    let vDiv = 1.0;
    const amp = signal.nominalAmp || 3.3;
    if (amp <= 0.2) vDiv = 0.05;
    else if (amp <= 0.5) vDiv = 0.1;
    else if (amp <= 1.0) vDiv = 0.2;
    else if (amp <= 2.5) vDiv = 0.5;
    else if (amp <= 6.0) vDiv = 1.0;
    else if (amp <= 12.0) vDiv = 2.0;
    else vDiv = 5.0;

    // Compute optimal Time/Div: display ~2-4 cycles across 10 horizontal divisions
    let tDiv = 0.001;
    const freq = signal.nominalFreq > 0 ? signal.nominalFreq : 1000;
    const period = 1 / freq;
    const targetWindow = period * 3; // 3 cycles
    const rawTDiv = targetWindow / 10;

    const standardSteps = [
      0.00001, 0.00002, 0.00005,
      0.0001, 0.0002, 0.0005,
      0.001, 0.002, 0.005,
      0.01, 0.02, 0.05, 0.1
    ];

    tDiv = standardSteps.reduce((prev, curr) =>
      Math.abs(curr - rawTDiv) < Math.abs(prev - rawTDiv) ? curr : prev
    );

    // Optimal trigger level: midpoint
    const triggerLvl = signal.nominalAmp > 0 ? signal.nominalOffset : 1.5;

    state = {
      ...state,
      isRunning: true,
      horizontal: {
        ...state.horizontal,
        timePerDiv: tDiv,
        offsetX: 0,
      },
      trigger: {
        ...state.trigger,
        source: chKey,
        mode: 'auto',
        level: Number(triggerLvl.toFixed(2)),
      },
      [chKey]: {
        ...state[chKey],
        voltsPerDiv: vDiv,
        offsetY: 0,
      },
    };
    notify();
  },
};

export function useOscilloscope(): OscilloscopeState {
  return useSyncExternalStore(oscilloscopeStore.subscribe, oscilloscopeStore.getState);
}
