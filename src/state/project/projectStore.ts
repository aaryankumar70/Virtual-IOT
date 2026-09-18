import { useSyncExternalStore } from 'react';
import { VirtualComponent, ComponentTransform } from '../../core/components/VirtualComponent';
import { Connection, PinEndpoint } from '../../core/connections/Connection';
import { createComponent, generateId } from '../../core/factories/componentFactory';
import { ProjectData } from '../../project/serialization/projectSchema';
import { calculatePinWorldPosition } from '../../core/pins/pinPosition';

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

  addConnection(source: PinEndpoint, target: PinEndpoint, color?: string): Connection {
    // Check if connection already exists between these exact pins
    const existing = state.connections.find(
      (c) =>
        (c.source.componentId === source.componentId &&
          c.source.pinId === source.pinId &&
          c.target.componentId === target.componentId &&
          c.target.pinId === target.pinId) ||
        (c.source.componentId === target.componentId &&
          c.source.pinId === target.pinId &&
          c.target.componentId === source.componentId &&
          c.target.pinId === source.pinId)
    );

    if (existing) return existing;

    const newConnection: Connection = {
      id: generateId('wire'),
      source: { ...source },
      target: { ...target },
      color: color || '#3b82f6',
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

  disconnectPin(componentId: string, pinId: string) {
    state = {
      ...state,
      connections: state.connections.filter(
        (c) =>
          !(c.source.componentId === componentId && c.source.pinId === pinId) &&
          !(c.target.componentId === componentId && c.target.pinId === pinId)
      ),
    };
    notify();
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
};

export function useProject(): ProjectState {
  return useSyncExternalStore(projectStore.subscribe, projectStore.getState);
}
