import { VirtualComponent } from '../components/VirtualComponent';
import { Connection, ConnectionEndpoint } from '../connections/Connection';
import { ConnectionGraph, getBreadboardNodeId } from '../connections/connectionGraph';
import { VirtualPin } from '../pins/VirtualPin';

export interface ContinuityDiagnostic {
  id: string;
  type: 'short-circuit' | 'broken-path' | 'valid-connection' | 'warning';
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  componentIds: string[];
  connectionIds: string[];
  pinIds: string[];
}

export interface ContinuityReport {
  isValid: boolean;
  hasShortCircuit: boolean;
  hasBrokenPaths: boolean;
  totalValid: number;
  totalShorts: number;
  totalBroken: number;
  validConnectionIds: Set<string>;
  shortCircuitConnectionIds: Set<string>;
  brokenConnectionIds: Set<string>;
  validPinKeys: Set<string>;
  shortPinKeys: Set<string>;
  diagnostics: ContinuityDiagnostic[];
}

/**
 * Web Audio API DMM Continuity Buzzer
 */
class ContinuityAudio {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playContinuityBeep(durationMs = 200) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1450, this.ctx.currentTime); // Standard multimeter continuity tone
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + durationMs / 1000);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playShortWarningTone() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const continuityAudio = new ContinuityAudio();

/**
 * Checks full circuit continuity, detects short circuits, and highlights valid and broken paths.
 */
