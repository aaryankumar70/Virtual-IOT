import { VirtualComponent } from '../components/VirtualComponent';
import { VirtualPin } from '../pins/VirtualPin';

export interface ComponentDefinition {
  type: string;
  displayName: string;
  category: 'microcontroller' | 'board' | 'prototyping' | 'output' | 'input' | 'sensor' | 'passive' | 'communication' | 'power' | 'display' | 'misc';
  description: string;
  manufacturer?: string;
  pins: VirtualPin[];
  defaultState?: Record<string, unknown>;
  dimensions: { width: number; height: number; depth: number };
}

class ComponentRegistryClass {
  private definitions: Map<string, ComponentDefinition> = new Map();

  register(definition: ComponentDefinition) {
    this.definitions.set(definition.type, definition);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type);
  }

  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }

  getByCategory(category: string): ComponentDefinition[] {
    return this.getAll().filter((def) => def.category === category);
  }
}

export const ComponentRegistry = new ComponentRegistryClass();
