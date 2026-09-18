import { VirtualComponent } from '../components/VirtualComponent';
import { Connection, ConnectionEndpoint } from './Connection';

/**
 * Returns the electrical node/net identifier for a breadboard hole.
 * Standard solderless breadboards tie columns A-E together for a given row,
 * columns F-J together for that row, and the power rails run horizontally across the bus.
 */
export function getBreadboardNodeId(componentId: string, holeId: string): string {
  // Top Rail +
  if (holeId.startsWith('rail_top_plus')) {
    return `${componentId}:rail_top_plus`;
  }
  // Top Rail -
  if (holeId.startsWith('rail_top_minus')) {
    return `${componentId}:rail_top_minus`;
  }
  // Bottom Rail +
  if (holeId.startsWith('rail_bot_plus')) {
    return `${componentId}:rail_bot_plus`;
  }
  // Bottom Rail -
  if (holeId.startsWith('rail_bot_minus')) {
    return `${componentId}:rail_bot_minus`;
  }

  // Row holes: row_${r}_${col}
  const match = holeId.match(/^row_(\d+)_([a-j])$/i);
  if (match) {
    const rowNum = match[1];
    const colLetter = match[2].toLowerCase();
    const side = ['a', 'b', 'c', 'd', 'e'].includes(colLetter) ? 'left' : 'right';
    return `${componentId}:row_${rowNum}_${side}`;
  }

  return `${componentId}:${holeId}`;
}

export interface ElectricalNet {
  id: string;
  endpoints: ConnectionEndpoint[];
  connections: Connection[];
  netType: 'power' | 'ground' | 'signal' | 'mixed';
}

export class ConnectionGraph {
  private adjacency: Map<string, Set<string>> = new Map();
  private endpointMap: Map<string, ConnectionEndpoint> = new Map();
  private connectionMap: Map<string, Connection> = new Map();

  constructor(components: VirtualComponent[], connections: Connection[]) {
    this.buildGraph(components, connections);
  }

  private getKey(endpoint: ConnectionEndpoint): string {
    const interfaceKey = endpoint.interfaceId || endpoint.pinId || '';
    return `${endpoint.componentId}:${interfaceKey}`;
  }

  private addEdge(k1: string, k2: string) {
    if (!this.adjacency.has(k1)) this.adjacency.set(k1, new Set());
    if (!this.adjacency.has(k2)) this.adjacency.set(k2, new Set());
    this.adjacency.get(k1)!.add(k2);
    this.adjacency.get(k2)!.add(k1);
  }

  public buildGraph(components: VirtualComponent[], connections: Connection[]) {
    this.adjacency.clear();
    this.endpointMap.clear();
    this.connectionMap.clear();

    // 1. Index all pins and connectors from components
    for (const comp of components) {
      if (comp.pins) {
        for (const pin of comp.pins) {
          const ep: ConnectionEndpoint = {
            componentId: comp.id,
            interfaceId: pin.id,
            type: comp.type === 'breadboard' ? 'breadboard-hole' : 'pin',
            pinId: pin.id,
          };
          const key = this.getKey(ep);
          this.endpointMap.set(key, ep);
        }
      }
      if (comp.connectors) {
        for (const conn of comp.connectors) {
          const ep: ConnectionEndpoint = {
            componentId: comp.id,
            interfaceId: conn.id,
            type: 'connector',
          };
          const key = this.getKey(ep);
          this.endpointMap.set(key, ep);
        }
      }

      // 2. Add breadboard internal tie-point edges
      if (comp.type === 'breadboard' && comp.pins) {
        // Group holes by breadboard node ID
        const nodeGroups = new Map<string, string[]>();
        for (const pin of comp.pins) {
          const nodeId = getBreadboardNodeId(comp.id, pin.id);
          if (!nodeGroups.has(nodeId)) {
            nodeGroups.set(nodeId, []);
          }
          nodeGroups.get(nodeId)!.push(pin.id);
        }

        // Connect all pins within the same node group (star/clique connection)
        for (const [, pinIds] of nodeGroups) {
          if (pinIds.length > 1) {
            const firstKey = `${comp.id}:${pinIds[0]}`;
            for (let i = 1; i < pinIds.length; i++) {
              const nextKey = `${comp.id}:${pinIds[i]}`;
              this.addEdge(firstKey, nextKey);
            }
          }
        }
      }
    }

    // 3. Add explicit connections (wires, connectors, breadboard insertions)
    for (const conn of connections) {
      this.connectionMap.set(conn.id, conn);

      const srcEp: ConnectionEndpoint = {
        componentId: conn.source.componentId,
        interfaceId: conn.source.interfaceId || conn.source.pinId || '',
        type: conn.source.type || 'pin',
        pinId: conn.source.pinId || conn.source.interfaceId,
      };

      const tgtEp: ConnectionEndpoint = {
        componentId: conn.target.componentId,
        interfaceId: conn.target.interfaceId || conn.target.pinId || '',
        type: conn.target.type || 'pin',
        pinId: conn.target.pinId || conn.target.interfaceId,
      };

      const k1 = this.getKey(srcEp);
      const k2 = this.getKey(tgtEp);

      this.endpointMap.set(k1, srcEp);
      this.endpointMap.set(k2, tgtEp);
      this.addEdge(k1, k2);
    }
  }

  /**
   * Returns all endpoints electrically connected to the given endpoint (via BFS traversal).
   */
  public getConnectedEndpoints(startEndpoint: ConnectionEndpoint): ConnectionEndpoint[] {
    const startKey = this.getKey(startEndpoint);
    if (!this.adjacency.has(startKey)) return [];

    const visited = new Set<string>();
    const queue = [startKey];
    visited.add(startKey);

    const results: ConnectionEndpoint[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          const ep = this.endpointMap.get(neighbor);
          if (ep) {
            results.push(ep);
          }
        }
      }
    }

    return results;
  }

  /**
   * Tests whether two endpoints are electrically connected through any path
   * (wires, connectors, breadboard nodes).
   */
  public areConnected(ep1: ConnectionEndpoint, ep2: ConnectionEndpoint): boolean {
    const k1 = this.getKey(ep1);
    const k2 = this.getKey(ep2);
    if (k1 === k2) return true;

    const connected = this.getConnectedEndpoints(ep1);
    return connected.some((c) => this.getKey(c) === k2);
  }

  /**
   * Extracts all distinct electrical nets across the entire circuit.
   */
  public getElectricalNets(): ElectricalNet[] {
    const visited = new Set<string>();
    const nets: ElectricalNet[] = [];
    let netIdx = 1;

    for (const [key, endpoint] of this.endpointMap.entries()) {
      if (visited.has(key)) continue;

      const groupKeys = new Set<string>();
      const queue = [key];
      visited.add(key);
      groupKeys.add(key);

      while (queue.length > 0) {
        const cur = queue.shift()!;
        const neighbors = this.adjacency.get(cur) || [];
        for (const n of neighbors) {
          if (!visited.has(n)) {
            visited.add(n);
            groupKeys.add(n);
            queue.push(n);
          }
        }
      }

      // Only count if there is more than 1 endpoint connected or an active external connection
      if (groupKeys.size > 1) {
        const endpoints = Array.from(groupKeys)
          .map((k) => this.endpointMap.get(k)!)
          .filter(Boolean);

        nets.push({
          id: `net_${netIdx++}`,
          endpoints,
          connections: [],
          netType: 'signal',
        });
      }
    }

    return nets;
  }
}
