/**
 * Virtual IoT Lab — Master Lab Store
 *
 * Coordinates the 6 explicit Laboratory Workflows:
 * BUILD -> CONNECT -> CODE -> SIMULATE -> MEASURE -> EXPERIMENT
 * Ensures unified project and hardware state flows seamlessly across all modes.
 */

import { useSyncExternalStore } from 'react';
import { assemblyGraph } from './assemblyEngine/AssemblyGraph';
import { connectionGraph } from './connectionEngine/ConnectionGraph';
import { simulationEngine, DomainTelemetry } from './simulationEngine/SimulationEngine';
import { instrumentEngine } from './instrumentEngine/InstrumentEngine';
import { experimentEngine } from './experimentEngine/ExperimentEngine';
import { HARDWARE_DATABASE } from './hardwareEngine/hardwareDatabase';
import { HardwareEntity } from './hardwareEngine/HardwareEntity';

export type LabWorkflowMode = 'build' | 'connect' | 'code' | 'simulate' | 'measure' | 'experiment';

export interface LabState {
  currentMode: LabWorkflowMode;
  selectedEntityId: string | null;
  explodedOffset: number; // 0.0 = fully assembled, 1.0 = fully exploded
  cameraMode: 'chase' | 'fpv' | 'orbit' | 'engineering';
  showEngineeringOverlay: boolean;
  pidSettings: {
    rollP: number;
    rollI: number;
    rollD: number;
    pitchP: number;
    pitchI: number;
    pitchD: number;
    yawP: number;
    yawI: number;
    yawD: number;
  };
  flightMode: 'angle' | 'acro' | 'alt_hold';
  dshotProtocol: 'DShot600' | 'DShot300' | 'PWM';
  failsafeMode: 'drop' | 'land';
}

let state: LabState = {
  currentMode: 'simulate',
  selectedEntityId: 'part_frame_geprc_mark4',
  explodedOffset: 0.0,
  cameraMode: 'chase',
  showEngineeringOverlay: true,
  pidSettings: {
    rollP: 45,
    rollI: 80,
    rollD: 35,
    pitchP: 47,
    pitchI: 84,
    pitchD: 38,
    yawP: 42,
    yawI: 90,
    yawD: 0,
  },
  flightMode: 'angle',
  dshotProtocol: 'DShot600',
  failsafeMode: 'drop',
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const labStore = {
  getSnapshot(): LabState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setMode(mode: LabWorkflowMode) {
    state = { ...state, currentMode: mode };
    notify();
  },

  selectEntity(entityId: string | null) {
    state = { ...state, selectedEntityId: entityId };
    notify();
  },

  setExplodedOffset(val: number) {
    state = { ...state, explodedOffset: Math.max(0, Math.min(2.0, val)) };
    notify();
  },

  setCameraMode(cam: 'chase' | 'fpv' | 'orbit' | 'engineering') {
    state = { ...state, cameraMode: cam };
    notify();
  },

  toggleEngineeringOverlay() {
    state = { ...state, showEngineeringOverlay: !state.showEngineeringOverlay };
    notify();
  },

  setFlightMode(mode: 'angle' | 'acro' | 'alt_hold') {
    state = { ...state, flightMode: mode };
    simulationEngine.inputs.flightMode = mode;
    notify();
  },

  setDshotProtocol(proto: 'DShot600' | 'DShot300' | 'PWM') {
    state = { ...state, dshotProtocol: proto };
    notify();
  },

  updatePid(key: keyof LabState['pidSettings'], val: number) {
    state = {
      ...state,
      pidSettings: { ...state.pidSettings, [key]: val },
    };
    notify();
  },

  setFailsafeMode(m: 'drop' | 'land') {
    state = { ...state, failsafeMode: m };
    notify();
  },

  getSelectedEntity(): HardwareEntity | undefined {
    if (!state.selectedEntityId) return undefined;
    return assemblyGraph.entities.get(state.selectedEntityId) || HARDWARE_DATABASE[state.selectedEntityId];
  },
};

export function useLabStore(): LabState {
  return useSyncExternalStore(labStore.subscribe, labStore.getSnapshot);
}