export function checkContinuity(
  components: VirtualComponent[],
  connections: Connection[]
): ContinuityReport {
  const validConnectionIds = new Set<string>();
  const shortCircuitConnectionIds = new Set<string>();
  const brokenConnectionIds = new Set<string>();
  const validPinKeys = new Set<string>();
  const shortPinKeys = new Set<string>();
  const diagnostics: ContinuityDiagnostic[] = [];

  if (components.length === 0 || connections.length === 0) {
    return {
      isValid: true,
      hasShortCircuit: false,
      hasBrokenPaths: false,
      totalValid: 0,
      totalShorts: 0,
      totalBroken: 0,
      validConnectionIds,
      shortCircuitConnectionIds,
      brokenConnectionIds,
      validPinKeys,
      shortPinKeys,
      diagnostics,
    };
  }

  const graph = new ConnectionGraph(components, connections);
  const nets = graph.getElectricalNets();

  // Helper mapping: componentId -> VirtualComponent
  const compMap = new Map<string, VirtualComponent>();
  components.forEach((c) => compMap.set(c.id, c));

  // Helper mapping: endpoint key -> pin
  const findPin = (ep: ConnectionEndpoint): VirtualPin | null => {
    const comp = compMap.get(ep.componentId);
    if (!comp) return null;
    const pinId = ep.pinId || ep.interfaceId;
    return comp.pins?.find((p) => p.id === pinId) || null;
  };

  // Helper: map connection to its endpoints
  const connEpMap = new Map<string, { srcKey: string; tgtKey: string }>();
  connections.forEach((conn) => {
    const srcKey = `${conn.source.componentId}:${conn.source.pinId || conn.source.interfaceId}`;
    const tgtKey = `${conn.target.componentId}:${conn.target.pinId || conn.target.interfaceId}`;
    connEpMap.set(conn.id, { srcKey, tgtKey });
  });

  // 1. CHECK FOR DIRECT SHORT CIRCUITS (VCC <-> GND)
  nets.forEach((net, netIdx) => {
    let hasPower = false;
    let hasGround = false;
    let powerPinName = '';
    let groundPinName = '';
    const netCompIds = new Set<string>();
    const netPinKeys = new Set<string>();

    net.endpoints.forEach((ep) => {
      const key = `${ep.componentId}:${ep.pinId || ep.interfaceId}`;
      netPinKeys.add(key);
      netCompIds.add(ep.componentId);

      const pin = findPin(ep);
      if (pin) {
        if (pin.type === 'power' || pin.id.includes('5v') || pin.id.includes('3v3') || pin.id.includes('vin') || pin.id.includes('rail_top_plus') || pin.id.includes('rail_bot_plus')) {
          hasPower = true;
          powerPinName = pin.name || pin.id;
        }
        if (pin.type === 'ground' || pin.id.includes('gnd') || pin.id.includes('rail_top_minus') || pin.id.includes('rail_bot_minus')) {
          hasGround = true;
          groundPinName = pin.name || pin.id;
        }
      }
    });

    if (hasPower && hasGround) {
      // VCC-GND Direct Short Circuit!
      const shortConns = connections.filter((conn) => {
        const info = connEpMap.get(conn.id);
        if (!info) return false;
        return netPinKeys.has(info.srcKey) || netPinKeys.has(info.tgtKey);
      });

      shortConns.forEach((c) => shortCircuitConnectionIds.add(c.id));
      netPinKeys.forEach((k) => shortPinKeys.add(k));

      diagnostics.push({
        id: `short-vcc-gnd-${netIdx}`,
        type: 'short-circuit',
        title: 'Direct VCC-to-GND Short Circuit',
        description: `High danger: Power line (${powerPinName}) is wired directly to Ground (${groundPinName}) with no resistive load! Disconnect immediately to prevent power overload.`,
        severity: 'error',
        componentIds: Array.from(netCompIds),
        connectionIds: shortConns.map((c) => c.id),
        pinIds: Array.from(netPinKeys),
      });
    }
  });

  // 2. CHECK FOR SELF-SHORTED 2-TERMINAL COMPONENTS (e.g. LED/resistor with both legs in same breadboard row or tied together)
  const twoLeadTypes = ['resistor', 'led', 'capacitor', 'capacitor-ceramic', 'diode'];
  components.forEach((comp) => {
    if (twoLeadTypes.includes(comp.type) && comp.pins && comp.pins.length >= 2) {
      const pin1 = comp.pins[0];
      const pin2 = comp.pins[1];
      const ep1: ConnectionEndpoint = {
        componentId: comp.id,
        interfaceId: pin1.id,
        pinId: pin1.id,
        type: 'pin',
      };
      const ep2: ConnectionEndpoint = {
        componentId: comp.id,
        interfaceId: pin2.id,
        pinId: pin2.id,
        type: 'pin',
      };

      if (graph.areConnected(ep1, ep2)) {
        // Both terminals of this component are shorted together!
        const key1 = `${comp.id}:${pin1.id}`;
        const key2 = `${comp.id}:${pin2.id}`;
        shortPinKeys.add(key1);
        shortPinKeys.add(key2);

        // Find connections attached to this component
        const compConns = connections.filter(
          (c) => c.source.componentId === comp.id || c.target.componentId === comp.id
        );
        compConns.forEach((c) => shortCircuitConnectionIds.add(c.id));

        diagnostics.push({
          id: `short-self-${comp.id}`,
          type: 'short-circuit',
          title: `Shorted Component: ${comp.name}`,
          description: `Both terminals (${pin1.name} and ${pin2.name}) are electrically connected to the same row or node. Current bypasses the component completely.`,
          severity: 'error',
          componentIds: [comp.id],
          connectionIds: compConns.map((c) => c.id),
          pinIds: [key1, key2],
        });
      }
    }
  });

  // 3. CHECK FOR BROKEN PATHS / OPEN CIRCUITS
  // Check for components with only 1 connected pin while having 2+ pins
  components.forEach((comp) => {
    if (comp.type === 'breadboard' || !comp.pins || comp.pins.length < 2) return;

    const connectedPins = comp.pins.filter((pin) => {
      const ep: ConnectionEndpoint = {
        componentId: comp.id,
        interfaceId: pin.id,
        pinId: pin.id,
        type: 'pin',
      };
      return graph.getConnectedEndpoints(ep).length > 0;
    });

    if (connectedPins.length > 0 && connectedPins.length < comp.pins.length) {
      const unconnectedPins = comp.pins.filter((p) => !connectedPins.includes(p));
      const connectedConns = connections.filter(
        (c) => c.source.componentId === comp.id || c.target.componentId === comp.id
      );

      // Flag as broken path / open circuit
      unconnectedPins.forEach((p) => {
        diagnostics.push({
          id: `broken-open-${comp.id}-${p.id}`,
          type: 'broken-path',
          title: `Open Circuit: ${comp.name} (${p.name} unconnected)`,
          description: `Terminal ${p.name} is disconnected. The electrical path is broken; electric current cannot circulate without a complete circuit loop.`,
          severity: 'warning',
          componentIds: [comp.id],
          connectionIds: connectedConns.map((c) => c.id),
          pinIds: [`${comp.id}:${p.id}`],
        });
      });

      // Mark attached connections as broken if part of an incomplete open loop
      connectedConns.forEach((c) => {
        if (!shortCircuitConnectionIds.has(c.id)) {
          brokenConnectionIds.add(c.id);
        }
      });
    }
  });

  // 4. CHECK VALID CONTINUOUS CONNECTIONS
  // All connections that are not short circuits and carry signals or complete paths
  connections.forEach((conn) => {
    if (shortCircuitConnectionIds.has(conn.id)) return;

    if (brokenConnectionIds.has(conn.id)) return;

    // This connection has continuity and is valid!
    validConnectionIds.add(conn.id);

    const srcKey = `${conn.source.componentId}:${conn.source.pinId || conn.source.interfaceId}`;
    const tgtKey = `${conn.target.componentId}:${conn.target.pinId || conn.target.interfaceId}`;
    validPinKeys.add(srcKey);
    validPinKeys.add(tgtKey);
  });

  // If there are valid connections, record a summary diagnostic
  if (validConnectionIds.size > 0) {
    diagnostics.push({
      id: 'valid-continuity-summary',
      type: 'valid-connection',
      title: `${validConnectionIds.size} Valid Continuous Electrical Path${validConnectionIds.size > 1 ? 's' : ''}`,
      description: 'Continuous electrical conduits verified with zero short circuits and complete signal integrity.',
      severity: 'success',
      componentIds: Array.from(new Set(connections.map((c) => c.source.componentId).concat(connections.map((c) => c.target.componentId)))),
      connectionIds: Array.from(validConnectionIds),
      pinIds: Array.from(validPinKeys),
    });
  }

  return {
    isValid: shortCircuitConnectionIds.size === 0 && brokenConnectionIds.size === 0,
    hasShortCircuit: shortCircuitConnectionIds.size > 0,
    hasBrokenPaths: brokenConnectionIds.size > 0,
    totalValid: validConnectionIds.size,
    totalShorts: shortCircuitConnectionIds.size,
    totalBroken: brokenConnectionIds.size,
    validConnectionIds,
    shortCircuitConnectionIds,
    brokenConnectionIds,
    validPinKeys,
    shortPinKeys,
    diagnostics,
  };
}

