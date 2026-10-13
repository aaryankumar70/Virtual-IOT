import { VirtualComponent } from '../components/VirtualComponent';
import { ComponentRegistry } from '../registry/ComponentRegistry';
import { Vector3D } from '../pins/VirtualPin';
import './componentDefinitions'; // ensure all registered

let idCounter = 1;

export function generateId(prefix: string = 'comp'): string {
  return `${prefix}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

export function createComponent(
  type: string,
  initialPosition?: Vector3D,
  initialState?: Record<string, unknown>
): VirtualComponent {
  const def = ComponentRegistry.get(type);
  if (!def) {
    throw new Error(`Unknown component type: "${type}"`);
  }

  const id = generateId(def.type.replace('-', '_'));

  // Deep copy pins so local modifications or state bindings stay independent
  const pins = def.pins.map((p) => ({
    ...p,
    localPosition: { ...p.localPosition },
    metadata: p.metadata ? { ...p.metadata } : undefined,
  }));

  const connectors = def.connectors
    ? def.connectors.map((c) => ({
        ...c,
        localPosition: { ...c.localPosition },
        orientation: c.orientation ? { ...c.orientation } : undefined,
        compatibleWith: c.compatibleWith ? [...c.compatibleWith] : undefined,
        pinMapping: c.pinMapping ? { ...c.pinMapping } : undefined,
        metadata: c.metadata ? { ...c.metadata } : undefined,
      }))
    : [];

  const ports = def.ports
    ? def.ports.map((pt) => ({
        ...pt,
        localPosition: { ...pt.localPosition },
        orientation: pt.orientation ? { ...pt.orientation } : undefined,
        compatibleWith: pt.compatibleWith ? [...pt.compatibleWith] : undefined,
        pinMapping: pt.pinMapping ? { ...pt.pinMapping } : undefined,
        metadata: pt.metadata ? { ...pt.metadata } : undefined,
      }))
    : [];

  const position: Vector3D = initialPosition
    ? { ...initialPosition }
    : { x: 0, y: 0, z: 0 };

  let customName = `${def.displayName}`;
  if (initialState?.resistance) {
    customName = `Resistor (${initialState.resistance}Ω)`;
  } else if (initialState?.color && type === 'led') {
    const colorMap: Record<string, string> = {
      '#ef4444': 'Red',
      '#10b981': 'Green',
      '#3b82f6': 'Blue',
      '#eab308': 'Yellow',
    };
    const cName = colorMap[initialState.color as string] || 'LED';
    customName = `${cName} 5mm LED`;
  }

  return {
    id,
    type: def.type,
    name: customName,
    transform: {
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    pins,
    connectors,
    ports,
    metadata: {
      category: def.category,
      manufacturer: def.manufacturer,
      description: def.description,
    },
    specification: def.specification ? JSON.parse(JSON.stringify(def.specification)) : undefined,
    subcomponents: def.subcomponents ? JSON.parse(JSON.stringify(def.subcomponents)) : undefined,
    state: {
      ...(def.defaultState ? JSON.parse(JSON.stringify(def.defaultState)) : {}),
      ...(initialState ? JSON.parse(JSON.stringify(initialState)) : {}),
    },
  };
}
