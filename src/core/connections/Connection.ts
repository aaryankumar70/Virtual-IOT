export type ConnectionType =
  | 'wire'
  | 'direct'
  | 'header'
  | 'plug-socket'
  | 'usb'
  | 'dc-power'
  | 'breadboard';

export type PhysicalConnectionType = ConnectionType;

export type EndpointType =
  | 'pin'
  | 'connector'
  | 'socket'
  | 'port'
  | 'breadboard-hole';

export interface ConnectionEndpoint {
  componentId: string;
  interfaceId?: string; // pinId, connectorId, portId, or breadboard holeId
  type?: EndpointType;
  pinId?: string; // Backwards-compatible accessor: equal to interfaceId if type === 'pin' or 'breadboard-hole'
}

// Backwards-compatible alias so existing code importing PinEndpoint still works cleanly
export type PinEndpoint = ConnectionEndpoint;

export interface ConnectionMetadata {
  connectorType?: string;
  pinMapping?: Record<string, string>;
  cableColor?: string;
  length?: number;
  label?: string;
  breadboardNodeId?: string;
  orientation?: { x: number; y: number; z: number };
  protocol?: string;
  voltage?: string | number;
  [key: string]: unknown;
}

export interface Connection {
  id: string;
  type: ConnectionType;
  source: ConnectionEndpoint;
  target: ConnectionEndpoint;
  color?: string;
  metadata?: ConnectionMetadata;
}
