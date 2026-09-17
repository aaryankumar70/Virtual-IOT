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
  initialPosition?: Vector3D
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

  const position: Vector3D = initialPosition
    ? { ...initialPosition }
    : { x: 0, y: 0, z: 0 };

  return {
    id,
    type: def.type,
    name: `${def.displayName}`,
    transform: {
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    pins,
    metadata: {
      category: def.category,
      manufacturer: def.manufacturer,
      description: def.description,
    },
    state: def.defaultState ? JSON.parse(JSON.stringify(def.defaultState)) : {},
  };
}
