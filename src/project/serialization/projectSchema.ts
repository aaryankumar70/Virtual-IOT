import { VirtualComponent } from '../../core/components/VirtualComponent';
import { Connection } from '../../core/connections/Connection';

export interface ProjectData {
  version: number;
  metadata: {
    name: string;
    description?: string;
    created?: string;
    modified?: string;
  };
  components: VirtualComponent[];
  connections: Connection[];
}

export const CURRENT_PROJECT_VERSION = 1;

export function serializeProject(
  name: string,
  components: VirtualComponent[],
  connections: Connection[],
  description?: string
): string {
  const project: ProjectData = {
    version: CURRENT_PROJECT_VERSION,
    metadata: {
      name,
      description,
      modified: new Date().toISOString(),
      created: new Date().toISOString(),
    },
    components,
    connections,
  };
  return JSON.stringify(project, null, 2);
}

export function deserializeProject(jsonStr: string): ProjectData {
  const data = JSON.parse(jsonStr);
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project file format: root must be an object');
  }
  if (!Array.isArray(data.components) || !Array.isArray(data.connections)) {
    throw new Error('Invalid project file: missing components or connections array');
  }
  const normalizedConnections: Connection[] = data.connections.map((c: any) => {
    const srcInterface = c.source.interfaceId || c.source.pinId || '';
    const tgtInterface = c.target.interfaceId || c.target.pinId || '';
    return {
      id: c.id,
      type: c.type || 'wire',
      source: {
        componentId: c.source.componentId,
        interfaceId: srcInterface,
        type: c.source.type || 'pin',
        pinId: c.source.pinId || srcInterface,
      },
      target: {
        componentId: c.target.componentId,
        interfaceId: tgtInterface,
        type: c.target.type || 'pin',
        pinId: c.target.pinId || tgtInterface,
      },
      color: c.color,
      metadata: c.metadata || {},
    };
  });

  return {
    version: data.version || 1,
    metadata: {
      name: data.metadata?.name || 'Untitled Project',
      description: data.metadata?.description || '',
      created: data.metadata?.created,
      modified: data.metadata?.modified,
    },
    components: data.components,
    connections: normalizedConnections,
  };
}
