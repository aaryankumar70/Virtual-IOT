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
import { viewStore } from '../view/viewStore';
import {
  BreadboardDropPlacement,
  calculateComponentBreadboardPlacement,
  getBreadboardColumnWorldX,
  getBreadboardRowWorldZ,
} from '../../utils/breadboardSnap';

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

  updateComponentState(id: string, stateUpdate: Record<string, unknown>) {
    state = {
      ...state,
      components: state.components.map((comp) =>
        comp.id === id ? { ...comp, state: { ...comp.state, ...stateUpdate } } : comp
      ),
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

  /**
   * Synchronizes a component's automatic breadboard-hole connections when moved onto,
   * across, or off a breadboard in the 3D scene.
   */
  syncBreadboardConnectionsForComponent(
    componentId: string,
    placement: BreadboardDropPlacement | null
  ) {
    // 1. Remove any existing automatic breadboard insertion connections for this component
    state = {
      ...state,
      connections: state.connections.filter(
        (c) =>
          !(
            c.type === 'breadboard' &&
            (c.source.componentId === componentId || c.target.componentId === componentId)
          )
      ),
    };

    // 2. If placed on a breadboard, create new breadboard hole connections for each lead
    if (placement) {
      placement.targetHoles.forEach((target) => {
        this.addConnection(
          {
            componentId,
            interfaceId: target.pinId,
            type: 'pin',
            pinId: target.pinId,
          },
          {
            componentId: placement.breadboardId,
            interfaceId: target.holeId,
            type: 'breadboard-hole',
            pinId: target.holeId,
          },
          'breadboard'
        );
      });
    } else {
      notify();
    }
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

    // 4. OLED 0.96" I2C Screen
    const oled = createComponent('oled-display', { x: 1.2, y: 0, z: 2.2 });
    this.addComponent(oled);

    // Arduino A4 (SDA) -> OLED SDA (cyan wire)
    this.addConnection(
      { componentId: arduino.id, pinId: 'a4' },
      { componentId: oled.id, pinId: 'sda' },
      '#06b6d4'
    );
    // Arduino A5 (SCL) -> OLED SCL (yellow wire)
    this.addConnection(
      { componentId: arduino.id, pinId: 'a5' },
      { componentId: oled.id, pinId: 'scl' },
      '#eab308'
    );
    // Arduino 5V -> OLED VCC (red wire)
    this.addConnection(
      { componentId: arduino.id, pinId: '5v' },
      { componentId: oled.id, pinId: 'vcc' },
      '#ef4444'
    );
    // Arduino GND -> OLED GND (black wire)
    this.addConnection(
      { componentId: arduino.id, pinId: 'gnd_1' },
      { componentId: oled.id, pinId: 'gnd' },
      '#1e293b'
    );
  },

  loadOscilloscopeCircuit() {
    this.resetProject();
    state = {
      ...state,
      metadata: {
        name: 'Oscilloscope PWM & RC Filter Lab',
        description: 'Real-time oscilloscope connected to breadboard pins analyzing 490Hz PWM and filtered analog signals.',
      },
    };

    // 1. Breadboard in center
    const breadboard = createComponent('breadboard', { x: 0, y: 0, z: 0 });
    // 2. Arduino Uno on left
    const arduino = createComponent('arduino-uno', { x: -4.75, y: 0, z: 0 });
    // 3. Digital Storage Oscilloscope top/bench
    const oscilloscope = createComponent('oscilloscope', { x: 0.75, y: 0, z: -3.5 });

    // 4. 220Ω Resistor snapped into Breadboard Row C (Cols 14 to 18)
    const resPlacement = calculateComponentBreadboardPlacement(
      breadboard,
      'resistor',
      getBreadboardColumnWorldX(breadboard, 16),
      getBreadboardRowWorldZ(breadboard, 'c')
    )!;
    const resistor = createComponent('resistor', resPlacement.snappedPosition);

    // 5. Ceramic Capacitor snapped into Breadboard Row D (Cols 18 to 20)
    const capPlacement = calculateComponentBreadboardPlacement(
      breadboard,
      'capacitor-ceramic',
      getBreadboardColumnWorldX(breadboard, 19),
      getBreadboardRowWorldZ(breadboard, 'd')
    )!;
    const capacitor = createComponent('capacitor-ceramic', capPlacement.snappedPosition);

    this.addComponent(breadboard);
    this.addComponent(arduino);
    this.addComponent(oscilloscope);
    this.addComponent(resistor);
    this.addComponent(capacitor);

    this.syncBreadboardConnectionsForComponent(resistor.id, resPlacement);
    this.syncBreadboardConnectionsForComponent(capacitor.id, capPlacement);

    // Wires:
    // 1. Arduino D9 (490Hz PWM) -> Breadboard Row 14 Hole A (Orange wire)
    this.addConnection(
      { componentId: arduino.id, pinId: 'd9' },
      { componentId: breadboard.id, pinId: 'row_14_a' },
      '#f97316'
    );

    // 2. Capacitor Lead 2 (Row 20E) -> Breadboard Bottom GND Rail (-)
    this.addConnection(
      { componentId: breadboard.id, pinId: 'row_20_e' },
      { componentId: breadboard.id, pinId: 'rail_bot_minus_20' },
      '#1e293b'
    );

    // 3. Arduino GND -> Breadboard Bottom GND Rail (-)
    this.addConnection(
      { componentId: arduino.id, pinId: 'gnd_1' },
      { componentId: breadboard.id, pinId: 'rail_bot_minus_1' },
      '#1e293b'
    );

    // 4. Oscilloscope CH1 Probe -> Breadboard Row 18 Hole A (Filtered RC node! Yellow wire)
    this.addConnection(
      { componentId: oscilloscope.id, pinId: 'ch1_probe' },
      { componentId: breadboard.id, pinId: 'row_18_a' },
      '#facc15'
    );

    // 5. Oscilloscope CH2 Probe -> Arduino D3 (Raw 490Hz PWM! Cyan wire)
    this.addConnection(
      { componentId: oscilloscope.id, pinId: 'ch2_probe' },
      { componentId: arduino.id, pinId: 'd3' },
      '#06b6d4'
    );

    // 6. Oscilloscope GND Clip -> Breadboard Bottom GND Rail (-)
    this.addConnection(
      { componentId: oscilloscope.id, pinId: 'gnd_probe' },
      { componentId: breadboard.id, pinId: 'rail_bot_minus_25' },
      '#1e293b'
    );
  },

  loadLogicGateCircuit() {
    this.resetProject();
    viewStore.clearSelection();

    // 1. Breadboard centered
    const breadboard = createComponent('breadboard', { x: 0, y: 0, z: 0 });
    this.addComponent(breadboard);

    // 2. AND Gate centered at Column 9 (spans Columns 8, 9, 10 across Row D & Row G)
    const andPlacement = calculateComponentBreadboardPlacement(
      breadboard,
      'gate-and',
      getBreadboardColumnWorldX(breadboard, 9),
      0
    )!;
    const andGate = createComponent('gate-and', andPlacement.snappedPosition, { inputA: true, inputB: true });
    this.addComponent(andGate);
    this.syncBreadboardConnectionsForComponent(andGate.id, andPlacement);

    // 3. XOR Gate centered at Column 19 (spans Columns 18, 19, 20 across Row D & Row G)
    const xorPlacement = calculateComponentBreadboardPlacement(
      breadboard,
      'gate-xor',
      getBreadboardColumnWorldX(breadboard, 19),
      0
    )!;
    const xorGate = createComponent('gate-xor', xorPlacement.snappedPosition, { inputA: true, inputB: false });
    this.addComponent(xorGate);
    this.syncBreadboardConnectionsForComponent(xorGate.id, xorPlacement);

    // 4. Power supply / rails: wire top rail (+) to VCC (Cols 10 & 20)
    this.addConnection({ componentId: breadboard.id, pinId: 'rail_top_plus_10' }, { componentId: breadboard.id, pinId: 'row_10_b' }, '#ef4444');
    this.addConnection({ componentId: breadboard.id, pinId: 'rail_top_plus_20' }, { componentId: breadboard.id, pinId: 'row_20_b' }, '#ef4444');

    // Wire bottom rail (-) to GND (Cols 10 & 20)
    this.addConnection({ componentId: breadboard.id, pinId: 'rail_bot_minus_10' }, { componentId: breadboard.id, pinId: 'row_10_i' }, '#1e293b');
    this.addConnection({ componentId: breadboard.id, pinId: 'rail_bot_minus_20' }, { componentId: breadboard.id, pinId: 'row_20_i' }, '#1e293b');

    // 5. Green LED snapped into Row I (Anode in Col 8, Cathode in Col 9)
    const ledPlacement = calculateComponentBreadboardPlacement(
      breadboard,
      'led',
      getBreadboardColumnWorldX(breadboard, 8),
      getBreadboardRowWorldZ(breadboard, 'i')
    )!;
    const led = createComponent('led', ledPlacement.snappedPosition, { color: '#10b981' });
    this.addComponent(led);
    this.syncBreadboardConnectionsForComponent(led.id, ledPlacement);

    // Connect LED Cathode (Row 9J) to Bottom GND Rail (-)
    this.addConnection({ componentId: breadboard.id, pinId: 'row_9_j' }, { componentId: breadboard.id, pinId: 'rail_bot_minus_9' }, '#1e293b');

    viewStore.setContinuityMode(true);
    viewStore.selectComponent(andGate.id);
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