/**
 * Checks continuity between two specific probe endpoints.
 */
export function testPinContinuity(
  components: VirtualComponent[],
  connections: Connection[],
  pin1: { componentId: string; pinId: string },
  pin2: { componentId: string; pinId: string }
): {
  isContinuous: boolean;
  isShortCircuit: boolean;
  resistanceEstimate: string;
  message: string;
} {
  const ep1: ConnectionEndpoint = {
    componentId: pin1.componentId,
    interfaceId: pin1.pinId,
    pinId: pin1.pinId,
    type: 'pin',
  };
  const ep2: ConnectionEndpoint = {
    componentId: pin2.componentId,
    interfaceId: pin2.pinId,
    pinId: pin2.pinId,
    type: 'pin',
  };

  const graph = new ConnectionGraph(components, connections);
  const isContinuous = graph.areConnected(ep1, ep2);

  if (!isContinuous) {
    return {
      isContinuous: false,
      isShortCircuit: false,
      resistanceEstimate: '∞ Ω (Open)',
      message: 'Open Circuit: No electrical continuity between probe leads.',
    };
  }

  // Check if this connection forms a direct short between power and ground
  const comp1 = components.find((c) => c.id === pin1.componentId);
  const comp2 = components.find((c) => c.id === pin2.componentId);
  const p1 = comp1?.pins?.find((p) => p.id === pin1.pinId);
  const p2 = comp2?.pins?.find((p) => p.id === pin2.pinId);

  const isPower1 = p1?.type === 'power' || p1?.id.includes('5v') || p1?.id.includes('3v3') || p1?.id.includes('rail_top_plus') || p1?.id.includes('rail_bot_plus');
  const isGround1 = p1?.type === 'ground' || p1?.id.includes('gnd') || p1?.id.includes('rail_top_minus') || p1?.id.includes('rail_bot_minus');
  const isPower2 = p2?.type === 'power' || p2?.id.includes('5v') || p2?.id.includes('3v3') || p2?.id.includes('rail_top_plus') || p2?.id.includes('rail_bot_plus');
  const isGround2 = p2?.type === 'ground' || p2?.id.includes('gnd') || p2?.id.includes('rail_top_minus') || p2?.id.includes('rail_bot_minus');

  if ((isPower1 && isGround2) || (isPower2 && isGround1)) {
    continuityAudio.playShortWarningTone();
    return {
      isContinuous: true,
      isShortCircuit: true,
      resistanceEstimate: '< 0.05 Ω (SHORT!)',
      message: 'Direct Short Circuit: VCC is bridged to Ground!',
    };
  }

  continuityAudio.playContinuityBeep(240);
  return {
    isContinuous: true,
    isShortCircuit: false,
    resistanceEstimate: '≈ 0.02 Ω (Continuous)',
    message: 'Continuity Verified: Low-resistance continuous path detected.',
  };
}
