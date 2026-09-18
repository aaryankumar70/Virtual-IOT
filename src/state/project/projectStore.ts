import { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { VirtualComponent, ComponentTransform } from '../../core/components/VirtualComponent';
import {
  Connection,
  ConnectionEndpoint,
  ConnectionType,
  ConnectionMetadata,
  PinEndpoint,
} from '../../core/connections/Connection';
import { createComponent, generateId } from '../../core/factories/componentFactory';
import { ProjectData } from '../../project/serialization/projectSchema';
import { calculatePinWorldPosition } from '../../core/pins/pinPosition';
import { calculateEndpointWorldPosition } from '../../core/connections/endpointPosition';

export interface ProjectState {
  metadata: {
    name: string;
    description: string;
  };
  components: VirtualComponent[];
  connections: Connection[];
}

let state: ProjectState = {
  metadata: {
    name: 'Untitled Circuit',
    description: 'A new 3D IoT laboratory circuit',
  },
  components: [],
  connections: [],
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const projectStore = {
  getState(): ProjectState {
    return state;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  setProjectName(name: string) {
    state = {
      ...state,
      metadata: { ...state.metadata, name },
    };
    notify();
  },

  addComponent(component: VirtualComponent) {
    state = {
      ...state,
      components: [...state.components, component],
    };
    notify();
  },

  updateComponentTransform(id: string, transformUpdate: Partial<ComponentTransform>) {
    const comp = state.components.find((c) => c.id === id);
    if (!comp) return;

    const newPos = transformUpdate.position
      ? { ...comp.transform.position, ...transformUpdate.position }
      : comp.transform.position;
    const newRot = transformUpdate.rotation
      ? { ...comp.transform.rotation, ...transformUpdate.rotation }
      : comp.transform.rotation;
    const newScale = transformUpdate.scale
      ? { ...comp.transform.scale, ...transformUpdate.scale }
      : comp.transform.scale;

    if (
      comp.transform.position.x === newPos.x &&
      comp.transform.position.y === newPos.y &&
      comp.transform.position.z === newPos.z &&
      comp.transform.rotation.x === newRot.x &&
      comp.transform.rotation.y === newRot.y &&
      comp.transform.rotation.z === newRot.z &&
      comp.transform.scale.x === newScale.x &&
      comp.transform.scale.y === newScale.y &&
      comp.transform.scale.z === newScale.z
    ) {
      return;
    }

    state = {
      ...state,
      components: state.components.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          transform: {
            position: newPos,
            rotation: newRot,
            scale: newScale,
          },
        };
      }),
    };
    notify();
  },

  updateComponentName(id: string, name: string) {
    state = {
      ...state,
      components: state.components.map((comp) => (comp.id === id ? { ...comp, name } : comp)),
    };
    notify();
  },

  removeComponent(id: string) {
    state = {
      ...state,
      components: state.components.filter((c) => c.id !== id),
      connections: state.connections.filter(
        (conn) => conn.source.componentId !== id && conn.target.componentId !== id
      ),
    };
    notify();
  },

  duplicateComponent(id: string): VirtualComponent | null {
    const original = state.components.find((c) => c.id === id);
    if (!original) return null;

    const copy = createComponent(original.type, {
      x: original.transform.position.x + 2,
      y: original.transform.position.y,
      z: original.transform.position.z + 1.5,
    });
    copy.name = `${original.name} (Copy)`;
    copy.transform.rotation = { ...original.transform.rotation };
    copy.transform.scale = { ...original.transform.scale };

    this.addComponent(copy);
    return copy;
  },

  addConnection(
    source: ConnectionEndpoint,
    target: ConnectionEndpoint,
    arg3?: ConnectionType | string,
    arg4?: string | ConnectionMetadata,
    arg5?: ConnectionMetadata
  ): Connection {
    const srcInterface = source.interfaceId || source.pinId || '';
    const tgtInterface = target.interfaceId || target.pinId || '';

    // Determine type, color, metadata from flexible arguments
    let connType: ConnectionType = 'wire';
    let connColor = '#3b82f6';
    let connMetadata: ConnectionMetadata | undefined = undefined;

    if (
      arg3 &&
      ['wire', 'direct', 'header', 'plug-socket', 'usb', 'dc-power', 'breadboard'].includes(
        arg3 as string
      )
    ) {
      connType = arg3 as ConnectionType;
      if (typeof arg4 === 'string') {
        connColor = arg4;
        connMetadata = arg5;
      } else if (typeof arg4 === 'object') {
        connMetadata = arg4;
      }
    } else if (typeof arg3 === 'string') {
      connColor = arg3;
      if (typeof arg4 === 'object') {
        connMetadata = arg4 as ConnectionMetadata;
      }
    }

    // Auto-detect type if not explicitly set
    if (connType === 'wire') {
      if (
        source.type === 'connector' ||
        target.type === 'connector' ||
        source.type === 'socket' ||
        target.type === 'socket' ||
        source.type === 'port' ||
        target.type === 'port'
      ) {
        // Detect USB vs DC vs Header based on metadata or interface name
        const lowerSrc = srcInterface.toLowerCase();
        const lowerTgt = tgtInterface.toLowerCase();
        if (lowerSrc.includes('usb') || lowerTgt.includes('usb')) {
          connType = 'usb';
        } else if (lowerSrc.includes('dc') || lowerTgt.includes('dc') || lowerSrc.includes('barrel') || lowerTgt.includes('barrel')) {
          connType = 'dc-power';
        } else if (lowerSrc.includes('header') || lowerTgt.includes('header')) {
          connType = 'header';
        } else {
          connType = 'plug-socket';
        }
      } else if (source.type === 'breadboard-hole' || target.type === 'breadboard-hole') {
        if (source.type === 'pin' || target.type === 'pin') {
          connType = 'breadboard';
        }
      }
    }

    // Check if connection already exists between these exact interfaces
    const existing = state.connections.find(
      (c) =>
        (c.source.componentId === source.componentId &&
          (c.source.interfaceId === srcInterface || c.source.pinId === srcInterface) &&
          c.target.componentId === target.componentId &&
          (c.target.interfaceId === tgtInterface || c.target.pinId === tgtInterface)) ||
        (c.source.componentId === target.componentId &&
          (c.source.interfaceId === tgtInterface || c.source.pinId === tgtInterface) &&
          c.target.componentId === source.componentId &&
          (c.target.interfaceId === srcInterface || c.target.pinId === srcInterface))
    );

    if (existing) return existing;

    const newConnection: Connection = {
      id: generateId(connType),
      type: connType,
      source: {
        componentId: source.componentId,
        interfaceId: srcInterface,
        type: source.type || 'pin',
        pinId: source.pinId || srcInterface,
      },
      target: {
        componentId: target.componentId,
        interfaceId: tgtInterface,
        type: target.type || 'pin',
        pinId: target.pinId || tgtInterface,
      },
      color: connColor,
      metadata: connMetadata || {},
    };

    state = {
      ...state,
      connections: [...state.connections, newConnection],
    };
    notify();
    return newConnection;
  },

  removeConnection(id: string) {
    state = {
      ...state,
      connections: state.connections.filter((c) => c.id !== id),
    };
    notify();
  },

  disconnectEndpoint(componentId: string, interfaceId: string) {
    state = {
      ...state,
      connections: state.connections.filter(
        (c) =>
          !(
            c.source.componentId === componentId &&
            (c.source.interfaceId === interfaceId || c.source.pinId === interfaceId)
          ) &&
          !(
            c.target.componentId === componentId &&
            (c.target.interfaceId === interfaceId || c.target.pinId === interfaceId)
          )
      ),
    };
    notify();
  },

  disconnectPin(componentId: string, pinId: string) {
    this.disconnectEndpoint(componentId, pinId);
  },

  loadProject(projectData: ProjectData) {
    state = {
      metadata: {
        name: projectData.metadata.name || 'Imported Project',
        description: projectData.metadata.description || '',
      },
      components: projectData.components.map((c) => ({
        ...c,
        transform: {
          position: { ...c.transform.position },
          rotation: { ...c.transform.rotation },
          scale: { ...c.transform.scale },
        },
      })),
      connections: projectData.connections.map((conn) => ({ ...conn })),
    };
    notify();
  },

  resetProject() {
    state = {
      metadata: {
        name: 'Untitled Circuit',
        description: 'A new 3D IoT laboratory circuit',
      },
      components: [],
      connections: [],
    };
    notify();
  },

  loadExampleCircuit() {
    this.resetProject();

    // 1. Arduino Uno on left
    const arduino = createComponent('arduino-uno', { x: -3.5, y: 0, z: 0 });
    // 2. Resistor in middle
    const resistor = createComponent('resistor', { x: 0.5, y: 0, z: -1.2 });
    // 3. LED on right
    const led = createComponent('led', { x: 3.2, y: 0, z: -0.2 });

    this.addComponent(arduino);
    this.addComponent(resistor);
    this.addComponent(led);

    // Wires:
    // Arduino D13 -> Resistor Lead 1 (orange wire)
    this.addConnection(
      { componentId: arduino.id, pinId: 'd13' },
      { componentId: resistor.id, pinId: 'pin1' },
      '#fbbf24'
    );

    // Resistor Lead 2 -> LED Anode (red wire)
    this.addConnection(
      { componentId: resistor.id, pinId: 'pin2' },
      { componentId: led.id, pinId: 'anode' },
      '#ef4444'
    );

    // LED Cathode -> Arduino GND (dark grey / blue wire)
    this.addConnection(
      { componentId: led.id, pinId: 'cathode' },
      { componentId: arduino.id, pinId: 'gnd_top' },
      '#60a5fa'
    );
  },

  getPinWorldPosition(componentId: string, pinId: string) {
    const comp = state.components.find((c) => c.id === componentId);
    if (!comp) return null;
    return calculatePinWorldPosition(comp, pinId);
  },

  getEndpointWorldPosition(componentId: string, interfaceId: string): THREE.Vector3 | null {
    const comp = state.components.find((c) => c.id === componentId);
    if (!comp) return null;
    return calculateEndpointWorldPosition(comp, {
      componentId,
      interfaceId,
      type: 'pin',
      pinId: interfaceId,
    });
  },
};

export function useProject(): ProjectState {
  return useSyncExternalStore(projectStore.subscribe, projectStore.getState);
}
