import { useSyncExternalStore } from 'react';

export type TransformMode = 'translate' | 'rotate' | 'scale';

export interface ActiveWiringState {
  sourceComponentId: string;
  sourcePinId: string;
  currentWorldPos: { x: number; y: number; z: number };
}

export interface HoveredPinState {
  componentId: string;
  pinId: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  componentId?: string;
  connectionId?: string;
}

export interface DragPreviewState {
  type: string;
  worldPos: { x: number; y: number; z: number };
}

export interface HoveredConnectorState {
  componentId: string;
  connectorId: string;
}

export interface ActiveConnectorWiringState {
  sourceComponentId: string;
  sourceConnectorId: string;
  currentWorldPos: { x: number; y: number; z: number };
}

export interface ConnectorSnapTargetState {
  componentId: string;
  connectorId: string;
  position: { x: number; y: number; z: number };
}

export interface BreadboardSnapTargetState {
  breadboardId: string;
  holeId: string;
  position: { x: number; y: number; z: number };
}

export interface ConnectionFeedbackState {
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ViewState {
  selectedComponentIds: string[];
  selectedConnectionId: string | null;
  transformMode: TransformMode;
  isTransforming: boolean;
  isFreeMoving: boolean;
  activeWiring: ActiveWiringState | null;
  wireModeActive: boolean;
  dragPreview: DragPreviewState | null;
  hoveredPin: HoveredPinState | null;
  hoveredConnector: HoveredConnectorState | null;
  activeConnectorWiring: ActiveConnectorWiringState | null;
  connectorSnapTarget: ConnectorSnapTargetState | null;
  breadboardSnapTarget: BreadboardSnapTargetState | null;
  physicalConnectMode: boolean;
  contextMenu: ContextMenuState | null;
  cameraTrigger: { action: 'reset' | 'frameAll' | 'focusSelected'; timestamp: number } | null;
  inspectorOpen: boolean;
  libraryOpen: boolean;
  activeTab: 'components' | 'projects' | 'examples';
  inspectorTab: 'inspector' | 'properties';
  showGrid: boolean;
  snapToGrid: boolean;
  measureMode: boolean;
  cameraMode: 'perspective' | 'orthographic';
  theme: 'light' | 'dark';
  connectionFeedback: ConnectionFeedbackState | null;
}

let state: ViewState = {
  selectedComponentIds: [],
  selectedConnectionId: null,
  transformMode: 'translate',
  isTransforming: false,
  isFreeMoving: false,
  activeWiring: null,
  wireModeActive: false,
  dragPreview: null,
  hoveredPin: null,
  hoveredConnector: null,
  activeConnectorWiring: null,
  connectorSnapTarget: null,
  breadboardSnapTarget: null,
  physicalConnectMode: false,
  contextMenu: null,
  cameraTrigger: null,
  inspectorOpen: true,
  libraryOpen: true,
  activeTab: 'components',
  inspectorTab: 'inspector',
  showGrid: true,
  snapToGrid: false,
  measureMode: false,
  cameraMode: 'perspective',
  theme: 'light',
  connectionFeedback: null,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const viewStore = {
  getState(): ViewState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  selectComponent(id: string, multiSelect: boolean = false) {
    if (multiSelect) {
      const exists = state.selectedComponentIds.includes(id);
      const newIds = exists
        ? state.selectedComponentIds.filter((item) => item !== id)
        : [...state.selectedComponentIds, id];
      state = {
        ...state,
        selectedComponentIds: newIds,
        selectedConnectionId: null,
      };
    } else {
      state = {
        ...state,
        selectedComponentIds: [id],
        selectedConnectionId: null,
      };
    }
    notify();
  },

  clearSelection() {
    if (state.selectedComponentIds.length === 0 && state.selectedConnectionId === null) return;
    state = {
      ...state,
      selectedComponentIds: [],
      selectedConnectionId: null,
    };
    notify();
  },

  selectConnection(id: string) {
    state = {
      ...state,
      selectedConnectionId: id,
      selectedComponentIds: [],
    };
    notify();
  },

  setTransformMode(mode: TransformMode) {
    state = {
      ...state,
      transformMode: mode,
    };
    notify();
  },

  setIsTransforming(isTransforming: boolean) {
    if (state.isTransforming === isTransforming) return;
    state = {
      ...state,
      isTransforming,
    };
    notify();
  },

  setDragPreview(preview: DragPreviewState | null) {
    state = {
      ...state,
      dragPreview: preview,
    };
    notify();
  },

  setIsFreeMoving(active: boolean) {
    if (state.isFreeMoving === active) return;
    state = {
      ...state,
      isFreeMoving: active,
    };
    notify();
  },

  setWireMode(active: boolean) {
    state = {
      ...state,
      wireModeActive: active,
      activeWiring: active ? state.activeWiring : null,
    };
    notify();
  },

  toggleWireMode() {
    const next = !state.wireModeActive;
    state = {
      ...state,
      wireModeActive: next,
      activeWiring: next ? state.activeWiring : null,
    };
    notify();
  },

  startWiring(componentId: string, pinId: string, worldPos: { x: number; y: number; z: number }) {
    state = {
      ...state,
      wireModeActive: true,
      activeWiring: {
        sourceComponentId: componentId,
        sourcePinId: pinId,
        currentWorldPos: worldPos,
      },
    };
    notify();
  },

  updateWiringPreview(worldPos: { x: number; y: number; z: number }) {
    if (!state.activeWiring) return;
    const cur = state.activeWiring.currentWorldPos;
    if (
      cur &&
      Math.abs(cur.x - worldPos.x) < 0.002 &&
      Math.abs(cur.y - worldPos.y) < 0.002 &&
      Math.abs(cur.z - worldPos.z) < 0.002
    ) {
      return;
    }
    state = {
      ...state,
      activeWiring: {
        ...state.activeWiring,
        currentWorldPos: worldPos,
      },
    };
    notify();
  },

  cancelWiring() {
    state = {
      ...state,
      activeWiring: null,
      wireModeActive: false,
    };
    notify();
  },

  setHoveredPin(hover: HoveredPinState | null) {
    if (
      state.hoveredPin?.componentId === hover?.componentId &&
      state.hoveredPin?.pinId === hover?.pinId
    ) {
      return;
    }
    state = {
      ...state,
      hoveredPin: hover,
    };
    notify();
  },

  setHoveredConnector(hover: HoveredConnectorState | null) {
    if (
      state.hoveredConnector?.componentId === hover?.componentId &&
      state.hoveredConnector?.connectorId === hover?.connectorId
    ) {
      return;
    }
    state = {
      ...state,
      hoveredConnector: hover,
    };
    notify();
  },

  startConnectorWiring(
    componentId: string,
    connectorId: string,
    worldPos: { x: number; y: number; z: number }
  ) {
    state = {
      ...state,
      activeConnectorWiring: {
        sourceComponentId: componentId,
        sourceConnectorId: connectorId,
        currentWorldPos: worldPos,
      },
    };
    notify();
  },

  updateConnectorWiring(worldPos: { x: number; y: number; z: number }) {
    if (!state.activeConnectorWiring) return;
    const cur = state.activeConnectorWiring.currentWorldPos;
    if (
      cur &&
      Math.abs(cur.x - worldPos.x) < 0.002 &&
      Math.abs(cur.y - worldPos.y) < 0.002 &&
      Math.abs(cur.z - worldPos.z) < 0.002
    ) {
      return;
    }
    state = {
      ...state,
      activeConnectorWiring: {
        ...state.activeConnectorWiring,
        currentWorldPos: worldPos,
      },
    };
    notify();
  },

  cancelConnectorWiring() {
    state = {
      ...state,
      activeConnectorWiring: null,
    };
    notify();
  },

  setConnectorSnapTarget(snap: ConnectorSnapTargetState | null) {
    state = {
      ...state,
      connectorSnapTarget: snap,
    };
    notify();
  },

  setBreadboardSnapTarget(snap: BreadboardSnapTargetState | null) {
    state = {
      ...state,
      breadboardSnapTarget: snap,
    };
    notify();
  },

  setPhysicalConnectMode(active: boolean) {
    state = {
      ...state,
      physicalConnectMode: active,
    };
    notify();
  },

  setContextMenu(menu: ContextMenuState | null) {
    state = {
      ...state,
      contextMenu: menu,
    };
    notify();
  },

  triggerCamera(action: 'reset' | 'frameAll' | 'focusSelected') {
    state = {
      ...state,
      cameraTrigger: { action, timestamp: Date.now() },
    };
    notify();
  },

  toggleInspector() {
    state = { ...state, inspectorOpen: !state.inspectorOpen };
    notify();
  },

  toggleLibrary() {
    state = { ...state, libraryOpen: !state.libraryOpen };
    notify();
  },

  setActiveTab(tab: 'components' | 'projects' | 'examples') {
    state = { ...state, activeTab: tab };
    notify();
  },

  setInspectorTab(tab: 'inspector' | 'properties') {
    state = { ...state, inspectorTab: tab };
    notify();
  },

  toggleGrid() {
    state = { ...state, showGrid: !state.showGrid };
    notify();
  },

  toggleSnap() {
    state = { ...state, snapToGrid: !state.snapToGrid };
    notify();
  },

  toggleMeasure() {
    state = { ...state, measureMode: !state.measureMode };
    notify();
  },

  setCameraMode(mode: 'perspective' | 'orthographic') {
    state = { ...state, cameraMode: mode };
    notify();
  },

  toggleTheme() {
    state = { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    notify();
  },

  setConnectionFeedback(feedback: ConnectionFeedbackState | null) {
    if (feedbackTimeoutId) {
      clearTimeout(feedbackTimeoutId);
      feedbackTimeoutId = null;
    }

    state = {
      ...state,
      connectionFeedback: feedback,
    };
    notify();

    if (feedback) {
      feedbackTimeoutId = setTimeout(() => {
        state = {
          ...state,
          connectionFeedback: null,
        };
        feedbackTimeoutId = null;
        notify();
      }, 2500);
    }
  },
};

let feedbackTimeoutId: any = null;

export function useView(): ViewState {
  return useSyncExternalStore(viewStore.subscribe, viewStore.getState);
}
