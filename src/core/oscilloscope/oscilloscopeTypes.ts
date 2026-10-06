export type CouplingMode = 'dc' | 'ac' | 'gnd';
export type TriggerMode = 'auto' | 'norm' | 'single';
export type TriggerSlope = 'rising' | 'falling';
export type SignalWaveformType = 'auto' | 'pwm' | 'sine' | 'square' | 'triangle' | 'rc' | 'dc' | 'noise';

export interface ChannelSettings {
  enabled: boolean;
  voltsPerDiv: number; // e.g. 0.05, 0.1, 0.2, 0.5, 1, 2, 5
  offsetY: number; // in volts or divisions
  coupling: CouplingMode;
  probeAttenuation: 1 | 10;
  color: string;
  label: string;
  // Manual generator override if not connected to circuit
  generatorMode?: SignalWaveformType;
  generatorFrequency?: number;
  generatorAmplitude?: number;
  generatorDutyCycle?: number;
  generatorOffset?: number;
}

export interface TriggerSettings {
  source: 'ch1' | 'ch2';
  mode: TriggerMode;
  slope: TriggerSlope;
  level: number; // in volts
  triggered: boolean;
}

export interface HorizontalSettings {
  timePerDiv: number; // in seconds (e.g. 0.00001, 0.0001, 0.001, 0.01)
  offsetX: number; // in seconds
}

export interface ChannelMeasurements {
  vpp: number; // Peak to peak
  vrms: number; // Root mean square
  vavg: number; // Average / DC
  vmax: number; // Maximum
  vmin: number; // Minimum
  frequency: number; // in Hz
  period: number; // in seconds
  dutyCycle: number; // 0 - 100 %
  detectedType: string;
  connectedSource: string | null;
}

export interface OscilloscopeState {
  isOpen: boolean;
  isRunning: boolean;
  singleTriggerArmed: boolean;
  viewMode: 'time' | 'fft';
  horizontal: HorizontalSettings;
  trigger: TriggerSettings;
  ch1: ChannelSettings;
  ch2: ChannelSettings;
  measurementsCH1: ChannelMeasurements;
  measurementsCH2: ChannelMeasurements;
  // Target probe assignments (manual override or wire traced)
  ch1ProbeEndpoint: { componentId: string; pinId: string } | null;
  ch2ProbeEndpoint: { componentId: string; pinId: string } | null;
}
